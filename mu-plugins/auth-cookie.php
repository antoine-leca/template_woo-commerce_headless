<?php

/*=======================================
 *  JWT en cookie HttpOnly + jeton anti-CSRF
 *
 *  - Le jeton émis par jwt-auth (/jwt-auth/v1/token) n'est plus renvoyé au
 *    front : il est posé dans un cookie HttpOnly, inaccessible au JavaScript
 *    (une faille XSS ne peut donc plus l'exfiltrer).
 *  - A chaque requête REST, le cookie est recopié dans l'en-tête Authorization
 *    que jwt-auth sait lire : le reste de l'API n'a pas à changer.
 *  - Le navigateur joignant le cookie tout seul, une requête forgée depuis un
 *    autre site serait authentifiée : toute écriture authentifiée par le
 *    cookie exige donc l'en-tête X-CSRF-Token. Ce jeton est dérivé du JWT
 *    (HMAC), il change à chaque connexion et ne demande aucun stockage.
 *
 *  Front et API sur le même site (api.mondomaine.com / mondomaine.com, ou
 *  localhost en dev) : SameSite=Lax par défaut. Si le front est servi depuis
 *  un autre site (ex. *.vercel.app), définir dans wp-config.php :
 *      define('HEADLESS_AUTH_COOKIE_SAMESITE', 'None');
 *  (le cookie est alors forcément Secure, donc HTTPS obligatoire, et les
 *  navigateurs qui bloquent les cookies tiers, comme Safari, ne le garderont pas).
 *  =============================================*/

const HEADLESS_AUTH_COOKIE = 'wc_auth';
const HEADLESS_CSRF_HEADER = 'X-CSRF-Token';

// Routes accessibles sans session établie : la connexion et l'inscription
// créent la session, la déconnexion doit fonctionner même avec un jeton perdu.
const HEADLESS_CSRF_EXEMPT_ROUTES = [
    '/jwt-auth/v1/token',
    '/custom/v1/register',
    '/custom/v1/auth/logout',
];

function headless_auth_cookie_options($expires)
{
    $samesite = defined('HEADLESS_AUTH_COOKIE_SAMESITE') ? HEADLESS_AUTH_COOKIE_SAMESITE : 'Lax';

    return [
        'expires'  => $expires,
        'path'     => '/',
        'secure'   => is_ssl() || $samesite === 'None',
        'httponly' => true,
        'samesite' => $samesite,
    ];
}

function headless_auth_clear_cookie()
{
    setcookie(HEADLESS_AUTH_COOKIE, '', headless_auth_cookie_options(time() - YEAR_IN_SECONDS));
}

function headless_csrf_token_for($jwt)
{
    return hash_hmac('sha256', $jwt, wp_salt('nonce'));
}

function headless_base64url_decode($value)
{
    return base64_decode(strtr($value, '-_', '+/'));
}

/**
 * Charge utile du JWT si sa signature (HS256) est valide et qu'il n'a pas
 * expiré, null sinon. jwt-auth refait sa propre validation ensuite : ce
 * contrôle sert seulement à ne pas lui transmettre un cookie périmé, qu'il
 * rejetterait en bloquant toute la requête, même une page publique.
 */
function headless_auth_valid_payload($jwt)
{
    $parts = explode('.', $jwt);
    if (count($parts) !== 3 || !defined('JWT_AUTH_SECRET_KEY')) {
        return null;
    }

    [$header, $payload, $signature] = $parts;

    $expected = hash_hmac('sha256', $header . '.' . $payload, JWT_AUTH_SECRET_KEY, true);
    if (!hash_equals($expected, headless_base64url_decode($signature))) {
        return null;
    }

    $data = json_decode(headless_base64url_decode($payload), true);
    if (!is_array($data) || empty($data['exp']) || $data['exp'] < time()) {
        return null;
    }

    return $data;
}

/**
 * JWT du cookie si la requête courante s'authentifie par lui (et non par un
 * en-tête Authorization envoyé explicitement), null sinon.
 */
function headless_auth_cookie_jwt($value = null)
{
    static $jwt = null;

    if ($value !== null) {
        $jwt = $value;
    }

    return $jwt;
}

function headless_is_rest_request_uri()
{
    $uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';

    return strpos($uri, '/' . rest_get_url_prefix() . '/') !== false || isset($_GET['rest_route']);
}

// Avant jwt-auth (priorité 10) : on lui présente le cookie comme s'il
// s'agissait d'un en-tête Authorization.
add_filter('determine_current_user', function ($user) {
    if (
        empty($_COOKIE[HEADLESS_AUTH_COOKIE])
        || !empty($_SERVER['HTTP_AUTHORIZATION'])
        || !empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])
        || !headless_is_rest_request_uri()
    ) {
        return $user;
    }

    $jwt = (string) wp_unslash($_COOKIE[HEADLESS_AUTH_COOKIE]);

    if (!headless_auth_valid_payload($jwt)) {
        headless_auth_clear_cookie();
        return $user;
    }

    $_SERVER['HTTP_AUTHORIZATION'] = 'Bearer ' . $jwt;
    headless_auth_cookie_jwt($jwt);

    return $user;
}, 9);

// Connexion (et inscription, qui appelle le même endpoint) : le jeton part
// dans le cookie, le front ne reçoit que le jeton anti-CSRF.
add_filter('jwt_auth_token_before_dispatch', function ($response) {
    if (empty($response['token'])) {
        return $response;
    }

    $jwt     = $response['token'];
    $payload = json_decode(headless_base64url_decode(explode('.', $jwt)[1] ?? ''), true);
    $expires = !empty($payload['exp']) ? (int) $payload['exp'] : time() + WEEK_IN_SECONDS;

    setcookie(HEADLESS_AUTH_COOKIE, $jwt, headless_auth_cookie_options($expires));

    unset($response['token']);
    $response['csrf_token'] = headless_csrf_token_for($jwt);

    return $response;
}, 20);

// Vérification anti-CSRF des écritures authentifiées par le cookie.
add_filter('rest_pre_dispatch', function ($result, $server, $request) {
    if ($result !== null) {
        return $result;
    }

    $jwt = headless_auth_cookie_jwt();

    if (!$jwt || in_array($request->get_method(), ['GET', 'HEAD', 'OPTIONS'], true)) {
        return $result;
    }

    if (in_array(untrailingslashit($request->get_route()), HEADLESS_CSRF_EXEMPT_ROUTES, true)) {
        return $result;
    }

    $sent = (string) $request->get_header(HEADLESS_CSRF_HEADER);

    if (!hash_equals(headless_csrf_token_for($jwt), $sent)) {
        return new WP_Error('rest_csrf_invalid', 'Jeton de sécurité invalide. Rechargez la page.', ['status' => 403]);
    }

    return $result;
}, 11, 3);

add_action('rest_api_init', function () {
    // Au chargement de l'application : le front ne peut pas lire le cookie,
    // il demande donc au serveur s'il existe une session et récupère le
    // jeton anti-CSRF associé.
    register_rest_route('custom/v1', '/auth/session', [
        'methods'             => 'GET',
        'callback'            => 'headless_auth_session',
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('custom/v1', '/auth/logout', [
        'methods'             => 'POST',
        'callback'            => function () {
            headless_auth_clear_cookie();
            return rest_ensure_response(['success' => true]);
        },
        'permission_callback' => '__return_true',
    ]);
});

function headless_auth_session()
{
    $jwt  = headless_auth_cookie_jwt();
    $user = wp_get_current_user();

    if (!$jwt || !$user->exists()) {
        return rest_ensure_response(['authenticated' => false]);
    }

    return rest_ensure_response([
        'authenticated'     => true,
        'csrf_token'        => headless_csrf_token_for($jwt),
        'user_email'        => $user->user_email,
        'user_nicename'     => $user->user_nicename,
        'user_display_name' => $user->display_name,
        'first_name'        => get_user_meta($user->ID, 'first_name', true),
        'last_name'         => get_user_meta($user->ID, 'last_name', true),
    ]);
}

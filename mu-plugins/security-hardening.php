<?php

/*=======================================
 *  Durcissement de WordPress pour un usage headless
 *  - XML-RPC fermé : le front n'en a pas besoin, et system.multicall permet
 *    de tester des centaines de mots de passe en une seule requête.
 *  - Comptes non listables : /wp/v2/users et ?author=N donnaient les
 *    identifiants de connexion à n'importe quel visiteur.
 *  - Essais de connexion limités (jwt-auth ne limite rien).
 *  =============================================*/

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Adresse IP du visiteur, pour les limites de débit.
 *
 * Par défaut REMOTE_ADDR. Derrière un proxy ou un CDN, toutes les requêtes
 * arrivent de la même adresse et les limites s'appliqueraient à tout le monde
 * à la fois : définir alors dans wp-config.php l'en-tête que SEUL ce proxy
 * renseigne, par exemple
 *     define('HEADLESS_CLIENT_IP_HEADER', 'HTTP_X_FORWARDED_FOR');
 * Ne jamais le définir sans proxy : n'importe qui pourrait alors forger son
 * adresse. Pour X-Forwarded-For, on retient la dernière adresse de la liste
 * (celle que le proxy de confiance a ajoutée).
 */
function headless_client_ip()
{
    if (defined('HEADLESS_CLIENT_IP_HEADER') && !empty($_SERVER[HEADLESS_CLIENT_IP_HEADER])) {
        $addresses = array_map('trim', explode(',', (string) $_SERVER[HEADLESS_CLIENT_IP_HEADER]));
        $ip        = end($addresses);

        if (filter_var($ip, FILTER_VALIDATE_IP)) {
            return $ip;
        }
    }

    return isset($_SERVER['REMOTE_ADDR']) ? (string) $_SERVER['REMOTE_ADDR'] : 'unknown';
}

/* ── XML-RPC ─────────────────────────────────────────────────────────────── */

add_filter('xmlrpc_enabled', '__return_false');

// xmlrpc.php définit XMLRPC_REQUEST avant de charger WordPress : on coupe la
// requête ici, sans même répondre par les méthodes disponibles.
if (defined('XMLRPC_REQUEST') && XMLRPC_REQUEST) {
    status_header(403);
    header('Content-Type: text/plain; charset=UTF-8');
    echo 'XML-RPC désactivé.';
    exit;
}

/* ── Liste des comptes ───────────────────────────────────────────────────── */

// Les routes /wp/v2/users et /wp/v2/users/<id> disparaissent pour qui n'a pas
// le droit de lister les comptes. /wp/v2/users/me, utilisée par le front pour
// le compte connecté, reste en place.
add_filter('rest_endpoints', function ($endpoints) {
    if (current_user_can('list_users')) {
        return $endpoints;
    }

    unset($endpoints['/wp/v2/users'], $endpoints['/wp/v2/users/(?P<id>[\d]+)']);

    return $endpoints;
});

// ?author=1 redirigeait vers /author/<identifiant>/ ; les pages auteur n'ont
// aucun usage dans un site headless.
add_action('template_redirect', function () {
    if (is_user_logged_in()) {
        return;
    }

    if (isset($_GET['author']) || is_author()) {
        status_header(404);
        nocache_headers();
        exit;
    }
}, 1);

/* ── Limitation des essais de connexion ──────────────────────────────────── */

const HEADLESS_LOGIN_WINDOW        = 15 * MINUTE_IN_SECONDS;
const HEADLESS_LOGIN_MAX_PER_LOGIN = 5;  // essais ratés pour un même identifiant depuis une même adresse
const HEADLESS_LOGIN_MAX_PER_IP    = 20; // essais ratés d'une même adresse, tous identifiants confondus

function headless_is_login_request($request)
{
    return $request->get_method() === 'POST'
        && untrailingslashit($request->get_route()) === '/jwt-auth/v1/token';
}

function headless_login_keys($request)
{
    $ip    = headless_client_ip();
    $login = strtolower(trim((string) $request->get_param('username')));

    return [
        'login' => 'headless_login_' . md5($ip . '|' . $login),
        'ip'    => 'headless_login_ip_' . md5($ip),
    ];
}

add_filter('rest_pre_dispatch', function ($result, $server, $request) {
    if ($result !== null || !headless_is_login_request($request)) {
        return $result;
    }

    $keys = headless_login_keys($request);

    if (
        (int) get_transient($keys['login']) >= HEADLESS_LOGIN_MAX_PER_LOGIN
        || (int) get_transient($keys['ip']) >= HEADLESS_LOGIN_MAX_PER_IP
    ) {
        return new WP_Error(
            'too_many_attempts',
            'Trop de tentatives de connexion. Réessayez dans quelques minutes.',
            ['status' => 429]
        );
    }

    return $result;
}, 5, 3);

add_filter('rest_post_dispatch', function ($response, $server, $request) {
    if (!headless_is_login_request($request) || !($response instanceof WP_REST_Response)) {
        return $response;
    }

    $keys   = headless_login_keys($request);
    $status = $response->get_status();

    if ($status === 429) {
        return $response;
    }

    if ($status >= 400) {
        set_transient($keys['login'], (int) get_transient($keys['login']) + 1, HEADLESS_LOGIN_WINDOW);
        set_transient($keys['ip'], (int) get_transient($keys['ip']) + 1, HEADLESS_LOGIN_WINDOW);
    } else {
        delete_transient($keys['login']);
    }

    return $response;
}, 10, 3);

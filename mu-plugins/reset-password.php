<?php

add_action('rest_api_init', function () {
    register_rest_route('custom/v1', '/reset-password', [
        'methods'             => 'POST',
        'callback'            => 'headless_reset_password',
        'permission_callback' => '__return_true',
    ]);
});

// Longueur des mots de passe : même règle qu'à l'inscription (register.php).
// Le maximum évite d'envoyer à bcrypt/phpass une chaîne démesurée.
const HEADLESS_PASSWORD_MIN_LENGTH = 8;
const HEADLESS_PASSWORD_MAX_LENGTH = 128;

/**
 * Au plus 5 demandes par heure et par adresse IP, et 3 par adresse e-mail :
 * sans cela la route sert à inonder la boîte de n'importe qui.
 */
function headless_reset_rate_limit_check($email)
{
    $ip = function_exists('headless_client_ip')
        ? headless_client_ip()
        : (isset($_SERVER['REMOTE_ADDR']) ? (string) $_SERVER['REMOTE_ADDR'] : 'unknown');

    $limits = [
        'headless_reset_ip_' . md5($ip)                  => 5,
        'headless_reset_mail_' . md5(strtolower($email)) => 3,
    ];

    foreach ($limits as $key => $max) {
        if ((int) get_transient($key) >= $max) {
            return false;
        }
    }

    foreach ($limits as $key => $max) {
        set_transient($key, (int) get_transient($key) + 1, HOUR_IN_SECONDS);
    }

    return true;
}

function headless_reset_password($request)
{
    $email = sanitize_email((string) $request->get_param('email'));

    if (empty($email) || !is_email($email)) {
        return new WP_Error('invalid_email', 'Adresse email invalide.', ['status' => 400]);
    }

    if (!headless_reset_rate_limit_check($email)) {
        return new WP_Error('too_many_requests', 'Trop de demandes. Réessayez dans une heure.', ['status' => 429]);
    }

    // Même réponse que le compte existe ou non : dire « aucun compte trouvé »
    // permettait de savoir quelles adresses sont inscrites.
    $response = rest_ensure_response([
        'message' => 'Si un compte existe avec cet email, un lien de réinitialisation vient de lui être envoyé.',
    ]);

    $user = get_user_by('email', $email);

    if (!$user) {
        return $response;
    }

    $key = get_password_reset_key($user);

    if (is_wp_error($key)) {
        error_log('[reset-password] génération du lien impossible : ' . $key->get_error_message());
        return $response;
    }

    // URL du front : HEADLESS_FRONT_URL (définie dans emails.php, à redéfinir
    // dans wp-config.php en production).
    $front_url  = defined('HEADLESS_FRONT_URL') ? HEADLESS_FRONT_URL : 'http://localhost:5173';
    $reset_link = untrailingslashit($front_url)
        . '/new-password?login=' . rawurlencode($user->user_login)
        . '&key=' . rawurlencode($key);

    wp_mail(
        $email,
        'Réinitialisation de votre mot de passe',
        "Cliquez sur ce lien pour réinitialiser votre mot de passe :\n\n{$reset_link}"
    );

    return $response;
}

add_action('rest_api_init', function () {
    register_rest_route('custom/v1', '/new-password', [
        'methods'             => 'POST',
        'callback'            => 'headless_new_password',
        'permission_callback' => '__return_true',
    ]);
});

function headless_new_password($request)
{
    $key      = (string) $request->get_param('key');
    $login    = (string) $request->get_param('login');
    $password = (string) $request->get_param('password');

    if ($key === '' || $login === '' || $password === '') {
        return new WP_Error('missing_fields', 'Tous les champs sont requis.', ['status' => 400]);
    }

    if (strlen($password) < HEADLESS_PASSWORD_MIN_LENGTH) {
        return new WP_Error(
            'weak_password',
            'Le mot de passe doit contenir au moins ' . HEADLESS_PASSWORD_MIN_LENGTH . ' caractères.',
            ['status' => 400]
        );
    }

    if (strlen($password) > HEADLESS_PASSWORD_MAX_LENGTH) {
        return new WP_Error(
            'password_too_long',
            'Le mot de passe ne doit pas dépasser ' . HEADLESS_PASSWORD_MAX_LENGTH . ' caractères.',
            ['status' => 400]
        );
    }

    $user = check_password_reset_key($key, $login);

    if (is_wp_error($user)) {
        return new WP_Error('invalid_key', 'Lien invalide ou expiré.', ['status' => 400]);
    }

    reset_password($user, $password);

    return rest_ensure_response(['message' => 'Mot de passe modifié avec succès.']);
}

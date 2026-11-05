<?php

/*=======================================
 *  Endpoint API pour le formulaire Contact
 *  Validation sécurisée + envoi d'email
 *  =============================================*/

if (!defined('ABSPATH')) {
    exit;
}

// Enregistrer l'endpoint
add_action('rest_api_init', function () {
    register_rest_route('custom/v1', '/contact', array(
        'methods' => 'POST',
        'callback' => 'handle_contact_form',
        'permission_callback' => '__return_true',
    ));
});

function handle_contact_form($request) {
    // Récupérer les données
    $params = $request->get_json_params();
    $name = isset($params['name']) ? $params['name'] : '';
    $email = isset($params['email']) ? $params['email'] : '';
    $message = isset($params['message']) ? $params['message'] : '';

    // Champ piège : invisible pour un visiteur, rempli par la plupart des
    // robots. On répond « envoyé » sans rien envoyer, pour ne pas leur
    // apprendre qu'ils ont été repérés.
    if (!empty($params['website'])) {
        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Message envoyé avec succès!',
        ), 200);
    }

    // Valider et nettoyer les données
    $errors = array();

    // Valider nom
    $name = sanitize_text_field((string) $name);
    if (empty($name) || mb_strlen($name) < 2) {
        $errors['name'] = 'Le nom est requis (minimum 2 caractères)';
    } elseif (mb_strlen($name) > 100) {
        $errors['name'] = 'Le nom est trop long (maximum 100 caractères)';
    }

    // Valider email
    $email = sanitize_email((string) $email);
    if (empty($email) || !is_email($email)) {
        $errors['email'] = 'Un email valide est requis';
    }

    // Valider message
    $message = sanitize_textarea_field((string) $message);
    if (empty($message) || mb_strlen($message) < 10) {
        $errors['message'] = 'Le message est requis (minimum 10 caractères)';
    } elseif (mb_strlen($message) > 5000) {
        $errors['message'] = 'Le message est trop long (maximum 5000 caractères)';
    }

    // Si erreurs, retourner
    if (!empty($errors)) {
        return new WP_REST_Response(array(
            'success' => false,
            'errors' => $errors,
        ), 400);
    }

    // Vérifier rate limiting (max 3 emails par IP en 1 heure)
    $ip = function_exists('headless_client_ip')
        ? headless_client_ip()
        : sanitize_text_field($_SERVER['REMOTE_ADDR']);
    $cache_key = 'contact_form_' . md5($ip);
    $count = get_transient($cache_key);

    if ($count >= 3) {
        return new WP_REST_Response(array(
            'success' => false,
            'message' => 'Trop de messages envoyés. Veuillez réessayer dans une heure.',
        ), 429);
    }

    // Incrémenter le compteur
    set_transient($cache_key, ($count ?? 0) + 1, HOUR_IN_SECONDS);

    // Récupérer l'email du magasin
    $to = get_option('admin_email');
    $subject = 'Nouveau message de contact - ' . $name;

    // Construire le contenu de l'email
    $body = "Nouveau message reçu:\n\n";
    $body .= "Nom: " . wp_kses_post($name) . "\n";
    $body .= "Email: " . wp_kses_post($email) . "\n";
    $body .= "Message:\n" . wp_kses_post($message) . "\n";

    // En-têtes
    $headers = array('Content-Type: text/plain; charset=UTF-8');
    $headers[] = 'From: ' . wp_kses_post($name) . ' <' . $email . '>';

    // Envoyer l'email
    $send = wp_mail($to, $subject, $body, $headers);

    if (!$send) {
        return new WP_REST_Response(array(
            'success' => false,
            'message' => 'Erreur lors de l\'envoi du message. Veuillez réessayer.',
        ), 500);
    }

    // Email de confirmation à l'utilisateur
    $reply_subject = 'Merci pour votre message';
    $reply_body = "Bonjour,\n\nMerci pour votre message. Nous vous répondrons dans les meilleurs délais.\n\nCordialement,\nL'équipe";
    wp_mail($email, $reply_subject, $reply_body);

    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Message envoyé avec succès!',
    ), 200);
}

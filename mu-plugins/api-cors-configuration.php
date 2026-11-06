<?php
/**
 * CORS Configuration for REST API
 * Sends Access-Control-Allow-Origin header for allowed origins
 */

if (!defined('ABSPATH')) {
    exit;
}

// List of allowed origins
$allowed_origins = array(
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://10.60.4.51:5173',
    'https://template-woo-commerce-headless.vercel.app',
);

// Origines supplémentaires (autre domaine de production, déploiement de
// prévisualisation) : à déclarer dans wp-config.php plutôt qu'à ajouter ici,
// par exemple
//     define('HEADLESS_EXTRA_ALLOWED_ORIGINS', ['https://www.mondomaine.com']);
// Une origine n'a jamais de « / » final : un navigateur n'en envoie pas, ces
// variantes ne servaient à rien. Les anciennes URL de prévisualisation Vercel
// ont été retirées : une prévisualisation périmée n'a pas à parler à l'API.
if (defined('HEADLESS_EXTRA_ALLOWED_ORIGINS') && is_array(HEADLESS_EXTRA_ALLOWED_ORIGINS)) {
    $allowed_origins = array_merge($allowed_origins, HEADLESS_EXTRA_ALLOWED_ORIGINS);
}

// Hook VERY early - at plugins_loaded priority 0 which runs AFTER mu-plugins are loaded
add_action('plugins_loaded', function() use ($allowed_origins) {
    // Only for REST API requests
    if (defined('REST_REQUEST') && REST_REQUEST) {
        $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

        if ($origin && in_array($origin, $allowed_origins, true)) {
            header('Access-Control-Allow-Origin: ' . $origin, true);
        }
    }
}, 0);

// Also try with rest_api_init
add_action('rest_api_init', function() use ($allowed_origins) {
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

    if ($origin && in_array($origin, $allowed_origins, true)) {
        header('Access-Control-Allow-Origin: ' . $origin, true);
    }
}, 0);

// Origines que WordPress lui-même considère comme sûres (is_allowed_http_origin).
// C'est ce que consulte le Store API de WooCommerce pour décider s'il répond à
// une origine donnée.
add_filter('allowed_http_origins', function($origins) use ($allowed_origins) {
    return array_values(array_unique(array_merge($origins, $allowed_origins)));
});

// Liste blanche stricte.
// La fonction de WordPress (rest_send_cors_headers) répond
// « Access-Control-Allow-Origin: <origine de la requête> » avec
// « Access-Control-Allow-Credentials: true » à N'IMPORTE QUELLE origine : la
// liste ci-dessus ne restreignait rien. Dès que le cookie d'authentification
// part d'un site à l'autre (front et API sur deux domaines,
// HEADLESS_AUTH_COOKIE_SAMESITE à « None »), n'importe quel site pourrait lire
// les réponses du compte connecté. On la remplace par une version qui
// n'autorise que les origines de la liste.
add_action('rest_api_init', function() use ($allowed_origins) {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');

    add_filter('rest_pre_serve_request', function($served) use ($allowed_origins) {
        $origin = get_http_origin();

        if ($origin && in_array($origin, $allowed_origins, true)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Access-Control-Allow-Methods: OPTIONS, GET, POST, PUT, PATCH, DELETE');
            header('Access-Control-Allow-Credentials: true');

            // Le navigateur garde la réponse du preflight (2 h au plus, plafond
            // de Chrome) au lieu de redemander l'autorisation avant chaque
            // requête vers la même adresse.
            if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
                header('Access-Control-Max-Age: 7200');
            }
        }

        // La réponse dépend de l'origine : les caches doivent le savoir.
        header('Vary: Origin', false);

        return $served;
    });
}, 99);

// En-têtes que le front envoie (preflight) et lit (exposés).
// - X-CSRF-Token : jeton anti-CSRF des écritures (auth-cookie.php)
// - Nonce, Cart-Token : session panier du Store API. Ils sont aussi ajoutés
//   par WooCommerce sur ses propres routes ; Nonce est exposé ici car le
//   front le lit dans les réponses (WooCommerce n'expose que Cart-Token).
// Passer par ces filtres, plutôt que par header(), fonctionne aussi sur le
// Store API : il met fin aux requêtes preflight lui-même.
add_filter('rest_allowed_cors_headers', function($headers) {
    return array_unique(array_merge($headers, ['X-CSRF-Token', 'Nonce', 'Cart-Token']));
});

add_filter('rest_exposed_cors_headers', function($headers) {
    return array_unique(array_merge($headers, ['Nonce', 'Cart-Token']));
});

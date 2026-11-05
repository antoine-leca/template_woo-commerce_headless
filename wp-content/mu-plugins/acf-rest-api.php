<?php
/**
 * Plugin Name: ACF REST API
 * Description: Expose les champs ACF à l'API REST
 * Version: 1.0
 */

// La route de debug acf/v1/debug/<id>, qui renvoyait sans authentification
// toutes les métadonnées de n'importe quel contenu (adresses et téléphones des
// commandes compris), a été supprimée.

function add_acf_to_rest_response($response, $post, $request) {
  $post_id = $post->ID;

  $acf_data = array(
    'hero_video' => wp_get_attachment_url(get_post_meta($post_id, 'hero_video', true)) ?: null,
    'site_logo_custom' => wp_get_attachment_url(get_post_meta($post_id, 'site_logo_custom', true)) ?: null,
    'hero_title' => get_post_meta($post_id, 'hero_title', true)
  );

  $response->data['acf'] = array_filter($acf_data);
  return $response;
}

add_filter('rest_prepare_page', 'add_acf_to_rest_response', 10, 3);

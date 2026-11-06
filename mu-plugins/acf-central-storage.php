<?php

/*=======================================
 *  Une valeur par champ, quel que soit l'endroit où on la modifie
 *
 *  Certains groupes ACF s'affichent sur plusieurs pages de l'admin : les
 *  informations légales sur chaque page légale (mentions, CGV, confidentialité,
 *  cookies, en français et en anglais), les textes du contact sur les deux pages
 *  Contact. Or ACF enregistre une valeur sur la page qu'on est en train de
 *  modifier : l'adresse saisie sur « Mentions légales » ne serait pas celle de
 *  « Politique de confidentialité », ni celle de leurs versions anglaises.
 *
 *  Ce fichier garde donc une seule valeur par champ, sur la page « Paramètres du
 *  site » (HEADLESS_SETTINGS_PAGE_ID), que l'API et le front lisent. Sur
 *  n'importe quelle autre page, ACF lit et écrit à cet endroit, sans que
 *  l'éditeur ait à s'en soucier.
 *
 *  Concerne les champs « txt__… » (textes du site) et « legal_… » (informations
 *  légales). Les autres champs (vidéo, logo, traductions des produits...) gardent
 *  leur comportement habituel : une valeur par page, par produit.
 *  =============================================*/

if (!defined('ABSPATH')) {
    exit;
}

const HEADLESS_CENTRAL_FIELD_PREFIXES = ['txt__', 'legal_'];

function headless_settings_page_id()
{
    return defined('HEADLESS_SETTINGS_PAGE_ID') ? (int) HEADLESS_SETTINGS_PAGE_ID : 54;
}

/**
 * Identifiant de la page où se trouve la valeur de ce champ, ou null quand le
 * champ n'est pas centralisé ou qu'on est déjà sur cette page.
 */
function headless_central_post_id($post_id, $field)
{
    $name = isset($field['name']) ? (string) $field['name'] : '';

    $is_central = false;
    foreach (HEADLESS_CENTRAL_FIELD_PREFIXES as $prefix) {
        if (strpos($name, $prefix) === 0) {
            $is_central = true;
            break;
        }
    }

    // Seuls les identifiants de contenu comptent ; « option », « user_2 »... sont laissés à ACF.
    if (!$is_central || !is_numeric($post_id)) {
        return null;
    }

    $central = headless_settings_page_id();

    if ((int) $post_id === $central || get_post_type((int) $post_id) !== 'page') {
        return null;
    }

    return $central;
}

// Lecture : le formulaire d'une page légale affiche la valeur commune.
add_filter('acf/pre_load_value', function ($value, $post_id, $field) {
    $central = headless_central_post_id($post_id, $field);

    return $central === null ? $value : acf_get_value($central, $field);
}, 10, 3);

// Écriture : l'enregistrement d'une page légale met à jour la valeur commune.
add_filter('acf/pre_update_value', function ($check, $value, $post_id, $field) {
    $central = headless_central_post_id($post_id, $field);

    return $central === null ? $check : acf_update_value($value, $central, $field);
}, 10, 4);

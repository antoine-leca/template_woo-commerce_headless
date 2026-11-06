<?php

/*=======================================
 *  Textes du site modifiables dans l'admin (champs ACF « Textes — … »)
 *
 *  Les groupes de champs sont dans mu-plugins/acf-json/, affichés sur la page
 *  « Paramètres du site ». Chaque champ s'appelle
 *      txt__<clé du dictionnaire, points remplacés par __>__<langue>
 *  par exemple txt__header__nav__home__fr pour la clé header.nav.home en
 *  français (src/i18n/locales/fr.json).
 *
 *  Cette route de l'API ajoute à la page des réglages un objet « texts » :
 *      { fr: { header: { nav: { home: "Accueil" } } }, en: { ... } }
 *  que le front superpose à ses dictionnaires (src/i18n/siteTexts.js). Un
 *  champ vide est omis : le texte d'origine du dictionnaire reste affiché.
 *  =============================================*/

if (!defined('ABSPATH')) {
    exit;
}

// Page « Paramètres du site » : même identifiant que celui lu par le front
// (src/thunkActionsCreator/siteThunk.jsx) et que la règle d'affichage des
// groupes ACF. À changer aux trois endroits.
if (!defined('HEADLESS_SETTINGS_PAGE_ID')) {
    define('HEADLESS_SETTINGS_PAGE_ID', 54);
}

const HEADLESS_TEXT_LANGUAGES = ['fr', 'en'];

function headless_collect_site_texts()
{
    $texts = array_fill_keys(HEADLESS_TEXT_LANGUAGES, []);

    foreach ((array) get_fields(HEADLESS_SETTINGS_PAGE_ID) as $name => $value) {
        if (strpos($name, 'txt__') !== 0 || !is_string($value) || trim($value) === '') {
            continue;
        }

        $path = explode('__', substr($name, strlen('txt__')));
        $lang = array_pop($path);

        if (!in_array($lang, HEADLESS_TEXT_LANGUAGES, true) || !$path) {
            continue;
        }

        $node = &$texts[$lang];
        foreach ($path as $part) {
            if (!isset($node[$part]) || !is_array($node[$part])) {
                $node[$part] = [];
            }
            $node = &$node[$part];
        }
        $node = $value;
        unset($node);
    }

    // Un objet vide, pas un tableau vide : le JSON reste { } et non [ ].
    foreach ($texts as $lang => $tree) {
        $texts[$lang] = $tree ?: new stdClass();
    }

    return $texts;
}

add_filter('rest_prepare_page', function ($response, $post) {
    if ((int) $post->ID !== (int) HEADLESS_SETTINGS_PAGE_ID || !function_exists('get_fields')) {
        return $response;
    }

    $response->data['acf'] = array_merge(
        (array) ($response->data['acf'] ?? []),
        ['texts' => headless_collect_site_texts()]
    );

    return $response;
}, 20, 2);

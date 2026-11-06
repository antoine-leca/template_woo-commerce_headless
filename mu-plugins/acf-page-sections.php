<?php

/*=======================================
 *  Pages entières modifiables via ACF (FAQ, CGV, mentions légales,
 *  confidentialité, cookies, à propos, contact — en français et en anglais).
 *
 *  ACF gratuit n'a pas de champ « répéteur » : chaque page porte donc des
 *  emplacements numérotés (sec_01_title / sec_01_level / sec_01_body, …),
 *  définis dans mu-plugins/acf-json/group_page_<ID>.json.
 *
 *  Dès qu'une section est remplie, l'API REST (/wp/v2/pages) renvoie ce
 *  contenu à la place de l'éditeur WordPress : le front n'a rien à changer,
 *  l'accordéon découpe toujours sur les titres h2/h3. Si aucune section n'est
 *  remplie, le contenu de l'éditeur reste servi tel quel.
 *  Les marqueurs [...] sont ensuite remplacés par acf-legal-placeholders.php
 *  (priorité 20, après celui-ci).
 *  =============================================*/

// Identifiants des pages de cette installation (français puis anglais).
if (!defined('HEADLESS_SECTION_PAGE_IDS')) {
    define('HEADLESS_SECTION_PAGE_IDS', [28, 84, 32, 102, 72, 90, 82, 92, 47, 108, 49, 110, 37, 114]);
}

const HEADLESS_SECTION_MAX = 60;

// FAQ : une rubrique (faq_RR_title) contient des questions (faq_RR_QQ_q) et leurs
// réponses (faq_RR_QQ_a). Jusqu’à 8 rubriques de 8 questions, définies dans
// acf-json/group_page_47.json et group_page_108.json.
if (!defined('HEADLESS_FAQ_PAGE_IDS')) {
    define('HEADLESS_FAQ_PAGE_IDS', [47, 108]);
}
const HEADLESS_FAQ_RUBRICS = 8;
const HEADLESS_FAQ_QUESTIONS = 8;

/** HTML de la FAQ : un titre h3 par rubrique (panneau), puis h4 (question) + réponse. */
function headless_faq_html($post_id)
{
    $html = '';
    for ($r = 1; $r <= HEADLESS_FAQ_RUBRICS; $r++) {
        $rr    = sprintf('%02d', $r);
        $title = trim((string) get_post_meta($post_id, "faq_{$rr}_title", true));
        $body  = '';
        for ($q = 1; $q <= HEADLESS_FAQ_QUESTIONS; $q++) {
            $qq       = sprintf('%02d', $q);
            $question = trim((string) get_post_meta($post_id, "faq_{$rr}_{$qq}_q", true));
            $answer   = trim((string) get_post_meta($post_id, "faq_{$rr}_{$qq}_a", true));
            if ($question === '' && $answer === '') continue;
            if ($question !== '') $body .= '<h4>' . esc_html($question) . "</h4>
";
            if ($answer !== '')   $body .= wpautop(wp_kses_post($answer)) . "
";
        }
        if ($title === '' && $body === '') continue;
        if ($title !== '') $html .= '<h3>' . esc_html($title) . "</h3>
";
        $html .= $body;
    }
    return $html;
}

/** Sections remplies d'une page : [['title'=>, 'level'=>, 'body'=>], …] */
function headless_page_sections($post_id)
{
    $sections = [];
    for ($i = 1; $i <= HEADLESS_SECTION_MAX; $i++) {
        $n = sprintf('%02d', $i);
        $title = trim((string) get_post_meta($post_id, "sec_{$n}_title", true));
        $body  = trim((string) get_post_meta($post_id, "sec_{$n}_body", true));
        if ($i > 1 && $title === '' && $body === '' && !metadata_exists('post', $post_id, "sec_{$n}_title")) {
            break; // plus aucun emplacement défini
        }
        if ($title === '' && $body === '') continue;
        $level = get_post_meta($post_id, "sec_{$n}_level", true) === 'h2' ? 'h2' : 'h3';
        $sections[] = ['title' => $title, 'level' => $level, 'body' => $body];
    }
    return $sections;
}

function headless_page_sections_html(array $sections)
{
    $html = '';
    foreach ($sections as $s) {
        if ($s['title'] !== '') {
            $html .= '<' . $s['level'] . '>' . esc_html($s['title']) . '</' . $s['level'] . ">\n";
        }
        if ($s['body'] !== '') {
            $html .= wpautop(wp_kses_post($s['body'])) . "\n";
        }
    }
    return $html;
}

add_filter('rest_prepare_page', function ($response, $post) {
    if (!in_array((int) $post->ID, HEADLESS_SECTION_PAGE_IDS, true)) return $response;

    if (in_array((int) $post->ID, HEADLESS_FAQ_PAGE_IDS, true)) {
        $html = headless_faq_html($post->ID);
        if (trim($html) === '') return $response;
    } else {
        $sections = headless_page_sections($post->ID);
        if (!$sections) return $response;
        $html = headless_page_sections_html($sections);
    }
    $response->data['content']['rendered'] = $html;

    // L'extrait sert de description SEO : on le tire du nouveau contenu, sauf
    // si une personne en a saisi un à la main.
    if (trim((string) $post->post_excerpt) === '') {
        $text = wp_trim_words(wp_strip_all_tags($html), 30, '…');
        $response->data['excerpt']['rendered'] = '<p>' . esc_html($text) . "</p>\n";
    }

    return $response;
}, 10, 2);

// Sur ces pages, le contenu se saisit dans les champs ACF : on retire
// l'éditeur WordPress pour qu'il n'y ait qu'un seul endroit où modifier.
add_action('admin_init', function () {
    $id = (int) ($_GET['post'] ?? $_POST['post_ID'] ?? 0);
    if ($id && in_array($id, HEADLESS_SECTION_PAGE_IDS, true)) {
        remove_post_type_support('page', 'editor');
    }
});

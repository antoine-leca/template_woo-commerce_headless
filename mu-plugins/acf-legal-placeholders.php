<?php

/*=======================================
 *  Pages légales : les marqueurs [...] remplacés par les champs ACF
 *
 *  Les mentions légales, les CGV, la politique de confidentialité et la
 *  politique des cookies contiennent des marqueurs à compléter, du genre
 *  [RAISON SOCIALE] ou [Numéro TVA si applicable]. Plutôt que de modifier le
 *  texte des pages, on renseigne les valeurs une fois, dans les groupes ACF
 *  « Informations légales — … » (affichés sur les pages légales concernées et
 *  sur « Paramètres du site », avec une seule valeur par champ : voir
 *  acf-central-storage.php) : ce fichier remplace chaque marqueur par sa valeur
 *  dans le contenu renvoyé par l'API.
 *
 *  - Un champ vide laisse le marqueur tel quel (visible, donc à compléter).
 *  - Les politiques écrivent leurs marqueurs entre doubles crochets,
 *    [[RAISON SOCIALE]] : les deux formes sont reconnues.
 *  - Un marqueur qui revient plusieurs fois avec des sens différents
 *    (« [DURÉE] » deux fois dans la politique de confidentialité) a un champ
 *    par occurrence, dans l'ordre où elles apparaissent dans la page.
 *
 *  Pour ajouter un marqueur : le déclarer dans headless_legal_placeholders(),
 *  avec le champ ACF correspondant (mu-plugins/acf-json/group_legal_*.json).
 *  =============================================*/

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Marqueur (sans les crochets) => champs ACF, dans l'ordre d'apparition.
 * Les marqueurs anglais et français d'un même sens pointent vers le même
 * champ quand la valeur ne dépend pas de la langue (une adresse), vers deux
 * champs _fr / _en sinon (une durée rédigée).
 */
function headless_legal_placeholders()
{
    return [
        // Identité (mentions légales, confidentialité)
        'Ton nom ou nom entreprise'    => ['legal_name'],
        'RAISON SOCIALE'               => ['legal_name'],
        'Your name or company name'    => ['legal_name'],
        'COMPANY NAME'                 => ['legal_name'],
        'FORME JURIDIQUE'              => ['legal_form'],
        'LEGAL FORM'                   => ['legal_form'],
        'MONTANT'                      => ['legal_capital'],
        'AMOUNT'                       => ['legal_capital'],
        'SIREN'                        => ['legal_siren'],
        'Numéro si applicable'         => ['legal_siret'],
        'Number if applicable'         => ['legal_siret'],
        'Numéro TVA si applicable'     => ['legal_vat'],
        'VAT number if applicable'     => ['legal_vat'],
        'Adresse'                      => ['legal_address'],
        'ADRESSE COMPLÈTE'             => ['legal_address'],
        'Address'                      => ['legal_address'],
        'FULL ADDRESS'                 => ['legal_address'],
        'Numéro'                       => ['legal_phone'],
        'Number'                       => ['legal_phone'],
        'Email de contact'             => ['legal_email'],
        'ADRESSE E-MAIL DE CONTACT'    => ['legal_email'],
        'Contact email'                => ['legal_email'],
        'CONTACT EMAIL ADDRESS'        => ['legal_email'],

        // Hébergeur
        'Nom hébergeur'                => ['legal_host_name'],
        'Host name'                    => ['legal_host_name'],
        'Adresse hébergeur'            => ['legal_host_address'],
        'Host address'                 => ['legal_host_address'],

        // CGV
        'Carte bancaire, PayPal, etc.' => ['legal_payment_methods_fr'],
        'Credit card, PayPal, etc.'    => ['legal_payment_methods_en'],
        '3-5'                          => ['legal_delivery_days'],

        // Confidentialité
        "LISTER NOMMÉMENT LES PRESTATAIRES ET, POUR CHACUN, LE PAYS D'HÉBERGEMENT DES DONNÉES" => ['legal_processors_fr'],
        'LIST THE SERVICE PROVIDERS BY NAME AND, FOR EACH, THE COUNTRY WHERE DATA IS HOSTED'    => ['legal_processors_en'],
        'DURÉE LÉGALE APPLICABLE'      => ['legal_retention_accounting_fr'],
        'APPLICABLE LEGAL PERIOD'      => ['legal_retention_accounting_en'],
        'DURÉE'                        => ['legal_retention_sessions_fr', 'legal_retention_contact_fr'],
        'DURATION'                     => ['legal_retention_sessions_en', 'legal_retention_contact_en'],
        'DÉLAI'                        => ['legal_reply_delay_fr'],
        'TIMEFRAME'                    => ['legal_reply_delay_en'],
        'EN FRANCE : MENTIONNER LA CNIL ET SON ADRESSE' => ['legal_authority_fr'],
        'IN FRANCE: MENTION THE CNIL AND ITS ADDRESS'   => ['legal_authority_en'],
        "SI VOUS UTILISEZ DES OUTILS DE MESURE D'AUDIENCE OU DE PUBLICITÉ, LES DÉCRIRE ICI ET METTRE EN PLACE UN BANDEAU DE CONSENTEMENT" => ['legal_audience_tools_fr'],
        'IF YOU USE AUDIENCE MEASUREMENT OR ADVERTISING TOOLS, DESCRIBE THEM HERE AND IMPLEMENT A CONSENT BANNER' => ['legal_audience_tools_en'],

        // Cookies
        'JJ MOIS AAAA'                 => ['legal_cookies_updated_fr'],
        'DD MONTH YYYY'                => ['legal_cookies_updated_en'],
        'DURÉES — VOIR LA DOCUMENTATION DU PRESTATAIRE' => ['legal_cookies_durations_fr'],
        'DURATION — SEE PROVIDER DOCUMENTATION'         => ['legal_cookies_durations_en'],
        "VÉRIFIER DANS L'ONGLET APPLICATION DU NAVIGATEUR SI D'AUTRES COOKIES WORDPRESS OU WOOCOMMERCE SONT DÉPOSÉS, ET LES AJOUTER SUR LE MÊME MODÈLE" => ['legal_cookies_other_fr'],
        "CHECK THE BROWSER'S APPLICATION TAB TO SEE IF OTHER WORDPRESS OR WOOCOMMERCE COOKIES ARE SET, AND ADD THEM USING THE SAME FORMAT" => ['legal_cookies_other_en'],
        "À CE JOUR, LA BOUTIQUE N'UTILISE AUCUN OUTIL DE MESURE D'AUDIENCE NI DE PUBLICITÉ CIBLÉE. SI CELA VENAIT À CHANGER, CETTE SECTION DOIT ÊTRE COMPLÉTÉE ET UN BANDEAU DE RECUEIL DU CONSENTEMENT MIS EN PLACE AVANT TOUT DÉPÔT." => ['legal_cookies_audience_fr'],
        "AS OF NOW, THE STORE DOES NOT USE ANY AUDIENCE MEASUREMENT OR TARGETED ADVERTISING TOOLS. SHOULD THIS CHANGE, THIS SECTION MUST BE UPDATED, AND A CONSENT BANNER IMPLEMENTED BEFORE ANY SUCH TOOLS ARE DEPLOYED." => ['legal_cookies_audience_en'],
        'URL DE LA POLITIQUE DU PRESTATAIRE'            => ['legal_cookies_provider_url'],
        'PROVIDER POLICY URL'                           => ['legal_cookies_provider_url'],
    ];
}

// Champs dont la valeur s'affiche en plusieurs lignes ou comme lien.
const HEADLESS_LEGAL_MULTILINE = [
    'legal_address', 'legal_host_address', 'legal_processors_fr', 'legal_processors_en',
    'legal_authority_fr', 'legal_authority_en', 'legal_audience_tools_fr', 'legal_audience_tools_en',
    'legal_cookies_other_fr', 'legal_cookies_other_en', 'legal_cookies_audience_fr', 'legal_cookies_audience_en',
];
const HEADLESS_LEGAL_LINKS = ['legal_cookies_provider_url'];

/**
 * Expression qui reconnaît un marqueur dans du HTML : [[X]] ou [X], avec les
 * espaces, apostrophes et tirets sous leur forme brute ou en entité HTML (le
 * contenu d'une page WordPress mélange les deux).
 */
function headless_legal_regex($token)
{
    $pattern = preg_quote($token, '~');
    $pattern = str_replace(' ', '(?:\s|&nbsp;|&#160;|\x{00A0})+', $pattern);
    $pattern = str_replace("'", "(?:'|&#8217;|&#039;|&#39;|&rsquo;|\x{2019})", $pattern);
    $pattern = str_replace('—', '(?:—|&#8212;|&mdash;)', $pattern);

    return '~(?:\[\[' . $pattern . '\]\]|\[' . $pattern . '\])~u';
}

/**
 * Valeur d'un champ prête à être insérée dans le HTML, ou null s'il est vide
 * (le marqueur reste alors en place).
 */
function headless_legal_value($field)
{
    static $cache = [];

    if (!array_key_exists($field, $cache)) {
        $raw = function_exists('get_field') ? get_field($field, HEADLESS_SETTINGS_PAGE_ID) : null;
        $cache[$field] = is_string($raw) && trim($raw) !== '' ? trim($raw) : null;
    }

    $value = $cache[$field];

    if ($value === null) {
        return null;
    }

    if (in_array($field, HEADLESS_LEGAL_LINKS, true)) {
        return '<a href="' . esc_url($value) . '" rel="noopener noreferrer">' . esc_html($value) . '</a>';
    }

    return in_array($field, HEADLESS_LEGAL_MULTILINE, true)
        ? nl2br(esc_html($value))
        : esc_html($value);
}

function headless_fill_legal_placeholders($html)
{
    if (strpos($html, '[') === false) {
        return $html;
    }

    foreach (headless_legal_placeholders() as $token => $fields) {
        $occurrence = 0;

        $html = preg_replace_callback(headless_legal_regex($token), function ($match) use (&$occurrence, $fields) {
            // Au-delà du dernier champ prévu, le dernier sert pour les suivants.
            $field = $fields[min($occurrence, count($fields) - 1)];
            $occurrence++;

            $value = headless_legal_value($field);

            return $value === null ? $match[0] : $value;
        }, $html);
    }

    return $html;
}

add_filter('rest_prepare_page', function ($response) {
    if (isset($response->data['content']['rendered'])) {
        $response->data['content']['rendered'] = headless_fill_legal_placeholders($response->data['content']['rendered']);
    }
    if (isset($response->data['excerpt']['rendered'])) {
        $response->data['excerpt']['rendered'] = headless_fill_legal_placeholders($response->data['excerpt']['rendered']);
    }

    return $response;
}, 20);

<?php

/*=======================================
 *  Champs ACF versionnés avec le code (ACF « Local JSON »)
 *
 *  Sans ce fichier, les groupes de champs ACF n'existent que dans la base de
 *  données de chaque site : ils ne sont pas dans le dépôt et n'arrivent pas en
 *  production avec le code. Ici, ACF
 *    - écrit un fichier .json dans mu-plugins/acf-json/ à chaque création ou
 *      modification d'un groupe dans l'admin (et supprime le fichier quand le
 *      groupe est supprimé) ;
 *    - relit ces fichiers : sur un site dont la base ne les connaît pas, ou a
 *      une version plus ancienne, l'écran Champs personnalisés propose
 *      « Synchroniser » (une action manuelle, rien n'est modifié tout seul).
 *
 *  Marche à suivre : créer ou modifier les champs dans l'admin comme
 *  d'habitude, commiter les fichiers de mu-plugins/acf-json/, puis, sur chaque
 *  autre site, copier ce dossier et cliquer sur « Synchroniser ».
 *
 *  Seule la structure des champs est versionnée ; les valeurs saisies (les
 *  textes eux-mêmes) restent dans la base de chaque site.
 *  =============================================*/

if (!defined('ABSPATH')) {
    exit;
}

// Dossier des fichiers JSON : à côté de ce fichier, donc partout où le dossier
// mu-plugins est copié.
function headless_acf_json_dir()
{
    return __DIR__ . '/acf-json';
}

// Écriture : ACF enregistre ici les groupes créés ou modifiés dans l'admin.
add_filter('acf/settings/save_json', function () {
    return headless_acf_json_dir();
});

// Lecture : ce dossier remplace celui du thème, il n'en existe aucun ici.
add_filter('acf/settings/load_json', function ($paths) {
    return [headless_acf_json_dir()];
});

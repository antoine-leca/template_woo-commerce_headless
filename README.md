# Storefront WooCommerce React

Ce projet est un front-end React/Vite prêt à brancher sur votre back-office WooCommerce.

## Démarrage

1. Installez les dépendances : `npm install`
2. Lancez le serveur de dev : `npm run dev`
3. Consultez le site en developpement sur : `http://localhost:5173`

## Configuration API

Le front utilise la variable suivante :

- `VITE_API_URL` dans le fichier .env.production, c'est ici que vous renseignerez l'adresse du site woocommerce

## Build

`npm run build`

## Config wordpress

1. creez un sous domaine api.mondomain.com pour deployer wordpress/woocommerce.
2. créez un dossier nommé mu-plugins (au même niveau que le dossier themes et plugins).
3. Créez un fichier nommé api-cors-configuration.php à l'intérieur, et collez ce code dedans :

```php
<?php
if (!defined('ABSPATH')) {
    exit;
}
add_filter('allowed_http_origins', function($origins) {$origins[] = 'https://mondomaine.com';
    return $origins;
});
```

## Champs ACF (textes globaux du site)

Les champs ACF sont versionnés avec le code (ACF « Local JSON ») : le mu-plugin
`mu-plugins/acf-json-sync.php` fait écrire à ACF un fichier par groupe de champs
dans `mu-plugins/acf-json/`.

**Ajouter ou modifier un champ**

1. Créer ou modifier le groupe dans l'admin WordPress, *Champs personnalisés*,
   comme d'habitude. ACF écrit le fichier `.json` correspondant.
2. Commiter les fichiers modifiés de `mu-plugins/acf-json/`.
3. Sur chaque autre site (production...), copier le dossier `mu-plugins`, puis
   ouvrir *Champs personnalisés* : un bandeau propose **Synchroniser**. Rien n'est
   modifié sans ce clic.

Seule la structure des champs est versionnée ; les textes saisis restent dans la
base de chaque site.

**Afficher un nouveau champ sur le site**

Un champ ACF n'atteint pas le front tout seul. Pour les réglages globaux (page
« Paramètres du site ») :

- exposer le champ dans `wp-content/mu-plugins/acf-rest-api.php`, qui énumère les
  champs renvoyés par l'API ;
- le lire dans `src/slices/siteSlice.jsx` (`setSiteSettings`), puis l'utiliser dans
  le composant voulu ;
- un texte à traduire a besoin de sa variante anglaise (champ `*_en`, comme pour
  les produits) ; le dictionnaire du front est `src/i18n/locales`.

## Wireframes

[Le lien Figma](https://www.figma.com/design/118Mfb9r0dApZskAojI4c4/Untitled?node-id=0-1&p=f)

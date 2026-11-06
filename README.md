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

### Où modifier quoi

Chaque groupe s'affiche sur la page WordPress de l'admin à laquelle il se rapporte ;
**tous** s'affichent aussi sur **Paramètres du site** (identifiant 54, lu par
`src/thunkActionsCreator/siteThunk.jsx`), qui sert de page centrale.

| Page WordPress (*Pages*, versions FR et EN) | Groupes affichés |
| --- | --- |
| Mentions légales (28, 84) | Informations légales : Identité de l'entreprise, Hébergeur |
| CGV (32, 102) | Informations légales : CGV |
| Politique de confidentialité (72, 90) | Informations légales : Identité de l'entreprise, Confidentialité |
| Politique des cookies (82, 92) | Informations légales : Identité de l'entreprise, Cookies |
| Contact (37, 114) | Textes — Contact |
| FAQ (47, 108), À propos (49, 110) | aucun : le contenu se modifie dans l'éditeur de la page |
| Paramètres du site (54) | tout : vidéo, logo et titre de l'accueil, tous les textes, toutes les informations légales |

Les pages du site sans page WordPress (accueil, catalogue, fiche produit, blog, favoris,
page 404, invitation à se connecter, confirmation de commande, titres SEO, navigation
et pied de page) se règlent dans les groupes « Textes — … » de **Paramètres du site**.

**Une seule valeur par champ.** Les groupes « Textes — … » et « Informations légales »
sont enregistrés sur la page 54, quelle que soit la page où on les modifie
(`mu-plugins/acf-central-storage.php`) : l'adresse saisie sur « Mentions légales » est
aussi celle de « Politique de confidentialité » et de leurs versions anglaises. Les
identifiants de pages ci-dessus sont ceux de cette installation ; sur un autre site, les
règles d'affichage des groupes (onglet *Emplacement* de chaque groupe) sont à vérifier.

**Ajouter ou modifier un champ**

1. Créer ou modifier le groupe dans l'admin WordPress, *Champs personnalisés*,
   comme d'habitude. ACF écrit le fichier `.json` correspondant.
2. Commiter les fichiers modifiés de `mu-plugins/acf-json/`.
3. Sur chaque autre site (production...), copier le dossier `mu-plugins`, puis
   ouvrir *Champs personnalisés* : un bandeau propose **Synchroniser**. Rien n'est
   modifié sans ce clic.

Seule la structure des champs est versionnée ; les textes saisis restent dans la
base de chaque site.

### Textes du site (groupes « Textes — … »)

Chaque texte rédactionnel du site (navigation, pied de page, catalogue, libellés
de la fiche produit, contact, blog, page 404, favoris, invitation à se connecter,
confirmation de commande, titres et descriptions SEO) a deux champs, un par langue,
rangés dans des onglets *Français* / *English*. Le nom d'un champ est la clé du
dictionnaire `src/i18n/locales` :

`header.nav.home` en français → `txt__header__nav__home__fr`

- **Champ rempli** : il remplace le texte d'origine, sans toucher au code
  (`src/i18n/siteTexts.js` le superpose au dictionnaire).
- **Champ vide** : le texte du dictionnaire s'affiche.
- Un texte qui contient `{{year}}`, `{{count}}`... doit les garder tels quels :
  ils sont remplacés automatiquement.
- Les valeurs d'origine ont été saisies d'après les dictionnaires. Si un texte
  est ensuite changé dans `fr.json`/`en.json` alors que son champ est rempli,
  c'est le champ qui s'affiche.

Restent dans le code, volontairement, les textes **fonctionnels** : panier,
paiement, connexion, compte, adresses, messages d'erreur, statuts de commande,
avis, boutons d'action et libellés d'accessibilité.

**Ajouter un texte modifiable** : créer le champ dans le groupe voulu en suivant le
nom ci-dessus (`txt__<clé avec __ à la place des points>__fr` et `__en`) ; rien
d'autre à faire, l'API l'expose (`mu-plugins/acf-site-texts.php`) et le front le
superpose.

### Pages entières (FAQ, CGV, mentions, confidentialité, cookies, à propos, contact)

Ces pages (en français et en anglais) se modifient **intégralement dans les champs ACF** de la page, dans Pages > la page concernée : l’éditeur WordPress y est retiré. Chaque page porte des sections numérotées (titre, niveau, texte complet avec mise en forme) ; les emplacements vides en bas permettent d’en ajouter. ACF gratuit n’a pas de répéteur, d’où les emplacements numérotés.

- Code : `mu-plugins/acf-page-sections.php` (liste des identifiants de pages dans `HEADLESS_SECTION_PAGE_IDS`) et `mu-plugins/acf-json/group_page_<ID>.json`.
- L’API `/wp/v2/pages` renvoie ces sections à la place du contenu de l’éditeur (titres h2/h3 pour l’accordéon, extrait SEO recalculé). Si aucune section n’est remplie, l’éditeur reste servi.
- Les marqueurs `[...]` du texte sont toujours remplacés par les « Informations légales » de « Paramètres du site ».
- Pas de page WordPress pour les CGU : cette page du front n’est pas modifiable (slug `conditions-generales-dutilisation-cgu` à créer si besoin).

### Informations légales (les `[...]` des pages légales)

Les mentions légales, les CGV, la politique de confidentialité et la politique des
cookies contiennent des marqueurs à compléter (`[RAISON SOCIALE]`,
`[Numéro TVA si applicable]`...). Au lieu de modifier ces pages, renseigner le
groupe **Informations légales** : `mu-plugins/acf-legal-placeholders.php` remplace
chaque marqueur par sa valeur dans le contenu renvoyé par l'API, en français comme
en anglais.

- Un champ vide laisse le marqueur visible (donc à compléter).
- Les politiques écrivent leurs marqueurs entre doubles crochets
  (`[[RAISON SOCIALE]]`) : les deux formes sont reconnues.
- `[DURÉE]` apparaît deux fois dans la politique de confidentialité avec deux sens :
  un champ par occurrence (purge des sessions, puis conservation des messages).
- Pour un nouveau marqueur : l'ajouter dans `headless_legal_placeholders()` avec le
  champ ACF correspondant.

Le contenu des pages FAQ, À propos, Contact, etc. reste modifiable directement dans
l'éditeur de pages WordPress ; ces pages n'ont pas de marqueurs.

## Wireframes

[Le lien Figma](https://www.figma.com/design/118Mfb9r0dApZskAojI4c4/Untitled?node-id=0-1&p=f)

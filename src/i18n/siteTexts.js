import i18n, { SUPPORTED_LANGUAGES } from "./index.js";
import fr from "./locales/fr.json";
import en from "./locales/en.json";

// Textes modifiables dans l'admin WordPress (champs ACF « Textes — … », voir
// mu-plugins/acf-site-texts.php). Ils se superposent aux dictionnaires
// src/i18n/locales : un champ rempli remplace le texte d'origine, un champ vide
// laisse le dictionnaire. Aucun composant n'a à le savoir, ils continuent
// d'appeler t("clé").

// Copies intactes des dictionnaires, prises avant toute modification : i18next
// fusionne les ajouts directement dans les objets qu'on lui a donnés (ceux de
// index.js), donc fr et en eux-mêmes ne sont plus les textes d'origine dès la
// première application.
const DEFAULTS = {
  fr: JSON.parse(JSON.stringify(fr)),
  en: JSON.parse(JSON.stringify(en)),
};
const STORAGE_KEY = "wc_site_texts";

const isTree = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/**
 * Applique les textes du site. Repart d'abord des dictionnaires d'origine : un
 * champ que l'éditeur vient de vider doit retrouver son texte d'origine, pas
 * garder l'ancienne valeur (par exemple celle de la copie gardée dans le
 * navigateur).
 *
 * @param {object|null} texts       { fr: {...}, en: {...} } renvoyé par l'API
 * @param {boolean}     rerender    relancer l'affichage des textes déjà montés
 */
export function applySiteTexts(texts, { rerender = true } = {}) {
  if (!isTree(texts)) return;

  for (const language of SUPPORTED_LANGUAGES) {
    i18n.addResourceBundle(
      language,
      "translation",
      JSON.parse(JSON.stringify(DEFAULTS[language])),
      true,
      true,
    );

    if (isTree(texts[language])) {
      i18n.addResourceBundle(language, "translation", texts[language], true, true);
    }
  }

  // react-i18next ne réagit pas à un ajout de ressources, mais à un changement
  // de langue : on « change » pour la langue déjà active.
  if (rerender) {
    i18n.changeLanguage(i18n.resolvedLanguage);
  }
}

// Copie du dernier chargement : le texte modifié s'affiche dès la première
// image, sans repasser par le texte d'origine le temps que l'API réponde.
export function readCachedSiteTexts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function cacheSiteTexts(texts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(texts));
  } catch {
    // Stockage indisponible (navigation privée) : seule la copie manque.
  }
}

/**
 * Réponse de l'API : on applique, et on ne relance l'affichage que si les
 * textes diffèrent de la copie déjà appliquée au démarrage.
 */
export function updateSiteTexts(texts) {
  if (!isTree(texts)) return;

  const changed = JSON.stringify(texts) !== JSON.stringify(readCachedSiteTexts());

  applySiteTexts(texts, { rerender: changed });
  cacheSiteTexts(texts);
}

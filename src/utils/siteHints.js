// Ce que le dernier chargement a appris des réglages du site, gardé dans le
// navigateur : l'accueil sait alors, dès son premier affichage, s'il y a une
// vidéo en haut de page et un logo personnalisé, au lieu d'attendre la
// réponse du serveur — et de déplacer ensuite le header ou de remplacer le
// logo sous les yeux du visiteur.
//
// Ce n'est qu'une indication pour la première image : dès que les réglages
// arrivent, ce sont eux qui font foi (voir CatalogSection et Header).

const KEY = "wc_site_hints";

// hasHero : vidéo en haut de l'accueil ; hasLogo : logo personnalisé
// (null = pas encore connu : première visite).
export function readSiteHints() {
  try {
    const hints = JSON.parse(localStorage.getItem(KEY));
    return {
      hasHero: hints?.hasHero === true,
      hasLogo: typeof hints?.hasLogo === "boolean" ? hints.hasLogo : null,
    };
  } catch {
    return { hasHero: false, hasLogo: null };
  }
}

export function saveSiteHints({ hasHero, hasLogo }) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ hasHero, hasLogo }));
  } catch {
    // Stockage indisponible (navigation privée) : l'indication manquera, rien d'autre.
  }
}

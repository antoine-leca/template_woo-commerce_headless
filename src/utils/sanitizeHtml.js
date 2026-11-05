import DOMPurify from "dompurify";

// Les liens ouverts dans un nouvel onglet ne doivent pas pouvoir piloter la
// page d'origine (window.opener).
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A" && node.getAttribute("target")) {
    node.setAttribute("rel", "noopener noreferrer");
  }
});

/**
 * HTML venant de WordPress (descriptions, avis, articles, prix) assaini avant
 * d'être injecté avec dangerouslySetInnerHTML.
 *
 * WordPress l'a déjà filtré à l'écriture, mais ce filtre dépend du rôle de
 * l'auteur et d'extensions qu'on ne contrôle pas : le front ne doit pas
 * supposer que ce qu'il reçoit est sûr. Pour un simple texte (nom de produit,
 * message), préférer decodeHtml et laisser React l'afficher : il n'y a alors
 * aucun HTML à injecter.
 */
export const sanitizeHtml = (html) =>
  DOMPurify.sanitize(String(html ?? ""), { USE_PROFILES: { html: true } });

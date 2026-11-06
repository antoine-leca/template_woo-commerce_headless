/**
 * Liste légère de tous les produits (id, noms, catégories), chargée une seule
 * fois par visite pour la recherche tolérante (voir searchProducts.js).
 *
 * Elle vient d'une route dédiée du serveur (custom/v1/products-index) : une
 * réponse de quelques Ko, mise en cache côté serveur, au lieu de tous les
 * produits complets. Elle reste séparée de `state.products`, qui ne contient
 * que la page ou le filtre affichés.
 */

let cache = null;

/** Résultat mis en cache ; en cas d'échec, le prochain appel réessaie. */
export function fetchSearchIndex() {
  if (!cache) {
    cache = fetch(
      `${import.meta.env.VITE_API_URL}/wp-json/custom/v1/products-index`,
    )
      .then((response) => {
        if (!response.ok) throw new Error("search index");
        return response.json();
      })
      .catch((error) => {
        cache = null;
        throw error;
      });
  }
  return cache;
}

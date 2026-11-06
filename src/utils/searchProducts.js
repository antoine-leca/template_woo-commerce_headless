/**
 * Recherche tolérante dans le catalogue : « tshirt » retrouve « T-SHIRT »,
 * « robe fmme » retrouve « ROBE FEMME ». La recherche de WordPress, elle,
 * cherche le texte tel quel et ne trouve rien dès que l'écriture diffère.
 *
 * On compare des textes « compacts » (minuscules, sans accents, sans espaces
 * ni ponctuation) : le tiret, l'espace et la casse n'ont plus d'importance.
 * Une faute de frappe est tolérée (une pour un mot court, deux pour un long).
 */

export function compact(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Plus petit nombre de fautes (insertion, suppression, remplacement) pour que
 * `needle` corresponde à une portion de `haystack` — algorithme de Sellers :
 * Levenshtein dont le début et la fin de `haystack` sont libres.
 */
export function approximateSubstringDistance(needle, haystack) {
  const n = needle.length;
  if (n === 0) return 0;
  let beforePrevious = null;
  let previous = Array.from({ length: n + 1 }, (_, i) => i);
  let best = previous[n];
  for (let j = 1; j <= haystack.length; j++) {
    const current = [0];
    for (let i = 1; i <= n; i++) {
      const cost = needle[i - 1] === haystack[j - 1] ? 0 : 1;
      current[i] = Math.min(
        previous[i] + 1,
        current[i - 1] + 1,
        previous[i - 1] + cost,
      );
      // Deux lettres inversées (« tshrit ») ne comptent que pour une faute.
      if (
        beforePrevious &&
        i > 1 &&
        needle[i - 1] === haystack[j - 2] &&
        needle[i - 2] === haystack[j - 1]
      ) {
        current[i] = Math.min(current[i], beforePrevious[i - 2] + 1);
      }
    }
    best = Math.min(best, current[n]);
    beforePrevious = previous;
    previous = current;
  }
  return best;
}

// Fautes acceptées selon la longueur de la recherche.
function allowedErrors(length) {
  if (length >= 8) return 2;
  if (length >= 4) return 1;
  return 0;
}

/**
 * Produits correspondant à `query`, du plus proche au moins proche.
 *
 * @param {Array}  entries  [{ id, texts: [nom, nom traduit, catégories…] }]
 * @param {string} query    ce que la personne a tapé
 * @returns {Array} les entrées retenues
 */
export function searchProducts(entries, query) {
  const needle = compact(query);
  if (!needle) return [];
  const maxErrors = allowedErrors(needle.length);

  return entries
    .map((entry) => {
      let best = Infinity;
      for (const text of entry.texts) {
        const haystack = compact(text);
        if (!haystack) continue;
        const index = haystack.indexOf(needle);
        // Correspondance exacte : le début du nom passe avant le milieu.
        const distance =
          index >= 0
            ? index === 0
              ? 0
              : 0.5
            : approximateSubstringDistance(needle, haystack);
        best = Math.min(best, distance);
      }
      return { entry, distance: best };
    })
    // Le texte contenu tel quel (distance 0 ou 0,5) est toujours retenu, où qu'il
    // soit dans le nom ; seules les fautes de frappe sont plafonnées.
    .filter(({ distance }) => distance < 1 || distance <= maxErrors)
    .sort(
      (a, b) =>
        a.distance - b.distance ||
        a.entry.texts[0].length - b.entry.texts[0].length,
    )
    .map(({ entry }) => entry);
}

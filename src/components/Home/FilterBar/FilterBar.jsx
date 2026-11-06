import { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import styles from "./FilterBar.module.scss";
import searchBarIcon from "../../../assets/icons/search-bar.png";
import { setFilters } from "../../../slices/filtersSlice";
import SegmentedControl from "../../SegmentedControl";
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from "../../../i18n";
import { useTranslation } from "react-i18next";

export default function FilterBar({ onFilterChange, hasProducts }) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const [activeFilter, setActiveFilter] = useState("tous");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const products = useSelector((state) => state.products.list.data);

  // Le libellé d'un filtre dans la langue affichée, et dans toutes les langues
  // du site : le contrôle réserve la largeur du plus long, et ne change donc
  // pas de taille quand on change de langue.
  //
  // Le nom d'une catégorie vient de l'API, donc dans la langue du serveur.
  // Une traduction locale l'emporte si la clé existe, sinon on garde le nom
  // renvoyé : le composant reste juste que le catalogue soit traduit côté
  // WordPress (Polylang) ou pas encore.
  const labels = (key, defaultValue) => ({
    label: t(key, { defaultValue }),
    alternates: SUPPORTED_LANGUAGES.map((lng) => t(key, { lng, defaultValue })),
  });

  const filters = useMemo(() => {
    // Une entrée par catégorie, même si plusieurs produits la partagent.
    const categories = new Map();
    products?.forEach((product) => {
      product.categories?.forEach((cat) => categories.set(cat.slug, cat));
    });

    return [
      { value: "tous", ...labels("catalog.all") },
      // Triées sur le nom saisi dans WordPress, pas sur le libellé traduit :
      // chaque filtre garde sa place d'une langue à l'autre. Triées sur la
      // traduction, FEMME et HOMME s'inversaient en anglais (MEN, WOMEN), et
      // le filtre actif glissait au changement de langue.
      ...[...categories.values()]
        .sort((a, b) => a.name.localeCompare(b.name, DEFAULT_LANGUAGE))
        .map((cat) => ({
          value: cat.slug,
          ...labels(`catalog.categories.${cat.slug}`, cat.name),
        })),
    ];
    // La langue fait partie des dépendances : sans elle, useMemo conserve les
    // libellés calculés au premier rendu et les filtres restent en français
    // après un changement de langue. `products` ne bouge pas quand on bascule,
    // la valeur mémoïsée n'était donc jamais réévaluée.
    // `t` change aussi quand les textes du site sont mis à jour depuis l'admin
    // (src/i18n/siteTexts.js) : la langue, elle, reste la même.
  }, [products, i18n.resolvedLanguage, t]);

  const handleFilterClick = (filterId) => {
    setActiveFilter(filterId);
    onFilterChange(filterId);

    if (filterId === "tous" && !hasProducts) {
      setSearchQuery("");
      dispatch(setFilters({ search: "" }));
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    dispatch(setFilters({ search: value }));
  };

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
    if (searchOpen) {
      setSearchQuery("");
      dispatch(setFilters({ search: "" }));
    }
  };

  return (
    <div className={styles.container}>
      {/* Icône Loupe */}
      <button
        className={styles.searchButton}
        onClick={toggleSearch}
        aria-label={t("search.label")}
      >
        <img src={searchBarIcon} alt="" className={styles.searchIcon} />
      </button>

      {/* Input de recherche */}
      {searchOpen && (
        <div className={styles.searchInputWrapper}>
          <img src={searchBarIcon} alt="" className={styles.inputIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder={t("search.articlePlaceholder")}
            value={searchQuery}
            onChange={handleSearchChange}
            autoFocus
          />
        </div>
      )}

      {/* Filtres : des boutons à bascule, pas des liens — ils ne mènent nulle
          part, ils changent ce qui est affiché. */}
      <SegmentedControl
        className={styles.filters}
        label={t("catalog.filterLabel")}
        options={filters}
        value={activeFilter}
        onChange={handleFilterClick}
      />
    </div>
  );
}

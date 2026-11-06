import {
  useState,
  useMemo,
  useRef,
  useEffect,
  useLayoutEffect,
} from "react";
import { useSelector, useDispatch } from "react-redux";
import styles from "./FilterBar.module.scss";
import searchBarIcon from "../../../assets/icons/search-bar.png";
import { setFilters } from "../../../slices/filtersSlice";
import SegmentedControl from "../../SegmentedControl";
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from "../../../i18n";
import { useTranslation } from "react-i18next";
import { getProductName } from "../../../utils/localizeProduct";
import { searchProducts } from "../../../utils/searchProducts";
import { fetchSearchIndex } from "../../../utils/searchIndex";

// Attente après la dernière frappe avant de recharger le catalogue.
const SEARCH_DEBOUNCE_MS = 200;

// Durée et courbe communes à toutes les animations de la barre (le SCSS
// reprend les mêmes valeurs : 0.45s et cubic-bezier(0.22, 1, 0.36, 1)).
const SEARCH_MS = 450;
const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function FilterBar({ onFilterChange, hasProducts }) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const [activeFilter, setActiveFilter] = useState("tous");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);
  const clearTimerRef = useRef(null);
  const layoutTimerRef = useRef(null);
  const containerRef = useRef(null);
  const filtersRef = useRef(null);
  const buttonRef = useRef(null);
  const pendingRef = useRef(null);
  // La barre est « ouverte » dès le clic ; la mise en page à deux lignes
  // (filtres dessous) ne se défait qu'une fois la barre repliée.
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [searchIndex, setSearchIndex] = useState([]);
  const [searchIndexReady, setSearchIndexReady] = useState(false);

  const products = useSelector((state) => state.products.list.data);
  const productsLoading = useSelector((state) => state.products.loading);
  const [searchDebouncing, setSearchDebouncing] = useState(false);

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
      dispatch(setFilters({ search: "", include: "" }));
    }
  };

  // Recherche tolérante : le texte tapé ne part pas à WordPress (« tshirt » ne
  // trouverait pas « T-SHIRT »). On le compare nous-mêmes au catalogue complet
  // (voir utils/searchProducts.js).
  const language = i18n.resolvedLanguage;
  const entries = useMemo(
    () =>
      searchIndex.map((product) => ({
        id: product.id,
        name: getProductName(product, language),
        texts: [
          product.name,
          ...Object.values(product.translations || {}).map((tr) => tr?.name),
          ...product.categories,
        ].filter(Boolean),
      })),
    [searchIndex, language],
  );
  const matches = useMemo(
    () => searchProducts(entries, searchQuery),
    [entries, searchQuery],
  );

  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  // Les correspondances restent « derrière » : aucune liste n'est affichée, le
  // catalogue lui-même se réduit aux produits trouvés, au fil de la frappe.
  // Aucune correspondance : l'identifiant 0 n'existe pas, le catalogue est vide
  // (un `include` vide, lui, afficherait tout).
  useEffect(() => {
    if (!searchOpen) return;
    if (searchQuery.trim() === "") {
      setSearchDebouncing(false);
      dispatch(setFilters({ search: "", include: "" }));
      return;
    }
    if (!searchIndexReady) return;
    setSearchDebouncing(true);
    const timer = setTimeout(() => {
      dispatch(
        setFilters({
          search: "",
          include: matches.length
            ? matches.map((entry) => entry.id).join(",")
            : "0",
        }),
      );
      setSearchDebouncing(false);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchOpen, searchQuery, matches, searchIndexReady, dispatch]);

  // Retour visuel : le rond tourne tant que la recherche n'a pas abouti — index
  // en chargement, attente après la frappe, ou catalogue en cours de rechargement.
  const searchLoading =
    searchOpen &&
    searchQuery.trim() !== "" &&
    (!searchIndexReady || searchDebouncing || productsLoading);

  // Photo de la mise en page avant un changement : hauteur de la rangée et
  // position des filtres. Après le changement, useLayoutEffect rejoue le trajet
  // de l'ancienne position à la nouvelle (technique « FLIP »).
  const snapshot = () => ({
    height: containerRef.current.getBoundingClientRect().height,
    filters: filtersRef.current.getBoundingClientRect(),
    button: buttonRef.current.getBoundingClientRect(),
  });

  const toggleSearch = () => {
    clearTimeout(clearTimerRef.current);
    clearTimeout(layoutTimerRef.current);

    if (!searchOpen) {
      // Ouverture : la barre se déplie et, dans le même temps, les filtres
      // glissent sur la ligne du dessous.
      pendingRef.current = snapshot();
      setSearchOpen(true);
      setLayoutOpen(true);
      return;
    }

    // Fermeture : la barre se replie d'abord (les filtres restent dessous, faute
    // de place à côté), puis les filtres remontent à côté de la loupe.
    // Le catalogue se remet à jour tout de suite ; le texte, lui, reste affiché
    // le temps du repli pour ne pas se vider à vue.
    setSearchOpen(false);
    dispatch(setFilters({ search: "", include: "" }));
    clearTimerRef.current = setTimeout(() => setSearchQuery(""), SEARCH_MS);
    layoutTimerRef.current = setTimeout(
      () => {
        pendingRef.current = snapshot();
        setLayoutOpen(false);
      },
      prefersReducedMotion() ? 0 : SEARCH_MS,
    );
  };

  useLayoutEffect(() => {
    const before = pendingRef.current;
    pendingRef.current = null;
    if (!before || prefersReducedMotion()) return;

    const options = { duration: SEARCH_MS, easing: EASING };
    // Les filtres et la loupe changent de place d'un coup quand la mise en page
    // bascule (une ligne ↔ deux lignes) : chacun rejoint sa nouvelle position
    // en partant de l'ancienne, au lieu de sauter.
    for (const [element, from] of [
      [filtersRef.current, before.filters],
      [buttonRef.current, before.button],
    ]) {
      const to = element.getBoundingClientRect();
      element.animate(
        [
          {
            transform: `translate(${from.left - to.left}px, ${from.top - to.top}px)`,
          },
          { transform: "translate(0, 0)" },
        ],
        options,
      );
    }
    // La rangée change de hauteur : on l'anime aussi, sinon le catalogue
    // dessous sauterait d'un coup.
    containerRef.current.animate(
      [
        { height: `${before.height}px` },
        { height: `${containerRef.current.getBoundingClientRect().height}px` },
      ],
      options,
    );
  }, [layoutOpen]);

  // Le catalogue complet n'est chargé qu'à la première ouverture de la barre.
  useEffect(() => {
    if (!searchOpen || searchIndexReady) return;
    let cancelled = false;
    fetchSearchIndex()
      .then((list) => {
        if (cancelled) return;
        setSearchIndex(list);
        setSearchIndexReady(true);
      })
      .catch(() => {
        /* sans catalogue, pas de suggestions : la barre reste inoffensive */
      });
    return () => {
      cancelled = true;
    };
  }, [searchOpen, searchIndexReady]);

  // Le champ n'est focalisable qu'une fois activé : on le focalise à l'ouverture.
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(
    () => () => {
      clearTimeout(clearTimerRef.current);
      clearTimeout(layoutTimerRef.current);
    },
    [],
  );

  return (
    <div ref={containerRef} className={styles.container}>
      {/* Icône Loupe */}
      <button
        ref={buttonRef}
        className={styles.searchButton}
        onClick={toggleSearch}
        aria-label={searchOpen ? t("common.close") : t("search.label")}
        aria-expanded={searchOpen}
      >
        {/* Les deux icônes restent superposées : la loupe tourne en
            s'effaçant pendant que la croix tourne en apparaissant. */}
        <span
          className={`${styles.toggleIcon} ${searchOpen ? styles.isOpen : ""}`}
        >
          <img
            src={searchBarIcon}
            alt=""
            className={`${styles.searchIcon} ${styles.iconSearch}`}
          />
          <svg
            className={`${styles.searchIcon} ${styles.iconClose}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
          </svg>
        </span>
      </button>

      {/* Input de recherche */}
      {/* Toujours monté : la barre se replie avec une transition au lieu de
          disparaître d'un coup. Fermée, le champ est désactivé (ni focus, ni
          tabulation) et masqué aux lecteurs d'écran. */}
      <div
        className={`${styles.searchCollapse} ${layoutOpen ? styles.searchCollapseLayout : ""} ${searchOpen ? styles.searchCollapseOpen : ""}`}
        aria-hidden={!searchOpen}
      >
        <div className={styles.searchCollapseInner}>
          <div className={styles.searchInputWrapper}>
            <img src={searchBarIcon} alt="" className={styles.inputIcon} />
            <input
              ref={searchInputRef}
              type="text"
              className={styles.searchInput}
              placeholder={t("search.articlePlaceholder")}
              value={searchQuery}
              onChange={handleSearchChange}
              disabled={!searchOpen}
              autoComplete="off"
            />
            {searchLoading && (
              <span
                className={styles.searchSpinner}
                role="status"
                aria-label={t("common.loading")}
              />
            )}
          </div>
        </div>
      </div>

      {/* Saut de ligne : actif barre ouverte, il place les filtres en dessous. */}
      <div
        className={`${styles.break} ${layoutOpen ? styles.breakOpen : ""}`}
        aria-hidden="true"
      />

      {/* Filtres : des boutons à bascule, pas des liens — ils ne mènent nulle
          part, ils changent ce qui est affiché. */}
      <div ref={filtersRef}>
        <SegmentedControl
          className={styles.filters}
          label={t("catalog.filterLabel")}
          options={filters}
          value={activeFilter}
          onChange={handleFilterClick}
        />
      </div>
    </div>
  );
}

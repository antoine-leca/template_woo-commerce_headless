import { useState } from "react";
import Header from "../../../layouts/MainLayout/components/Header/Header";
import FilterBar from "../FilterBar/FilterBar";
import ProductGrid from "../ProductGrid/ProductGrid";
import styles from "./CatalogSection.module.scss";
import { HOME_CATALOG_ANCHOR } from "../../../constants/navigation";
import Footer from "../../../layouts/MainLayout/components/Footer/Footer.jsx";
import ProductModal from "../../ProductModal";
import { readSiteHints } from "../../../utils/siteHints";

// Lu une fois : ce que le dernier chargement savait de la vidéo d'accueil.
const siteHints = readSiteHints();
import Loader from "../../Loader";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

export default function CatalogSection({
  products,
  hasMore = false,
  canShowLess = false,
  loading = false,
  onLoadMore,
  onShowLess,
}) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("tous");
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Récupération de heroVideo pour savoir s'il y a une vidéo ou non
  const siteSettings = useSelector((state) => state.site.siteSettings);
  const heroVideo = siteSettings?.heroVideo;
  // Les réglages arrivent après l'affichage du header (voir main.jsx). Tant
  // qu'ils manquent, on ne sait pas si une vidéo occupe le haut de la page : on
  // se fie à ce que le dernier chargement a appris (siteHints), pour que le
  // header ne change pas de place quand ils arrivent.
  const settingsKnown = siteSettings !== null;
  const hasHeroVideo = settingsKnown
    ? Boolean(siteSettings.heroVideo)
    : siteHints.hasHero;

  const filteredProducts =
    filter === "tous"
      ? products
      : products.filter((p) =>
          p.categories?.some((cat) => cat.slug === filter),
        );

  const showLoader = loading && products.length === 0;

  // Header d'abord : le contenu de l'accueil attend les réglages (une vidéo
  // change la mise en page), le header, lui, s'affiche déjà.
  if (!settingsKnown) {
    return (
      <div
        className={`${styles.catalog} ${!hasHeroVideo ? styles.noHero : ""}`}
        id={HOME_CATALOG_ANCHOR}
      >
        <Header />
        <main id="main-content" tabIndex={-1} className={styles.main} />
      </div>
    );
  }

  return (
    <div
      className={`${styles.catalog} ${!hasHeroVideo ? styles.noHero : ""}`}
      id={HOME_CATALOG_ANCHOR}
    >
      <Header />
      <main id="main-content" tabIndex={-1} className={styles.main}>
        <FilterBar
          onFilterChange={setFilter}
          hasProducts={filteredProducts.length > 0 || loading}
        />
        {showLoader ? (
          <div className={styles.loaderContainer}>
            <Loader size="lg" />
          </div>
        ) : (
          <>
            <ProductGrid
              products={products}
              filter={filter}
              onProductClick={setSelectedProduct}
            />
            {(hasMore || canShowLess) && (
              <div className={styles.buttonsContainer}>
                {hasMore && (
                  <button
                    onClick={onLoadMore}
                    disabled={loading}
                    className={styles.loadMoreBtn}
                  >
                    {loading ? <Loader size="sm" /> : t("common.showMore")}
                  </button>
                )}
                {canShowLess && (
                  <button
                    onClick={onShowLess}
                    disabled={loading}
                    className={styles.showLessBtn}
                  >
                    {t("catalog.showLess")}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
      <Footer />
    </div>
  );
}

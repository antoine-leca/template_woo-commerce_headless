import { useEffect, useState } from "react";
import ProductCard from "../ProductCard";
import { useTranslation } from "react-i18next";

export default function SimilarProducts({
  currentProduct,
  reduxProducts = [],
}) {
  const { t } = useTranslation();
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  useEffect(() => {
    if (!currentProduct?.id) return;

    const fetchSimilarProducts = async () => {
      setLoadingSimilar(true);
      try {
        const baseUrl = `${import.meta.env.VITE_API_URL}/wp-json/wc/store/v1/products`;
        const categoryId = currentProduct.categories?.[0]?.id;
        let recommendations = [];

        // NIVEAU 1 : Mêmes catégories
        if (categoryId) {
          const response = await fetch(`${baseUrl}?category=${categoryId}`, {
            method: "GET",
          });

          if (response.ok) {
            const data = await response.json();
            recommendations = (Array.isArray(data) ? data : []).filter(
              (p) => p.id.toString() !== currentProduct.id.toString(),
            );
          }
        }

        // NIVEAU 2 : Complément Redux
        if (recommendations.length < 3 && reduxProducts.length > 0) {
          const reduxExtras = reduxProducts.filter(
            (p) =>
              p.id.toString() !== currentProduct.id.toString() &&
              !recommendations.some(
                (rec) => rec.id.toString() === p.id.toString(),
              ),
          );
          recommendations = [...recommendations, ...reduxExtras];
        }

        // NIVEAU 3 : Secours API global
        if (recommendations.length < 3) {
          const fallbackResponse = await fetch(`${baseUrl}?per_page=10`, {
            method: "GET",
          });

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            const apiExtras = (
              Array.isArray(fallbackData) ? fallbackData : []
            ).filter(
              (p) =>
                p.id.toString() !== currentProduct.id.toString() &&
                !recommendations.some(
                  (rec) => rec.id.toString() === p.id.toString(),
                ),
            );
            recommendations = [...recommendations, ...apiExtras];
          }
        }

        // Mélange aléatoire + Sélection des 3 premiers
        const randomized = recommendations.sort(() => 0.5 - Math.random());
        setSimilarProducts(randomized.slice(0, 3));
      } catch {
        // Les produits similaires sont facultatifs : on n'affiche rien.
      } finally {
        setLoadingSimilar(false);
      }
    };

    fetchSimilarProducts();
  }, [currentProduct?.id, reduxProducts]);

  return (
    <section className="similar-products-section">
      <h2>{t("product.similar")}</h2>

      {loadingSimilar ? (
        <Loader size="lg" />
      ) : similarProducts.length > 0 ? (
        <div className="similar-products-grid">
          {similarProducts.map((simProduct) => (
            <ProductCard key={simProduct.id} product={simProduct} />
          ))}
        </div>
      ) : (
        <p className="no-similar-text">{t("product.noSimilar")}</p>
      )}
    </section>
  );
}

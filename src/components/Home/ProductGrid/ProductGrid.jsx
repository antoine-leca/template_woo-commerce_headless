// import { Link } from "react-router-dom";
// import styles from "./ProductGrid.module.scss";
// import { useTranslation } from "react-i18next";

// export default function ProductGrid({ products, filter, onProductClick }) {
//   const { t } = useTranslation();
//   const filteredProducts =
//     filter === "tous"
//       ? products
//       : products.filter((p) =>
//           p.categories?.some((cat) => cat.slug === filter)
//         );

//   // Fonction de vérification globale du stock pour la grille
//   const isProductInStock = (product) => {
//     // Si c'est un produit variable et qu'il a des variations listées
//     if (product.variations && product.variations.length > 0) {
//       // Le produit est en stock si au moins une variation est en stock
//       return product.variations.some((v) => v.is_in_stock);
//     }
//     // Sinon, on se base sur le statut global du produit simple
//     return product.stock_status === "instock" || product.is_in_stock === true;
//   };

//   return (
//     <>
//       {filteredProducts.length === 0 ? (
//         <div className={styles.noProducts}>
//           <p>{t("catalog.noMatch")}</p>
//         </div>
//       ) : (
//         <div className={styles.grid}>
//           {filteredProducts.map((product) => (
//             // <Link key={product.id} to={"/product/" + product.slug}>
//             <div
//               key={product.id}
//               className={styles.card}
//               onClick={() => onProductClick(product)}
//             >
//               <img
//                 src={
//                   product.images[0]?.src ||
//                   "https://placeholder.pics/svg/300/DEDEDE/555555/Placeholder"
//                 }
//                 alt={product.name || "photo produit"}
//                 className={styles.image}
//               />
//               {/* <div className={styles.title}>{product.name}</div> */}

//             </div>
//             // </Link>
//           ))}
//         </div>
//       )}
//     </>
//   );
// }

import { Link } from "react-router-dom";
import styles from "./ProductGrid.module.scss";
import { useTranslation } from "react-i18next";
import { getProductName } from "../../../utils/localizeProduct";

export default function ProductGrid({ products, filter, onProductClick }) {
  const { t, i18n } = useTranslation();
  const filteredProducts =
    filter === "tous"
      ? products
      : products.filter((p) =>
          p.categories?.some((cat) => cat.slug === filter),
        );

  // Fonction de vérification globale du stock pour la grille
  const isProductInStock = (product) => {
    // Si c'est un produit variable et qu'il a des variations listées
    if (product.variations && product.variations.length > 0) {
      // Le produit est en stock si au moins une variation est en stock
      return product.variations.some((v) => v.is_in_stock);
    }
    // Sinon, on se base sur le statut global du produit simple
    return product.stock_status === "instock" || product.is_in_stock === true;
  };

  return (
    <>
      {filteredProducts.length === 0 ? (
        <div className={styles.noProducts}>
          <p>{t("catalog.noMatch")}</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredProducts.map((product) => {
            const inStock = isProductInStock(product);
            const productName = getProductName(product, i18n.resolvedLanguage);

            return (
              <div
                key={product.id}
                className={`${styles.card} ${!inStock ? styles.outOfStockCard : ""}`}
                // Une carte qui s'ouvre au clic doit aussi s'ouvrir au clavier :
                // role="button" + tabIndex la rendent atteignable par Tab, et
                // Entrée ou Espace l'activent comme un bouton natif.
                role="button"
                tabIndex={inStock ? 0 : undefined}
                aria-disabled={!inStock ? "true" : undefined}
                onClick={() => {
                  if (inStock) {
                    onProductClick(product);
                  }
                }}
                onKeyDown={(event) => {
                  if (inStock && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    onProductClick(product);
                  }
                }}
              >
                <div className={styles.imageContainer}>
                  <img
                    src={
                      product.images[0]?.src ||
                      "https://placeholder.pics/svg/300/DEDEDE/555555/Placeholder"
                    }
                    alt={productName || "photo produit"}
                    className={styles.image}
                  />
                  {!inStock && (
                    <span className={styles.outOfStockBadge}>
                      {t("product.outOfStock") || "Rupture de stock"}
                    </span>
                  )}
                </div>
                <div
                  className={`${styles.title} ${!inStock ? styles.outOfStockTitle : ""}`}
                >
                  {productName}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

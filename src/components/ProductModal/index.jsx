import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import DOMPurify from "dompurify";
import { addProductToCart } from "../../thunkActionsCreator/cartThunks";
import { showToast } from "../../slices/toastSlice";
import "./index.css";
import ProductGallery from "./ProductGallery";
import { formatPrice } from "../../utils/formatPrice";
import { useTranslation } from "react-i18next";
import useDialogFocus from "../../hooks/useDialogFocus";
import { decodeHtml } from "../../utils/decodeHtml";
import {
  getAttributeOptions,
  getDefaultSelection,
  getDisplayPrices,
  getLowStockRemaining,
  getVariationAttributes,
  isOptionInStock,
  isSelectionInStock,
} from "../../utils/variationStock";
import { translateAttributeName } from "../../utils/translateAttributeName";
import {
  getProductDescription,
  getProductMaterial,
  getProductName,
} from "../../utils/localizeProduct";

export default function ProductModal({ product, onClose }) {
  const dialogRef = useRef(null);
  // Focus, Tab, Échap et retour du focus à la carte qui a ouvert la fenêtre.
  useDialogFocus(dialogRef, { onClose });
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const [itemVariation, setItemVariation] = useState({});
  const [descriptionNeedsScroll, setDescriptionNeedsScroll] = useState(false);

  const productName = getProductName(product, i18n.resolvedLanguage);
  const productDescription = getProductDescription(
    product,
    i18n.resolvedLanguage,
  );

  const formatModalPrice = (priceInCents, currencyCode) =>
    priceInCents
      ? formatPrice(priceInCents, {
          currency_code: currencyCode || "EUR",
          currency_minor_unit: 2,
        })
      : t("product.priceOnRequest");

  const variationAttributes = getVariationAttributes(product);

  useEffect(() => {
    if (!product) return;
    setItemVariation(getDefaultSelection(product));
  }, [product]);

  useEffect(() => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = DOMPurify.sanitize(productDescription);
    const textContent = tempDiv.textContent || "";
    setDescriptionNeedsScroll(textContent.length > 150);
  }, [productDescription]);

  // Recherche dynamique de l'attribut de type matière/composition (qu'il soit en variation ou informatif)
  const getProductMaterialAttribute = () => {
    if (!product.attributes) return null;
    return product.attributes.find((attr) => {
      const name = attr.name.toLowerCase();
      return (
        name.includes("matière") ||
        name.includes("matiere") ||
        name.includes("composition") ||
        name.includes("material")
      );
    });
  };

  const materialAttr = getProductMaterialAttribute();
  const materialValues = materialAttr
    ? (
        materialAttr.options ||
        materialAttr.terms?.map((term) => term.name) ||
        []
      ).join(", ")
    : null;
  // En français, la matière est la valeur de l'attribut ; sa traduction est
  // un champ ACF à part, qui la remplace quand il est rempli.
  const materialText = getProductMaterial(
    product,
    i18n.resolvedLanguage,
    materialValues,
  );

  const handleAddToCart = async () => {
    if (variationAttributes.length > 0) {
      for (const attr of variationAttributes) {
        if (!itemVariation[attr.name]) {
          dispatch(
            showToast(`Veuillez sélectionner une ${attr.name.toLowerCase()}`),
          );
          return;
        }
      }
    }

    const result = await dispatch(
      addProductToCart({
        productId: product.id,
        quantity: 1,
        variation: itemVariation,
      }),
    );
    if (addProductToCart.fulfilled.match(result)) {
      dispatch(showToast(`${productName} ajouté au panier`));
      onClose();
    } else {
      dispatch(showToast(result.payload || t("product.addError")));
    }
  };

  const stopPropagation = (e) => e.stopPropagation();

  const isInStock = isSelectionInStock(product, itemVariation);
  const lowStockRemaining = getLowStockRemaining(product, itemVariation);

  const displayPrices = getDisplayPrices(product, itemVariation);
  const currencyCode = product.prices?.currency_code;
  const formattedPrice = formatModalPrice(displayPrices.price, currencyCode);
  const isOnSale =
    Number(displayPrices.regular_price) > Number(displayPrices.price);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        className="modal-content"
        onClick={stopPropagation}
        role="dialog"
        aria-modal="true"
        aria-label={decodeHtml(product.name || "")}
        tabIndex={-1}
      >
        <button
          className="close-btn"
          onClick={onClose}
          aria-label={t("common.close")}
        >
          ✕
        </button>

        {/* La clé remet la galerie sur la première photo à chaque article. */}
        <ProductGallery
          key={product.id}
          images={product.images}
          alt={productName}
        />

        <div className="modal-txt-container">
          <div className="modal-category">
            {t("product.reference")} {product.slug}
          </div>

          <h2 className="modal-title">{productName}</h2>

          <div className="modal-price">
            {isOnSale && (
              <del className="modal-price__regular">
                {formatModalPrice(displayPrices.regular_price, currencyCode)}
              </del>
            )}
            {displayPrices.isFrom
              ? t("product.priceFrom", { price: formattedPrice })
              : formattedPrice}
          </div>

          <div
            className={`modal-description ${descriptionNeedsScroll ? "modal-description--scrollable" : ""}`}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(productDescription),
            }}
          />

          {/* Bloc Matières dynamique et traduit via translateAttributeName */}
          {materialText && (
            <div className="modal-materials">
              <span className="modal-materials-label">
                {materialAttr
                  ? translateAttributeName(materialAttr.name, t)
                  : t("product.attributes.material")}{" "}
                :{" "}
              </span>
              <span className="modal-materials-value">{materialText}</span>
            </div>
          )}

          {variationAttributes.length > 0 && (
            <div className="modal-attributes">
              {variationAttributes.map((attr) => (
                <div key={attr.name} className="modal-attribute-group">
                  <label htmlFor={attr.name} className="modal-attribute-label">
                    {translateAttributeName(attr.name, t)}
                  </label>
                  <select
                    id={attr.name}
                    value={itemVariation[attr.name] || ""}
                    onChange={(e) =>
                      setItemVariation((prev) => ({
                        ...prev,
                        [attr.name]: e.target.value,
                      }))
                    }
                    className="modal-attribute-select"
                  >
                    <option value="">{t("product.chooseOption")}</option>
                    {getAttributeOptions(attr).map((option) => {
                      const available = isOptionInStock(
                        product,
                        attr.name,
                        option.slug,
                        itemVariation,
                      );
                      return (
                        <option
                          key={option.slug}
                          value={option.slug}
                          disabled={!available}
                        >
                          {available
                            ? option.name
                            : `${option.name} — ${t("product.outOfStock")}`}
                        </option>
                      );
                    })}
                  </select>
                </div>
              ))}
            </div>
          )}

          {isInStock && lowStockRemaining && (
            <p className="modal-low-stock">
              {t("product.lowStock", { count: lowStockRemaining })}
            </p>
          )}

          {isInStock ? (
            <button className="add-btn" onClick={handleAddToCart}>
              {t("product.addToCart")}
            </button>
          ) : (
            <button className="add-btn" disabled>
              {t("product.outOfStock")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

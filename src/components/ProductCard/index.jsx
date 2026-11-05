import { addProductToCart } from "../../thunkActionsCreator/cartThunks";
import { showToast } from "../../slices/toastSlice";
import { useDispatch } from "react-redux";
import { Link, redirect } from "react-router-dom";
import { useState, useEffect } from "react";
import WishlistButton from "../WishlistButton"; // TEMP: wishlist testing, remove before commit
import "./index.css";
import { useTranslation } from "react-i18next";
import { decodeHtml } from "../../utils/decodeHtml";
import { sanitizeHtml } from "../../utils/sanitizeHtml";
import {
  getAttributeOptions,
  getDefaultSelection,
  getVariationAttributes,
  isOptionInStock,
  isSelectionInStock,
} from "../../utils/variationStock";
import { getProductName } from "../../utils/localizeProduct";

export default function ProductCard({ product }) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const [itemVariation, setItemVariation] = useState({});
  const productName = getProductName(product, i18n.resolvedLanguage);

  const addProduct = async (productId, quantity, variation, name) => {
    const result = await dispatch(
      addProductToCart({
        productId,
        quantity,
        variation,
      }),
    );
    if (addProductToCart.fulfilled.match(result)) {
      dispatch(showToast(`${name} ajouté au panier`));
    } else {
      dispatch(showToast(result.payload || t("product.addError")));
    }
  };

  function changeVariation(name, value) {
    setItemVariation((prev) => ({ ...prev, [name]: value }));
  }

  useEffect(() => {
    setItemVariation(getDefaultSelection(product));
  }, [product]);

  return (
    <div className="product-card">
      {/* TEmporally Button: wishlist testing */}
      <WishlistButton product={product} />
      <Link to={"/product/" + product.id}>
        <p>{decodeHtml(productName || "-")}</p>
        <p>Marque: {product.brands?.[0]?.name}</p>
        <img
          src={
            product.images[0]?.src ||
            "https://placeholder.pics/svg/300/DEDEDE/555555/Placeholder"
          }
          alt={productName || "photo produit"}
        />
      </Link>

      {/* <p>
        Prix: {(product.prices.price / 100).toFixed(2) || "-.--"}
        {" " + product.prices.currency_symbol}
      </p>

      {product.prices.regular_price > product.prices.sale_price ? (
        <p>
          Reduction de{" "}
          {Math.round(
            ((parseInt(product.prices.regular_price) -
              parseInt(product.prices.sale_price)) /
              parseInt(product.prices.regular_price)) *
              100,
          )}
          %. Prix initial:{" "}
          {(product.prices.regular_price / 100).toFixed(2) +
            " " +
            product.prices.currency_symbol}
        </p>
      ) : null} */}

      <span>
        <p>{t("product.price")} :</p>
        <p dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.price_html) }}></p>
      </span>

      {product.is_in_stock ? <p>{t("product.inStock")}</p> : <p>{t("product.outOfStock")}</p>}
      {getVariationAttributes(product).map((attribute) => (
        <div key={attribute.name}>
          <label htmlFor={attribute.name}>{attribute.name}</label>
          <select
            id={attribute.name}
            name={attribute.name}
            value={itemVariation[attribute.name] || ""}
            onChange={(e) => changeVariation(attribute.name, e.target.value)}
          >
            {getAttributeOptions(attribute).map((option) => {
              const available = isOptionInStock(
                product,
                attribute.name,
                option.slug,
                itemVariation,
              );
              return (
                <option key={option.slug} value={option.slug} disabled={!available}>
                  {available
                    ? option.name
                    : `${option.name} — ${t("product.outOfStock")}`}
                </option>
              );
            })}
          </select>
        </div>
      ))}
      {isSelectionInStock(product, itemVariation) ? (
        <button
          onClick={() => addProduct(product.id, 1, itemVariation, productName)}
        >
          {t("product.addToCart")}
        </button>
      ) : (
        <button disabled>{t("product.outOfStock")}</button>
      )}
    </div>
  );
}

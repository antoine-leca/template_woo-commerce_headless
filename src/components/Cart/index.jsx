import { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { CartProduct } from "../CartProduct";
import { formatPrice } from "../../utils/formatPrice";
import { HOME_CATALOG_PATH } from "../../constants/navigation";
import Loader from "../Loader";
import CheckoutAuthPromptModal from "../CheckoutAuthPromptModal";
import cartIcon from "../../assets/icons/logo-panier.png";
import "./index.scss";
import { useTranslation } from "react-i18next";

export default function Cart() {
  const { t } = useTranslation();
  const items = useSelector((state) => state.cart.items);
  const totals = useSelector((state) => state.cart.totals);
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const [isCheckoutPromptOpen, setCheckoutPromptOpen] = useState(false);
  const closeCheckoutPrompt = useCallback(() => setCheckoutPromptOpen(false), []);

  // La modale ne s'adresse qu'aux invités : un client connecté passe
  // directement. Un clic avec modificateur (nouvel onglet, Ctrl, clic milieu)
  // garde le comportement natif du lien.
  const handleCheckoutClick = (event) => {
    const isModifiedClick =
      event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    if (isAuthenticated || isModifiedClick) return;

    event.preventDefault();
    setCheckoutPromptOpen(true);
  };

  // Tant que le premier chargement n'a pas répondu, un panier vide et un
  // panier inconnu sont indiscernables : afficher « vide » serait un mensonge.
  if (!totals) {
    return (
      <section className="cart-state">
        <div className="cart-state__inner">
          <h1 className="cart-state__title">{t("cart.title")}</h1>
          <div className="cart-state__loader">
            <Loader size="lg" />
          </div>
        </div>
      </section>
    );
  }

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (items.length === 0) {
    return (
      <section className="cart-state">
        <div className="cart-state__inner">
          {/* Décoratif : alt vide pour que les lecteurs d'écran l'ignorent,
              le message juste en dessous dit déjà tout. */}
          <img src={cartIcon} alt="" className="cart-state__icon" />
          <h1 className="cart-state__title">{t("cart.title")}</h1>
          <p className="cart-state__message">{t("cart.empty")}</p>
          <p className="cart-state__hint">{t("cart.emptyHint")}</p>
          <Link to={HOME_CATALOG_PATH} className="cart-state__cta">
            {t("cart.continueShopping")}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="cart">
        <h1 className="cart__title">{t("cart.title")}</h1>

        <div className="cart__main">
          <ul className="cart__list">
            {items.map((item) => (
              <CartProduct key={item.key} item={item} />
            ))}
          </ul>

          <p className="cart__subtotal">
            {t("cart.subtotal", { count: itemCount })} :{" "}
            <strong>{formatPrice(totals.total_items, totals)}</strong>
          </p>
        </div>

        <aside className="cart__aside">
          <dl className="cart__summary">
            <div className="cart__summary-row">
              <dt>{t("cart.subtotal", { count: itemCount })}</dt>
              <dd>{formatPrice(totals.total_items, totals)}</dd>
            </div>

            <div className="cart__summary-row">
              <dt>{t("cart.shipping")}</dt>
              <dd>{t("cart.shippingLater")}</dd>
            </div>

            <div className="cart__summary-row">
              <dt>{t("cart.taxes")}</dt>
              <dd>{formatPrice(totals.total_tax, totals)}</dd>
            </div>

            <div className="cart__summary-row cart__summary-row--total">
              <dt>{t("cart.total")}</dt>
              <dd>{formatPrice(totals.total_price, totals)}</dd>
            </div>
          </dl>

          <Link
            to="/checkout"
            className="cart__checkout"
            onClick={handleCheckoutClick}
          >
            {t("cart.checkout")}
          </Link>

          <Link to={HOME_CATALOG_PATH} className="cart__continue">
            {t("cart.continueShopping")}
          </Link>
        </aside>
      </section>

      {isCheckoutPromptOpen && (
        <CheckoutAuthPromptModal onClose={closeCheckoutPrompt} />
      )}
    </>
  );
}

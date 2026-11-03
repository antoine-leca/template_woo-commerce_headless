import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { HOME_CATALOG_PATH } from "../../constants/navigation";
import "./Success.scss";

// Le numéro vient de l'adresse. On ne l'affiche que s'il en est bien un :
// recopier à l'écran n'importe quel contenu d'URL n'est jamais une bonne idée.
const isOrderNumber = (value) => /^\d+$/.test(value ?? "");

/**
 * Page de confirmation de commande.
 *
 * Elle n'annonce que ce que la boutique fait réellement : l'e-mail de
 * confirmation est envoyé par le mu-plugin qui crée la commande, et l'espace
 * client n'existe que si le client en a un. Le détail de la commande n'y est
 * pas affiché : l'API le refuse à qui n'est pas le propriétaire authentifié
 * de la commande — un invité verrait donc un message d'erreur sous sa
 * confirmation.
 */
export default function Success() {
  const { t } = useTranslation();
  const { orderId } = useParams();
  const isSignedIn = useSelector((state) => state.user.isAuthenticated);

  const steps = [
    { key: "email" },
    // Sans compte, il n'y a pas d'espace client où retrouver la commande :
    // l'e-mail devient le seul justificatif, on le dit.
    isSignedIn ? { key: "orders" } : { key: "receipt" },
    { key: "help", to: "/contact" },
  ];

  return (
    <section className="order-success">
      <div className="order-success__inner">
        {isOrderNumber(orderId) && (
          <p className="order-success__reference">
            {t("order.number")} <span>#{orderId}</span>
          </p>
        )}

        <h1 className="order-success__title">{t("order.confirmed")}</h1>

        <p className="order-success__message">{t("order.thanks")}</p>

        <ul className="order-success__steps">
          {steps.map(({ key, to }) => (
            <li key={key} className="order-success__step">
              <p className="order-success__step-label">
                {t(`order.next.${key}Label`)}
              </p>
              <p className="order-success__step-text">
                {t(`order.next.${key}Text`)}
              </p>
              {to && (
                <Link className="order-success__step-link" to={to}>
                  {t(`order.next.${key}Link`)}
                </Link>
              )}
            </li>
          ))}
        </ul>

        <div className="order-success__actions">
          <Link className="order-success__cta" to={HOME_CATALOG_PATH}>
            {t("order.backToShop")}
          </Link>

          {isSignedIn && (
            <Link className="order-success__secondary" to="/profile">
              {t("order.myOrders")}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

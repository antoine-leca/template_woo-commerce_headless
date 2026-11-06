import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./index.css";

const STORAGE_KEY = "wc_cookie_notice";

function alreadyAcknowledged() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Bandeau d'information sur les cookies.
 *
 * Le site ne dépose que des cookies et du stockage strictement nécessaires
 * (connexion, panier, paiement) : aucun consentement n'est exigé, le bandeau
 * informe simplement et renvoie vers la politique des cookies. Une fois fermé,
 * le choix est retenu dans le navigateur.
 */
export default function CookieNotice() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(() => !alreadyAcknowledged());

  if (!visible) return null;

  const close = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* stockage indisponible : le bandeau reviendra, sans gravité */
    }
    setVisible(false);
  };

  return (
    <div
      className="cookie-notice"
      role="region"
      aria-label={t("cookieNotice.label")}
    >
      <p className="cookie-notice__text">
        {t("cookieNotice.text")}{" "}
        <Link to="/cookies">{t("cookieNotice.more")}</Link>
      </p>
      <button type="button" className="cookie-notice__button" onClick={close}>
        {t("cookieNotice.ok")}
      </button>
    </div>
  );
}

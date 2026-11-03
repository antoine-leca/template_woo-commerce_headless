import "./Footer.css";

import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { openAuthModal } from "../../slices/authModalSlice";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isAuthentificated = !!useSelector((state) => state.user.isAuthenticated);

  return (
    <footer className="footer">
      <div className="footer_grid">
        <div className="footer_col">
          <ul className="footer_links">
            <li><Link to="/">{t("nav.home")}</Link></li>
            <li><Link to="/catalogue">{t("nav.catalogue")}</Link></li>
            <li><Link to="/panier">{t("nav.cart")}</Link></li>
            {!isAuthentificated && (
              <li>
                <button
                  type="button"
                  className="footer_link-button"
                  onClick={() => dispatch(openAuthModal("login"))}
                >
                  {t("auth.signIn")}
                </button>
              </li>
            )}
          </ul>
        </div>

        <div className="footer_col">
          <ul className="footer_links">
            <li><Link to="/faq">{t("nav.faq")}</Link></li>
            <li><Link to="/a-propos">{t("nav.about")}</Link></li>
            <li><Link to="/cgu">{t("nav.termsUse")}</Link></li>
            <li><Link to="/cgv">{t("nav.terms")}</Link></li>
            <li><Link to="/mentions-legales">{t("nav.legal")}</Link></li>
            <li><Link to="/contact">{t("nav.contactUs")}</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
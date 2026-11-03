import { Link } from "react-router-dom";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "./Header.module.scss";
import menuBurgerIcon from "../../../../assets/icons/menu-burger.png";
import cartIcon from "../../../../assets/icons/logo-panier.png";
import { openAuthModal } from "../../../../slices/authModalSlice";
import LanguageSwitcher from "../../../../components/LanguageSwitcher";
import SocialLinks from "../../../../components/SocialLinks";
import { useTranslation } from "react-i18next";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const cartItems = useSelector((state) => state.cart.items);
  const { isAuthenticated } = useSelector((state) => state.user);
  const siteSettings = useSelector((state) => state.site.siteSettings);
  const siteLogo = siteSettings?.siteLogo;

  const cartCount = cartItems.reduce(
    (total, item) => total + (Number(item.quantity) || 0),
    0,
  );
  const cartBadgeValue = cartCount > 9 ? "9+" : String(cartCount);

  const closeMenu = () => setMenuOpen(false);

  // Défini une fois : le lien et le bouton ci-dessous affichent rigoureusement
  // le même dessin, il ne peut donc pas diverger de l'un à l'autre.
  const userIcon = (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          {/* Menu Burger */}
          <button
            className={styles.menuButton}
            onClick={() => setMenuOpen(true)}
            aria-label={t("header.openMenu")}
          >
            <img src={menuBurgerIcon} alt="" className={styles.icon} />
          </button>

          <LanguageSwitcher />
        </div>

        {/* Logo RAVI */}
        <Link to="/">
          {siteLogo ? (
            <img
              src={siteLogo}
              alt={t("header.logoAlt")}
              className={styles.logoImg}
            />
          ) : (
            <div className={styles.logo}>
              RAVI
              {/* Masqué aux lecteurs d'écran : le lien garde « RAVI » pour
                  nom, sans « marque déposée » à chaque passage. */}
              <span className={styles.registered} aria-hidden="true">
                ®
              </span>
            </div>
          )}
        </Link>

        <div className={styles.headerRight}>
          {/* Icône Utilisateur : le profil est atteint d'un seul clic, sans
              menu intermédiaire. Quand la session existe, c'est un vrai lien —
              la navigation est immédiate, et le clic milieu, l'ouverture dans
              un onglet et l'aperçu de l'URL fonctionnent comme partout
              ailleurs. Sans session il n'y a rien à montrer sur /profile,
              qui n'est protégé par aucun garde : on ouvre la connexion. */}
          {isAuthenticated ? (
            <Link
              to="/profile"
              className={styles.userIconButton}
              aria-label={t("header.account")}
            >
              {userIcon}
            </Link>
          ) : (
            <button
              type="button"
              className={styles.userIconButton}
              onClick={() => dispatch(openAuthModal("login"))}
              aria-label={t("header.account")}
            >
              {userIcon}
            </button>
          )}

          {/* Icône Panier avec compteur */}
          <Link to="/panier" aria-label={t("header.cart")}>
            <div className={styles.cartWrapper}>
              {cartCount > 0 && (
                <span className={styles.cartCount}>{cartBadgeValue}</span>
              )}
              <img src={cartIcon} alt="" className={styles.icon} />
            </div>
          </Link>
        </div>
      </header>

      {/* Navigation fullscreen */}
      {menuOpen && (
        <nav className={styles.navFullscreen}>
          <button
            className={styles.closeButton}
            onClick={closeMenu}
            aria-label={t("header.closeMenu")}
          >
            ✕
          </button>
          <div className={styles.navContent}>
            <Link to="/" className={styles.navLink} onClick={closeMenu}>
              {t("header.nav.home")}
            </Link>
            <Link to="/faq" className={styles.navLink} onClick={closeMenu}>
              {t("header.nav.faq")}
            </Link>
            <Link to="/a-propos" className={styles.navLink} onClick={closeMenu}>
              {t("header.nav.about")}
            </Link>
            <Link to="/contact" className={styles.navLink} onClick={closeMenu}>
              {t("header.nav.contact")}
            </Link>

            {/* Les comptes de la marque ferment la colonne : ce sont des
                destinations hors de la boutique, séparées des pages par un
                filet. Le menu se referme au clic, pour retrouver le site tel
                qu'on l'a quitté en revenant de l'onglet ouvert. */}
            <div className={styles.navSocial}>
              <SocialLinks onNavigate={closeMenu} />
            </div>
          </div>
        </nav>
      )}
    </>
  );
}

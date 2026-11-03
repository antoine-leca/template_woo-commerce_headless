import "./index.css";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setFilters } from "../../slices/filtersSlice";
import { useNavigate } from "react-router-dom";
import Autocomplete from "../Autocomplete";
import { logoutThunk } from "../../thunkActionsCreator/userThunks";
import { openAuthModal } from "../../slices/authModalSlice";
import menuBurgerIcon from "../../assets/icons/menu-burger.png";
import searchBarIcon from "../../assets/icons/search-bar.png";
import cartIcon from "../../assets/icons/logo-panier.png";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const cartItems = useSelector((state) => state.cart.items);
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const siteSettings = useSelector((state) => state.site.siteSettings);
  const siteLogo = siteSettings?.siteLogo;
  const dispatch = useDispatch();

  const isAuthentificated = useSelector((state) => state.user.isAuthenticated);
  const cartCount = cartItems.reduce(
    (total, item) => total + (Number(item.quantity) || 0),
    0,
  );
  const cartBadgeValue = cartCount > 9 ? "9+" : String(cartCount);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="header">
      <div className="margin"></div>
      <div className="content">
        <Link to="/" className="header-logo" aria-label="Ecommerce">
          {siteLogo ? (
            <img src={siteLogo} alt="Logo" />
          ) : (
            <span className="logo-text">RAVI</span>
          )}
        </Link>

        {/* <div
            className={`header-overlay ${menuOpen ? "open" : ""}`}
            onClick={closeMenu}
            aria-hidden="true"
          /> */}
        <div className="menu">
          <nav
            className={`header-nav ${menuOpen ? "open" : ""}`}
            aria-hidden={!menuOpen}
          >
            <button
              className="header-close"
              onClick={closeMenu}
              aria-label="Fermer le menu"
            >
              ✕
            </button>
            <button
              className="header-burger"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
              aria-expanded={menuOpen}
            >
              <img src={menuBurgerIcon} alt="Menu" />
            </button>
            <Link to="/catalogue" onClick={closeMenu}>
              Catalogue
            </Link>
            <Link to="/blog" onClick={closeMenu}>
              Blog
            </Link>
            <Link to="/faq" onClick={closeMenu}>
              FAQ
            </Link>
            <Link to="/a-propos" onClick={closeMenu}>
              À Propos
            </Link>
          </nav>
          <div className="header-actions">
            <Autocomplete />
            <Link
              to="/catalogue"
              className="header-icon"
              aria-label="Recherche"
            >
              <img src={searchBarIcon} alt="Recherche" />
            </Link>

            {isAuthentificated ? (
              <div className="header-user-menu">
                <button
                  type="button"
                  className="header-icon"
                  aria-label="Menu utilisateur"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  👤
                </button>
                {userMenuOpen && (
                  <div className="user-dropdown">
                    <Link
                      to="/profile"
                      className="dropdown-item"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Mon profil
                    </Link>
                    <button
                      type="button"
                      className="dropdown-item logout-btn"
                      onClick={() => {
                        dispatch(logoutThunk());
                        setUserMenuOpen(false);
                      }}
                    >
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="header-icon"
                aria-label="Profil"
                onClick={() => dispatch(openAuthModal("login"))}
              >
                👤
              </button>
            )}

            <Link
              to="/panier"
              className="header-icon header-cart-link"
              aria-label={`Panier (${cartBadgeValue})`}
            >
              <img src={cartIcon} alt="Panier" />
              {cartCount > 0 && (
                <span className="header-cart-badge">{cartBadgeValue}</span>
              )}
            </Link>
            <Link
              to="/wishlist"
              className="header-icon header-wishlist-link"
              aria-label={`Favoris (${wishlistItems.length})`}
            >
              ❤️
              {wishlistItems.length > 0 && (
                <span className="header-cart-badge">
                  {wishlistItems.length > 9 ? "9+" : wishlistItems.length}
                </span>
              )}
            </Link>

          </div>
        </div>
      </div>
    </header>
  );
}

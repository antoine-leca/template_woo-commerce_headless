import { useDispatch, useSelector } from "react-redux";
import {
  addToWishlistThunk,
  removeFromWishlistThunk,
} from "../../thunkActionsCreator/wishlistThunks";
import {
  addLocalWishlistItem,
  removeLocalWishlistItem,
} from "../../slices/wishlistSlice";
import { showToast } from "../../slices/toastSlice";
import "./index.css";
import { useTranslation } from "react-i18next";

export default function WishlistButton({ product }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const isWishlisted = useSelector((state) =>
    state.wishlist.items.some((item) => item.id === product.id),
  );

  const toggleWishlist = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    // Invite : pas de compte donc pas de user meta cote serveur. On garde la
    // wishlist en localStorage (cf. wishlistSlice) ; elle sera fusionnee dans
    // le compte a la connexion (cartIdentityListener).
    if (!isAuthenticated) {
      if (isWishlisted) {
        dispatch(removeLocalWishlistItem(product.id));
      } else {
        dispatch(addLocalWishlistItem(product));
        dispatch(showToast(`${product.name || "Produit"} ajouté aux favoris`));
      }
      return;
    }

    const result = await dispatch(
      isWishlisted
        ? removeFromWishlistThunk(product.id)
        : addToWishlistThunk(product.id),
    );

    if (
      addToWishlistThunk.rejected.match(result) ||
      removeFromWishlistThunk.rejected.match(result)
    ) {
      dispatch(showToast(result.payload || t("wishlist.error")));
    } else if (!isWishlisted) {
      dispatch(showToast(`${product.name || "Produit"} ajouté aux favoris`));
    }
  };

  return (
    <button
      type="button"
      className={`wishlist-button ${isWishlisted ? "active" : ""}`}
      aria-pressed={isWishlisted}
      aria-label={
        isWishlisted ? t("wishlist.remove") : t("wishlist.add")
      }
      title={isWishlisted ? t("wishlist.remove") : t("wishlist.add")}
      onClick={toggleWishlist}
    >
      {isWishlisted ? "❤️" : "🤍"}
    </button>
  );
}

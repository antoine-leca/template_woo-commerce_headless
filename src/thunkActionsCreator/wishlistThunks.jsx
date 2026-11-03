import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  readGuestWishlist,
  clearGuestWishlistStorage,
} from "../utils/guestWishlist";
import { apiError, apiErrorMessage } from "../i18n/apiError";
import { withAuth } from "../utils/withAuth";

const WISHLIST_URL = `${import.meta.env.VITE_API_URL}/wp-json/custom/v1/wishlist`;

const csrfOf = (thunkAPI) => thunkAPI.getState().user.csrfToken;

export const fetchWishlistThunk = createAsyncThunk(
  "wishlist/fetch",
  async (_, thunkAPI) => {
    try {
      const response = await fetch(WISHLIST_URL, withAuth(csrfOf(thunkAPI)));
      const data = await response.json();
      if (!response.ok) {
        throw new Error(apiErrorMessage(data.message, "errors.wishlistFetch"));
      }
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

export const addToWishlistThunk = createAsyncThunk(
  "wishlist/add",
  async (productId, thunkAPI) => {
    try {
      const response = await fetch(
        WISHLIST_URL,
        withAuth(csrfOf(thunkAPI), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        }),
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(apiErrorMessage(data.message, "errors.wishlistAdd"));
      }
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// A la connexion : on pousse cote serveur les produits ajoutes en tant
// qu'invite (localStorage), puis on renvoie la liste faisant autorite. Les
// requetes sont sequentielles pour eviter que deux ajouts concurrents ne se
// marchent dessus sur le meme user meta cote WordPress.
export const mergeGuestWishlistThunk = createAsyncThunk(
  "wishlist/mergeGuest",
  async (_, thunkAPI) => {
    try {
      const guestItems = readGuestWishlist();

      for (const item of guestItems) {
        await fetch(
          WISHLIST_URL,
          withAuth(csrfOf(thunkAPI), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: item.id }),
          }),
        );
      }

      const response = await fetch(WISHLIST_URL, withAuth(csrfOf(thunkAPI)));
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          apiErrorMessage(data.message, "errors.wishlistMerge"),
        );
      }

      clearGuestWishlistStorage();
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

export const removeFromWishlistThunk = createAsyncThunk(
  "wishlist/remove",
  async (productId, thunkAPI) => {
    try {
      const response = await fetch(
        WISHLIST_URL,
        withAuth(csrfOf(thunkAPI), {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        }),
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(apiErrorMessage(data.message, "errors.wishlistRemove"));
      }
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

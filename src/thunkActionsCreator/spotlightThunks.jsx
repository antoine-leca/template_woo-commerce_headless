import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiError, apiErrorMessage } from "../i18n/apiError";

// Produits à la une (page d'accueil) : copie de fetchProductsThunk mais
// avec son propre type d'action et son propre state, pour ne pas partager
// state.products avec le catalogue (évite les écrasements/requêtes
// redondantes en naviguant accueil <-> catalogue).
export const fetchSpotlightProductsThunk = createAsyncThunk(
  "spotlight/fetchAll",
  async (params = {}, thunkAPI) => {
    try {
      const page = params.page ? parseInt(params.page, 10) : 1;
      const perPage = params.per_page ? parseInt(params.per_page, 10) : 20;
      const url = `${import.meta.env.VITE_API_URL}/wp-json/wc/store/v1/products?featured=true`;
      const response = await fetch(url, {
        method: "GET",
      });
      if (!response.ok) {
        throw new Error(apiError("errors.spotlight"));
      }
      const data = await response.json();
      return { data, page, perPage };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

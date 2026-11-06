import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiError, apiErrorMessage } from "../i18n/apiError";

// Valeur de rejet d'une requête abandonnée parce qu'une plus récente la remplace.
export const PRODUCTS_FETCH_SUPERSEDED = "superseded";

// Requête de catalogue en cours : une nouvelle l'annule. Pendant une recherche,
// chaque frappe relance le catalogue ; sans cela, les réponses s'empilent et
// une réponse ancienne, arrivée en retard, écraserait la bonne.
let currentProductsRequest = null;

export const fetchProductsThunk = createAsyncThunk(
  "products/fetchAll",
  async (params = {}, thunkAPI) => {
    currentProductsRequest?.abort();
    const controller = new AbortController();
    currentProductsRequest = controller;
    try {
      const page = params.page ? parseInt(params.page, 10) : 1;
      const perPage = params.per_page ? parseInt(params.per_page, 10) : 20;
      const minPrice =
        params.min_price !== undefined &&
        params.min_price !== null &&
        params.min_price !== ""
          ? Math.round(parseFloat(params.min_price) * 100)
          : undefined;
      const maxPrice =
        params.max_price !== undefined &&
        params.max_price !== null &&
        params.max_price !== ""
          ? Math.round(parseFloat(params.max_price) * 100)
          : undefined;
      const cleanParams = Object.entries({
        ...params,
        page,
        per_page: perPage,
        min_price: minPrice,
        max_price: maxPrice,
      }).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          acc[key] = String(value);
        }
        return acc;
      }, {});
      const queryString = new URLSearchParams(cleanParams).toString();
      const url = `${import.meta.env.VITE_API_URL}/wp-json/custom/v1/products?${queryString}`;
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(apiError("errors.products"));
      }
      const data = await response.json();
      const total = parseInt(response.headers.get("X-WP-Total") || "0", 10);

      return { data, page, perPage, total };
    } catch (error) {
      if (error.name === "AbortError") {
        return thunkAPI.rejectWithValue(PRODUCTS_FETCH_SUPERSEDED);
      }
      return thunkAPI.rejectWithValue(error.message);
    } finally {
      if (currentProductsRequest === controller) currentProductsRequest = null;
    }
  },
);

// Suggestions de recherche (autocomplétion du Header) : état séparé de
// products.list pour ne pas écraser le catalogue ni les produits du slider.
export const fetchSearchSuggestionsThunk = createAsyncThunk(
  "products/fetchSearchSuggestions",
  async ({ search, per_page = 5 } = {}, thunkAPI) => {
    try {
      const queryString = new URLSearchParams({
        search: search || "",
        per_page: String(per_page),
      }).toString();
      const url = `${import.meta.env.VITE_API_URL}/wp-json/wc/store/v1/products?${queryString}`;
      const response = await fetch(url, {
        method: "GET",
      });
      if (!response.ok) {
        throw new Error(apiError("errors.suggestions"));
      }
      return await response.json();
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// Action pour récupérer un seul produit par son ID
export const fetchProductByIdThunk = createAsyncThunk(
  "products/fetchById",
  async (productId, thunkAPI) => {
    try {
      const url = `${import.meta.env.VITE_API_URL}/wp-json/custom/v1/products/${productId}`;

      const response = await fetch(url, {
        method: "GET",
      });

      if (!response.ok) {
        // Capture du message d'erreur réel de WooCommerce s'il existe
        const errorData = await response.json().catch(() => ({}));
        const serverMessage =
          apiErrorMessage(errorData.message, "errors.product");
        throw new Error(serverMessage);
      }

      const data = await response.json();

      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

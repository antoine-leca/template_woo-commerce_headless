import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiError, apiErrorMessage } from "../i18n/apiError";

const fetchPageBySlug = async (slug) => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/wp-json/wp/v2/pages?slug=${encodeURIComponent(slug)}`,
    {
      method: "GET",
    },
  );

  if (!response.ok) {
    throw new Error(apiError("errors.page"));
  }

  const data = await response.json();
  return Array.isArray(data) ? (data[0] ?? null) : (data ?? null);
};

export const fetchPageThunk = createAsyncThunk(
  "pages/fetchBySlug",
  async ({ slug, fallbackSlug }, thunkAPI) => {
    try {
      const page = await fetchPageBySlug(slug);
      if (page) {
        return { key: slug, page, isFallback: false };
      }

      // La traduction n'existe pas encore dans WordPress : mieux vaut servir
      // la version d'origine qu'une page d'erreur, a fortiori sur un texte légal.
      if (fallbackSlug && fallbackSlug !== slug) {
        const originalPage = await fetchPageBySlug(fallbackSlug);
        if (originalPage) {
          return { key: slug, page: originalPage, isFallback: true };
        }
      }

      return thunkAPI.rejectWithValue(apiError("errors.pageNotFound"));
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
  {
    // Le cache est indexé par slug demandé : chaque langue a donc sa propre
    // entrée, et changer de langue déclenche bien une nouvelle requête.
    condition: ({ slug }, { getState }) => !getState().pages?.items?.[slug],
  },
);

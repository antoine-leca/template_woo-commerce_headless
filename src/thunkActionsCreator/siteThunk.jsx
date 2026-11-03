import { createAsyncThunk } from "@reduxjs/toolkit";
import { setSite, setSiteSettings } from "../slices/siteSlice";
import { apiError, apiErrorMessage } from "../i18n/apiError";

export const fetchSiteThunk = createAsyncThunk(
  "site/fetchSite",
  async (_, thunkAPI) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/wp-json/`, {
        "Content-Type": "application/json",
      });

      if (!response.ok) {
        throw new Error(apiError("errors.site"));
      }

      let siteData = await response.json();
      let logoUrl = null;

      try {
        if (siteData.site_logo) {
          const mediaResponse = await fetch(
            `${import.meta.env.VITE_API_URL}/wp-json/wp/v2/media/${siteData.site_logo}`,
          );
          if (mediaResponse.ok) {
            const mediaData = await mediaResponse.json();
            logoUrl = mediaData.source_url ?? null;
          }
        }
      } catch {}

      siteData.logoUrl = logoUrl ?? null;
      siteData.faviconUrl = siteData.site_icon_url ?? null;

      thunkAPI.dispatch(setSite(siteData));

      return siteData;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

export const fetchSiteSettingsThunk = createAsyncThunk(
  "site/fetchSiteSettings",
  async (_, thunkAPI) => {
    try {
      const url = `${import.meta.env.VITE_API_URL}/wp-json/wp/v2/pages/54`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const pageData = await response.json();
      const acfSettings = pageData.acf || {};
      thunkAPI.dispatch(setSiteSettings(acfSettings));

      return acfSettings;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

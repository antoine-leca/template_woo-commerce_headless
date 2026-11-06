import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiError, apiErrorMessage } from "../i18n/apiError";

export const fetchCategoriesThunk = createAsyncThunk(
  "categories/fetchAll",
  async (_, thunkAPI) => {
    try {
      const url = `${import.meta.env.VITE_API_URL}/wp-json/wc/store/v1/products/categories?_fields=id,name,slug`;
      const response = await fetch(url, {
        method: "GET",
      });
      if (!response.ok) {
        throw new Error(apiError("errors.categories"));
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);
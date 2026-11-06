import { createSlice } from "@reduxjs/toolkit";
// Importation de la nouvelle action thunk
import { fetchProductsThunk, fetchProductByIdThunk, PRODUCTS_FETCH_SUPERSEDED } from "../thunkActionsCreator/productsThunks";

export const productsSlice = createSlice({
  name: "products",
  initialState: {
    list: {
      data: [],
      page: 1,
      perPage: 20,
      total: 0,
    },
    loading: false,
    error: null,
    // Nouveaux états pour stocker les détails d'un seul produit
    singleProduct: null,
    loadingSingle: false,
    errorSingle: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductsThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProductsThunk.fulfilled, (state, action) => {
        state.loading = false;
        const { data, page, perPage, total } = action.payload;
        if (page === 1) {
          state.list.data = data;
        } else {
          state.list.data = [...state.list.data, ...data];
        }
        state.list.page = page;
        state.list.perPage = perPage;
        state.list.total = total || 0;
      })
      .addCase(fetchProductsThunk.rejected, (state, action) => {
        // Requête remplacée par une plus récente : celle-ci est toujours en
        // cours, ni chargement terminé ni erreur à signaler.
        if (action.payload === PRODUCTS_FETCH_SUPERSEDED) return;
        state.loading = false;
        state.error = action.payload;
      })
      
      // Nouveaux cas pour le produit unique
      .addCase(fetchProductByIdThunk.pending, (state) => {
        state.loadingSingle = true;
        state.errorSingle = null;
      })
      .addCase(fetchProductByIdThunk.fulfilled, (state, action) => {
        state.loadingSingle = false;
        // Enregistrement des données du produit dans notre nouvelle boîte
        state.singleProduct = action.payload;
      })
      .addCase(fetchProductByIdThunk.rejected, (state, action) => {
        state.loadingSingle = false;
        state.errorSingle = action.payload;
      });
  },
});
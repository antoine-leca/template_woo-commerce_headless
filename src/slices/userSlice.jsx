import { createSlice } from "@reduxjs/toolkit";
import {
  loginThunk,
  registerThunk,
  fetchCurrentUserThunk,
  updateCurrentUserThunk,
  fetchCurrentCustomerThunk,
  fetchCurrentUserOrdersThunk,
  updateCurrentCustomerThunk,
  deleteCurrentUserThunk,
  restoreSessionThunk,
  logoutThunk,
} from "../thunkActionsCreator/userThunks";

// Le JWT vit dans un cookie HttpOnly hors de portée du JavaScript : le store
// ne garde que le fait d'être connecté et le jeton anti-CSRF, en mémoire
// seulement (restoreSessionThunk le redemande au rechargement).
const clearSession = (state) => {
  state.isAuthenticated = false;
  state.csrfToken = null;
  state.profile = null;
  state.customer = null;
  state.orders = [];
};

const openSession = (state, action) => {
  state.isAuthenticated = true;
  state.csrfToken = action.payload.csrfToken;
  state.profile = action.payload.profile;
};

export const userSlice = createSlice({
  name: "user",
  initialState: {
    profile: null,
    customer: null,
    orders: [],
    isAuthenticated: false,
    csrfToken: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(restoreSessionThunk.fulfilled, (state, action) => {
        if (action.payload) {
          openSession(state, action);
        } else {
          clearSession(state);
        }
      })
      .addCase(logoutThunk.fulfilled, clearSession)
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        openSession(state, action);
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(registerThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.loading = false;
        openSession(state, action);
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCurrentUserThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUserThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchCurrentUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateCurrentUserThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCurrentUserThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(updateCurrentUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCurrentCustomerThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentCustomerThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.customer = action.payload;
      })
      .addCase(fetchCurrentCustomerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCurrentUserOrdersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUserOrdersThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchCurrentUserOrdersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateCurrentCustomerThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCurrentCustomerThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.customer = action.payload;
      })
      .addCase(updateCurrentCustomerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(deleteCurrentUserThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCurrentUserThunk.fulfilled, (state) => {
        state.loading = false;
        // Remet tout l'état utilisateur à zéro (déconnexion automatique,
        // le serveur a déjà effacé le cookie)
        clearSession(state);
        state.error = null;
      })
      .addCase(deleteCurrentUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

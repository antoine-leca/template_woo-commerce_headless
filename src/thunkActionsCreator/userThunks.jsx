import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiError, apiErrorMessage } from "../i18n/apiError";
import { withAuth } from "../utils/withAuth";

const csrfOf = (thunkAPI) => thunkAPI.getState().user.csrfToken;

// Réponse de connexion, d'inscription et de session : le JWT reste dans le
// cookie HttpOnly, seul le jeton anti-CSRF est renvoyé au front.
const toSession = (data) => ({
  csrfToken: data.csrf_token,
  profile: {
    email: data.user_email,
    displayName: data.user_display_name,
    nicename: data.user_nicename,
    // Ajoutés à la réponse du jeton par le mu-plugin
    // jwt-auth-enrichment.php, comme pour l'inscription : le formulaire
    // de commande s'en sert tant qu'aucune adresse n'est enregistrée.
    firstName: data.first_name,
    lastName: data.last_name,
  },
});

export const loginThunk = createAsyncThunk(
  "user/login",
  async ({ username, password }, thunkAPI) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/wp-json/jwt-auth/v1/token`,
        withAuth(null, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        }),
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Identifiants incorrects.");
      }
      thunkAPI.dispatch(fetchCurrentCustomerThunk());
      thunkAPI.dispatch(fetchCurrentUserOrdersThunk());
      return toSession(data);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// Au démarrage : le cookie n'étant pas lisible en JavaScript, on demande au
// serveur si une session est ouverte, et on récupère son jeton anti-CSRF.
export const restoreSessionThunk = createAsyncThunk(
  "user/restoreSession",
  async (_, thunkAPI) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/wp-json/custom/v1/auth/session`,
        withAuth(null),
      );
      const data = await response.json();
      if (!response.ok || !data.authenticated) {
        return null;
      }
      return toSession(data);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// Seul le serveur peut effacer un cookie HttpOnly. Le thunk aboutit même si
// l'appel échoue : l'état local est vidé dans tous les cas, pour ne jamais
// laisser l'interface « connectée ».
export const logoutThunk = createAsyncThunk(
  "user/logout",
  async (_, thunkAPI) => {
    try {
      await fetch(
        `${import.meta.env.VITE_API_URL}/wp-json/custom/v1/auth/logout`,
        withAuth(csrfOf(thunkAPI), { method: "POST" }),
      );
    } catch {
      // Hors ligne : la session locale est fermée quand même
    }
  },
);

export const fetchCurrentUserThunk = createAsyncThunk(
  "user/fetchCurrentUser",
  async (_, thunkAPI) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/wp-json/wp/v2/users/me?context=edit`,
        withAuth(csrfOf(thunkAPI)),
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(apiErrorMessage(data.message, "errors.profileFetch"));
      }
      return {
        id: data.id,
        username: data.username,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        displayName: data.name,
        roles: data.roles,
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

export const updateCurrentUserThunk = createAsyncThunk(
  "user/updateCurrentUser",
  async ({ email, firstName, lastName, password }, thunkAPI) => {
    try {
      const body = {};
      if (email !== undefined) body.email = email;
      if (firstName !== undefined) body.first_name = firstName;
      if (lastName !== undefined) body.last_name = lastName;
      if (password !== undefined) body.password = password;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/wp-json/wp/v2/users/me`,
        withAuth(csrfOf(thunkAPI), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(apiErrorMessage(data.message, "errors.profileUpdate"));
      }
      return {
        id: data.id,
        username: data.username,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        displayName: data.name,
        roles: data.roles,
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

export const fetchCurrentCustomerThunk = createAsyncThunk(
  "user/fetchCurrentCustomer",
  async (_, thunkAPI) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/wp-json/custom/v1/customer`,
        withAuth(csrfOf(thunkAPI)),
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          apiErrorMessage(data.message, "errors.customerFetch"),
        );
      }
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

export const fetchCurrentUserOrdersThunk = createAsyncThunk(
  "user/fetchCurrentUserOrders",
  async (_, thunkAPI) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/wp-json/custom/v1/orders`,
        withAuth(csrfOf(thunkAPI)),
      );
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(
          apiErrorMessage(data.message, "errors.ordersFetch"),
        );
      }
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

export const registerThunk = createAsyncThunk(
  "user/register",
  async ({ email, password, firstName, lastName }, thunkAPI) => {
    try {
      // Endpoint custom a exposer cote WordPress (mu-plugin), au meme titre
      // que le CORS : WordPress ne permet pas la creation de compte anonyme
      // via son API par defaut. Le serveur ouvre directement la session
      // (cookie), comme pour le login, pour eviter un deuxieme aller-retour.
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/wp-json/custom/v1/register`,
        withAuth(null, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, firstName, lastName }),
        }),
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(apiErrorMessage(data.message, "errors.accountCreate"));
      }
      thunkAPI.dispatch(fetchCurrentCustomerThunk());
      thunkAPI.dispatch(fetchCurrentUserOrdersThunk());
      return toSession(data);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

export const updateCurrentCustomerThunk = createAsyncThunk(
  "user/updateCurrentCustomer",
  async (customerData, thunkAPI) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/wp-json/custom/v1/customer`,
        withAuth(csrfOf(thunkAPI), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(customerData),
        }),
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            apiError("errors.customerUpdate"),
        );
      }

      // L'API renvoie directement l'objet client complet mis à jour
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

export const deleteCurrentUserThunk = createAsyncThunk(
  "user/deleteCurrentUser",
  async ({ password }, thunkAPI) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/wp-json/custom/v1/user`,
        withAuth(csrfOf(thunkAPI), {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        }),
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(apiErrorMessage(data.message, "errors.accountDelete"));
      }

      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

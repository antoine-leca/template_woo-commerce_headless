import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiErrorMessage } from "../i18n/apiError";

// Recherche des points relais Mondial Relay autour d'un code postal.
// Passe par la route du mu-plugin (custom/v1/mondial-relay/points-relais) :
// les identifiants Mondial Relay restent côté serveur.
// Renvoie toujours un tableau (vide s'il n'y a aucun résultat).
export const fetchRelayPointsThunk = createAsyncThunk(
  "shipping/fetchRelayPoints",
  async (
    { postalCode, city = "", country = "FR", action = "24R" },
    thunkAPI,
  ) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/wp-json/custom/v1/mondial-relay/points-relais`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cp: postalCode,
            city,
            country,
            action,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(apiErrorMessage(data.message, "errors.relayPoints"));
      }

      if (!data.success || !data.points_relais) {
        return [];
      }

      // L'API SOAP renvoie un objet seul (et non une liste) quand il n'y a
      // qu'un seul résultat : on normalise ici pour que l'appelant reçoive
      // toujours un tableau.
      return Array.isArray(data.points_relais)
        ? data.points_relais
        : [data.points_relais];
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

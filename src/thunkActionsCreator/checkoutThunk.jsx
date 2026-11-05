import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiError } from "../i18n/apiError";
import { withAuth } from "../utils/withAuth";

// Un paiement refusé arrive en 402 avec un code court (data.payment_error :
// declined, insufficient_funds, expired_card...). Le texte vient de nos
// fichiers de langue, pas du serveur : celui de Stripe est en anglais.
// Renvoie null pour toute autre erreur, qui garde son message habituel.
const paymentErrorMessage = (data) =>
  data?.data?.payment_error
    ? apiError(`errors.payment.${data.data.payment_error}`)
    : null;

// Crée la commande côté WordPress (endpoint custom/v1/checkout).
// orderData : { shippingAddress, billingAddress, cartItems, paymentMethodId,
//               shipping_method_details }
// Le cookie JWT rattache la commande au compte connecté (c'est le serveur qui
// décide, jamais un identifiant envoyé dans le corps).
// En cas de refus (stock insuffisant, mode de livraison invalide, téléphone
// manquant...), le message du serveur est repris tel quel, comme pour le panier.
export const placeOrderThunk = createAsyncThunk(
  "checkout/placeOrder",
  async (orderData, thunkAPI) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/wp-json/custom/v1/checkout`,
        withAuth(thunkAPI.getState().user.csrfToken, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        }),
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          paymentErrorMessage(data) ||
            data.message ||
            apiError("errors.orderCreate"),
        );
      }

      if (!data.success || !data.order_id) {
        throw new Error(apiError("errors.orderNotCreated"));
      }

      // Si data.requires_action est vrai, la carte demande une authentification
      // 3D Secure : le formulaire la termine avec Stripe puis appelle
      // confirmOrderPaymentThunk.
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// Seconde étape d'un paiement 3D Secure (endpoint custom/v1/checkout/confirm).
// Le serveur relit le paiement chez Stripe : le front ne fait que lui indiquer
// quelle commande vérifier.
// paymentData : { order_id, order_key, payment_intent_id }
export const confirmOrderPaymentThunk = createAsyncThunk(
  "checkout/confirmOrderPayment",
  async (paymentData, thunkAPI) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/wp-json/custom/v1/checkout/confirm`,
        withAuth(thunkAPI.getState().user.csrfToken, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paymentData),
        }),
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          paymentErrorMessage(data) ||
            data.message ||
            apiError("errors.orderCreate"),
        );
      }

      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

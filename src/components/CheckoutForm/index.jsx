// import React, { useState, useEffect, useMemo } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
// import { useSelector, useDispatch } from "react-redux";
// import ShippingAddress from "./ShippingAddress";
// import BillingAddress from "./BillingAddress";
// import ShippingOptions from "./ShippingOptions";
// import MondialRelaySelector from "./MondialRelaySelector";
// import { showToast } from "../../slices/toastSlice";
// import { emptyCartThunk } from "../../thunkActionsCreator/cartThunks";
// import { fetchCurrentCustomerThunk } from "../../thunkActionsCreator/userThunks";
// import { useTranslation } from "react-i18next";
// import { HOME_CATALOG_PATH } from "../../constants/navigation";
// import { buildCheckoutPrefill } from "./checkoutPrefill";
// import { placeOrderThunk } from "../../thunkActionsCreator/checkoutThunk";

// export default function CheckoutForm({ shippingMethod, setShippingMethod }) {
//   const { t } = useTranslation();
//   const navigate = useNavigate();
//   const stripe = useStripe();
//   const elements = useElements();
//   const dispatch = useDispatch();

//   const cart = useSelector((state) => state.cart);
//   const user = useSelector((state) => state.user);

//   const [paymentType, setPaymentType] = useState("card");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [errors, setErrors] = useState({});

//   // Point relais choisi (objet renvoyé par l'API Mondial Relay)
//   const [selectedRelay, setSelectedRelay] = useState(null);

//   const prefill = buildCheckoutPrefill(user.customer, user.profile);
//   const [shippingEdits, setShippingEdits] = useState({});
//   const [billingEdits, setBillingEdits] = useState({});
//   const [sameAsBillingChoice, setSameAsBillingChoice] = useState(null);

//   const shippingAddress = { ...prefill.shipping, ...shippingEdits };
//   const billingAddress = { ...prefill.billing, ...billingEdits };
//   const sameAsBilling = sameAsBillingChoice ?? prefill.sameAddress;

//   // Le client ne veut que du Mondial Relay : point relais ou domicile
//   const shippingOptions = useMemo(
//     () => [
//       {
//         id: "mr_relay",
//         name: t("checkout.shippingRelay"),
//         price: 4.5,
//         type: "relay",
//       },
//       {
//         id: "mr_home",
//         name: t("checkout.shippingHome"),
//         price: 7.9,
//         type: "home",
//       },
//     ],
//     [t],
//   );

//   const isRelay = shippingMethod?.type === "relay";

//   // Si la page parente fournit une valeur par défaut qui n'est pas une de nos
//   // options (ancien "colissimo", chaîne, null...), on la remplace par la 1re option.
//   useEffect(() => {
//     const currentId =
//       typeof shippingMethod === "string" ? shippingMethod : shippingMethod?.id;
//     const match = shippingOptions.find((o) => o.id === currentId);

//     if (!match) {
//       setShippingMethod(shippingOptions[0]);
//     } else if (typeof shippingMethod === "string" || !shippingMethod?.type) {
//       setShippingMethod(match);
//     }
//   }, [shippingMethod, shippingOptions, setShippingMethod]);

//   // Si on repasse en livraison à domicile, on oublie le point relais choisi
//   useEffect(() => {
//     if (!isRelay) setSelectedRelay(null);
//   }, [isRelay]);

//   useEffect(() => {
//     if (user.token) {
//       dispatch(fetchCurrentCustomerThunk());
//     }
//   }, [user.isAuthenticated, dispatch]);

//   const handleShippingChange = (e) => {
//     const { name, value } = e.target;
//     setShippingEdits((edits) => ({ ...edits, [name]: value }));
//     if (errors[name]) {
//       setErrors((prev) => ({ ...prev, [name]: "" }));
//     }
//   };

//   const handleBillingChange = (e) => {
//     const { name, value } = e.target;
//     setBillingEdits((edits) => ({ ...edits, [name]: value }));
//     if (errors[`billing_${name}`]) {
//       setErrors((prev) => ({ ...prev, [`billing_${name}`]: "" }));
//     }
//   };

//   const validateForm = () => {
//     const newErrors = {};

//     // Livraison
//     if (!shippingAddress.first_name?.trim())
//       newErrors.first_name = t("checkout.errors.required");
//     if (!shippingAddress.last_name?.trim())
//       newErrors.last_name = t("checkout.errors.required");
//     if (!shippingAddress.address_1?.trim())
//       newErrors.address_1 = t("checkout.errors.required");
//     if (!shippingAddress.city?.trim())
//       newErrors.city = t("checkout.errors.required");
//     if (!shippingAddress.postcode?.trim())
//       newErrors.postcode = t("checkout.errors.required");
//     if (!shippingAddress.country?.trim())
//       newErrors.country = t("checkout.errors.required");
//     if (!shippingAddress.email?.trim()) {
//       newErrors.email = t("checkout.errors.required");
//     } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingAddress.email)) {
//       newErrors.email = t("checkout.errors.invalidEmail");
//     }

//     // Téléphone obligatoire (nécessaire à Mondial Relay pour prévenir le client)
//     const phoneDigits = (shippingAddress.phone || "").replace(/\D/g, "");
//     if (!shippingAddress.phone?.trim()) {
//       newErrors.phone = t("checkout.errors.required");
//     } else if (phoneDigits.length < 9 || phoneDigits.length > 15) {
//       newErrors.phone = t("checkout.errors.invalidPhone");
//     }

//     // Facturation (si différente de la livraison)
//     if (!sameAsBilling) {
//       if (!billingAddress.first_name?.trim())
//         newErrors.billing_first_name = t("checkout.errors.required");
//       if (!billingAddress.last_name?.trim())
//         newErrors.billing_last_name = t("checkout.errors.required");
//       if (!billingAddress.address_1?.trim())
//         newErrors.billing_address_1 = t("checkout.errors.required");
//       if (!billingAddress.city?.trim())
//         newErrors.billing_city = t("checkout.errors.required");
//       if (!billingAddress.postcode?.trim())
//         newErrors.billing_postcode = t("checkout.errors.required");
//       if (!billingAddress.country?.trim())
//         newErrors.billing_country = t("checkout.errors.required");
//     }

//     setErrors(newErrors);

//     if (Object.keys(newErrors).length > 0) {
//       setError(t("checkout.errors.fillRequired"));
//       return false;
//     }

//     // Point relais obligatoire si livraison en relais
//     if (isRelay && !selectedRelay) {
//       setError(t("checkout.errors.selectRelay"));
//       return false;
//     }

//     setError(null);
//     return true;
//   };

//   const processCheckout = async (e) => {
//     e.preventDefault();

//     if (!validateForm()) return;

//     if (!stripe || !elements || loading) return;
//     if (paymentType !== "card") {
//       setError(t("checkout.errors.cardOnly"));
//       return;
//     }

//     setLoading(true);
//     setError(null);

//     const cardElement = elements.getElement(CardElement);
//     if (!cardElement) {
//       setError(t("checkout.errors.cardField"));
//       setLoading(false);
//       return;
//     }

//     const { paymentMethod, error: stripeError } =
//       await stripe.createPaymentMethod({
//         type: "card",
//         card: cardElement,
//         billing_details: {
//           name: `${billingAddress.first_name || ""} ${billingAddress.last_name || ""}`.trim(),
//           email: shippingAddress.email,
//           phone: shippingAddress.phone,
//         },
//       });

//     if (stripeError) {
//       setError(stripeError.message);
//       setLoading(false);
//       return;
//     }

//     try {
//       // Détails de livraison envoyés au backend (lus par le mu-plugin)
//       // Champs Mondial Relay : Num = identifiant, LgAdr1 = nom, LgAdr3 = rue
//       const shippingDetailsPayload = {
//         type: shippingMethod?.type || "home",
//         method_id: shippingMethod?.id,
//         ...(isRelay &&
//           selectedRelay && {
//             relay_id: String(selectedRelay.Num).trim(),
//             relay_name: (selectedRelay.LgAdr1 || "").trim(),
//             relay_address: `${(selectedRelay.LgAdr3 || "").trim()}, ${String(selectedRelay.CP).trim()} ${(selectedRelay.Ville || "").trim()}`,
//           }),
//       };

//       // L'appel API vit dans le thunk ; unwrap() renvoie la réponse ou lève
//       // le message d'erreur renvoyé par rejectWithValue.
//       const data = await dispatch(
//         placeOrderThunk({
//           shippingAddress,
//           billingAddress: sameAsBilling ? shippingAddress : billingAddress,
//           cartItems: cart.items || [],
//           paymentMethodId: paymentMethod.id,
//           shipping_method_details: shippingDetailsPayload,
//         }),
//       ).unwrap();

//       dispatch(showToast(t("order.confirmedToast", { id: data.order_id })));
//       dispatch(emptyCartThunk());
//       navigate(`/success/${data.order_id}`);
//     } catch (err) {
//       setError(
//         (typeof err === "string" ? err : err?.message) ||
//           t("errors.orderCreate"),
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="checkout-left">
//       <Link to={HOME_CATALOG_PATH} className="back-link">
//         {t("checkout.backToShop")}
//       </Link>

//       <form id="checkout-payment-form" onSubmit={processCheckout}>
//         <ShippingAddress
//           address={shippingAddress}
//           onChange={handleShippingChange}
//           errors={errors}
//         />

//         <div className="form-group" style={{ marginBottom: "30px" }}>
//           <label className="checkbox-group" style={{ cursor: "pointer" }}>
//             <input
//               type="checkbox"
//               checked={sameAsBilling}
//               onChange={(e) => setSameAsBillingChoice(e.target.checked)}
//             />
//             {t("address.sameAsShipping")}
//           </label>
//         </div>

//         {!sameAsBilling && (
//           <BillingAddress
//             address={billingAddress}
//             onChange={handleBillingChange}
//             errors={errors}
//           />
//         )}

//         <ShippingOptions
//           options={shippingOptions}
//           selectedMethod={shippingMethod}
//           onSelect={setShippingMethod}
//         />

//         {isRelay && (
//           <MondialRelaySelector
//             selectedRelay={selectedRelay}
//             onSelectRelay={setSelectedRelay}
//             defaultPostalCode={shippingAddress.postcode}
//             defaultCity={shippingAddress.city}
//           />
//         )}

//         <h3>{t("checkout.paymentDetails")}</h3>
//         <div className="form-group">
//           <label
//             className={`payment-method ${paymentType !== "card" ? "inactive-method" : ""}`}
//           >
//             <div className="payment-method-header">
//               <span className="card-icon">💳</span>
//               <div className="card-options">
//                 <strong>{t("checkout.card")}</strong>
//                 <div>{t("checkout.cardBrands")}</div>
//               </div>
//             </div>
//             <input
//               type="radio"
//               name="payment"
//               checked={paymentType === "card"}
//               onChange={() => setPaymentType("card")}
//             />
//           </label>

//           {paymentType === "card" && (
//             <div className="stripe-elements-box">
//               <CardElement
//                 options={{
//                   style: {
//                     base: {
//                       fontSize: "16px",
//                       color: "#424770",
//                       fontFamily: "system-ui, -apple-system, sans-serif",
//                       "::placeholder": {
//                         color: "#aab7c4",
//                       },
//                     },
//                     invalid: {
//                       color: "#fa755a",
//                     },
//                   },
//                 }}
//               />
//             </div>
//           )}
//         </div>

//         {error && (
//           <div style={{ color: "red", marginTop: "10px" }}>{error}</div>
//         )}

//         <button
//           type="submit"
//           className="submit-btn desktop-submit"
//           disabled={!stripe || loading}
//         >
//           {loading ? t("checkout.submitting") : t("checkout.submit")}
//         </button>
//       </form>
//     </div>
//   );
// }

import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useSelector, useDispatch } from "react-redux";
import ShippingAddress from "./ShippingAddress";
import BillingAddress from "./BillingAddress";
import ShippingOptions from "./ShippingOptions";
import MondialRelaySelector from "./MondialRelaySelector";
import { showToast } from "../../slices/toastSlice";
import { emptyCartThunk } from "../../thunkActionsCreator/cartThunks";
import { fetchCurrentCustomerThunk } from "../../thunkActionsCreator/userThunks";
import { useTranslation } from "react-i18next";
import { HOME_CATALOG_PATH } from "../../constants/navigation";
import { buildCheckoutPrefill } from "./checkoutPrefill";
import { placeOrderThunk } from "../../thunkActionsCreator/checkoutThunk";

export default function CheckoutForm({ shippingMethod, setShippingMethod }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();

  const cart = useSelector((state) => state.cart);
  const user = useSelector((state) => state.user);

  const [paymentType, setPaymentType] = useState("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  // Point relais choisi (objet renvoyé par l'API Mondial Relay)
  const [selectedRelay, setSelectedRelay] = useState(null);

  const prefill = buildCheckoutPrefill(user.customer, user.profile);
  const [shippingEdits, setShippingEdits] = useState({});
  const [billingEdits, setBillingEdits] = useState({});
  const [sameAsBillingChoice, setSameAsBillingChoice] = useState(null);

  const isRelay = shippingMethod?.type === "relay";

  const shippingAddress = { ...prefill.shipping, ...shippingEdits };
  const billingAddress = { ...prefill.billing, ...billingEdits };

  // LOGIQUE CRUCIALE : Si c'est un point relais, l'adresse de livraison n'est pas complète.
  // On DOIT donc forcer l'utilisateur à saisir une adresse de facturation distincte.
  const effectiveSameAsBilling = isRelay
    ? false
    : (sameAsBillingChoice ?? prefill.sameAddress);

  // Le client ne veut que du Mondial Relay : point relais ou domicile
  const shippingOptions = useMemo(
    () => [
      {
        id: "mr_relay",
        name: t("checkout.shippingRelay"),
        price: 4.5,
        type: "relay",
      },
      {
        id: "mr_home",
        name: t("checkout.shippingHome"),
        price: 7.9,
        type: "home",
      },
    ],
    [t],
  );

  // Si la page parente fournit une valeur par défaut qui n'est pas une de nos
  // options (ancien "colissimo", chaîne, null...), on la remplace par la 1re option.
  useEffect(() => {
    const currentId =
      typeof shippingMethod === "string" ? shippingMethod : shippingMethod?.id;
    const match = shippingOptions.find((o) => o.id === currentId);

    if (!match) {
      setShippingMethod(shippingOptions[0]);
    } else if (typeof shippingMethod === "string" || !shippingMethod?.type) {
      setShippingMethod(match);
    }
  }, [shippingMethod, shippingOptions, setShippingMethod]);

  // Si on repasse en livraison à domicile, on oublie le point relais choisi
  useEffect(() => {
    if (!isRelay) setSelectedRelay(null);
  }, [isRelay]);

  useEffect(() => {
    if (user.isAuthenticated) {
      dispatch(fetchCurrentCustomerThunk());
    }
  }, [user.isAuthenticated, dispatch]);

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingEdits((edits) => ({ ...edits, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBillingChange = (e) => {
    const { name, value } = e.target;
    setBillingEdits((edits) => ({ ...edits, [name]: value }));
    if (errors[`billing_${name}`]) {
      setErrors((prev) => ({ ...prev, [`billing_${name}`]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Livraison : Toujours obligatoire (Contact)
    if (!shippingAddress.first_name?.trim())
      newErrors.first_name = t("checkout.errors.required");
    if (!shippingAddress.last_name?.trim())
      newErrors.last_name = t("checkout.errors.required");

    if (!shippingAddress.email?.trim()) {
      newErrors.email = t("checkout.errors.required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingAddress.email)) {
      newErrors.email = t("checkout.errors.invalidEmail");
    }

    // Téléphone obligatoire (nécessaire à Mondial Relay pour prévenir le client)
    const phoneDigits = (shippingAddress.phone || "").replace(/\D/g, "");
    if (!shippingAddress.phone?.trim()) {
      newErrors.phone = t("checkout.errors.required");
    } else if (phoneDigits.length < 9 || phoneDigits.length > 15) {
      newErrors.phone = t("checkout.errors.invalidPhone");
    }

    // Livraison : Champs géographiques uniquement si livraison à domicile
    if (!isRelay) {
      if (!shippingAddress.address_1?.trim())
        newErrors.address_1 = t("checkout.errors.required");
      if (!shippingAddress.city?.trim())
        newErrors.city = t("checkout.errors.required");
      if (!shippingAddress.postcode?.trim())
        newErrors.postcode = t("checkout.errors.required");
      if (!shippingAddress.country?.trim())
        newErrors.country = t("checkout.errors.required");
    }

    // Facturation (si différente de la livraison)
    if (!effectiveSameAsBilling) {
      if (!billingAddress.first_name?.trim())
        newErrors.billing_first_name = t("checkout.errors.required");
      if (!billingAddress.last_name?.trim())
        newErrors.billing_last_name = t("checkout.errors.required");
      if (!billingAddress.address_1?.trim())
        newErrors.billing_address_1 = t("checkout.errors.required");
      if (!billingAddress.city?.trim())
        newErrors.billing_city = t("checkout.errors.required");
      if (!billingAddress.postcode?.trim())
        newErrors.billing_postcode = t("checkout.errors.required");
      if (!billingAddress.country?.trim())
        newErrors.billing_country = t("checkout.errors.required");
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setError(t("checkout.errors.fillRequired"));
      return false;
    }

    // Point relais obligatoire si livraison en relais
    if (isRelay && !selectedRelay) {
      setError(t("checkout.errors.selectRelay"));
      return false;
    }

    setError(null);
    return true;
  };

  const processCheckout = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!stripe || !elements || loading) return;
    if (paymentType !== "card") {
      setError(t("checkout.errors.cardOnly"));
      return;
    }

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError(t("checkout.errors.cardField"));
      setLoading(false);
      return;
    }

    const { paymentMethod, error: stripeError } =
      await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {
          name: `${billingAddress.first_name || ""} ${billingAddress.last_name || ""}`.trim(),
          email: shippingAddress.email,
          phone: shippingAddress.phone,
        },
      });

    if (stripeError) {
      setError(stripeError.message);
      setLoading(false);
      return;
    }

    try {
      // Détails de livraison envoyés au backend (lus par le mu-plugin)
      // Champs Mondial Relay : Num = identifiant, LgAdr1 = nom, LgAdr3 = rue
      const shippingDetailsPayload = {
        type: shippingMethod?.type || "home",
        method_id: shippingMethod?.id,
        ...(isRelay &&
          selectedRelay && {
            relay_id: String(selectedRelay.Num).trim(),
            relay_name: (selectedRelay.LgAdr1 || "").trim(),
            relay_address: `${(selectedRelay.LgAdr3 || "").trim()}, ${String(selectedRelay.CP).trim()} ${(selectedRelay.Ville || "").trim()}`,
          }),
      };

      const data = await dispatch(
        placeOrderThunk({
          shippingAddress,
          // Utilisation de la nouvelle logique ici aussi :
          billingAddress: effectiveSameAsBilling
            ? shippingAddress
            : billingAddress,
          cartItems: cart.items || [],
          paymentMethodId: paymentMethod.id,
          shipping_method_details: shippingDetailsPayload,
        }),
      ).unwrap();

      dispatch(showToast(t("order.confirmedToast", { id: data.order_id })));
      dispatch(emptyCartThunk());
      navigate(`/success/${data.order_id}`);
    } catch (err) {
      setError(
        (typeof err === "string" ? err : err?.message) ||
          t("errors.orderCreate"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-left">
      <Link to={HOME_CATALOG_PATH} className="back-link">
        {t("checkout.backToShop")}
      </Link>

      <form id="checkout-payment-form" onSubmit={processCheckout}>
        <ShippingAddress
          address={shippingAddress}
          onChange={handleShippingChange}
          errors={errors}
          isRelay={isRelay}
        />

        {/* On masque la case à cocher si c'est un point relais */}
        {!isRelay && (
          <div className="form-group" style={{ marginBottom: "30px" }}>
            <label className="checkbox-group" style={{ cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={effectiveSameAsBilling}
                onChange={(e) => setSameAsBillingChoice(e.target.checked)}
              />
              {t("address.sameAsShipping")}
            </label>
          </div>
        )}

        {/* Le bloc de facturation s'affichera TOUJOURS si on est en point relais, car effectiveSameAsBilling sera false */}
        {!effectiveSameAsBilling && (
          <BillingAddress
            address={billingAddress}
            onChange={handleBillingChange}
            errors={errors}
          />
        )}

        <ShippingOptions
          options={shippingOptions}
          selectedMethod={shippingMethod}
          onSelect={setShippingMethod}
        />

        {isRelay && (
          <MondialRelaySelector
            selectedRelay={selectedRelay}
            onSelectRelay={setSelectedRelay}
            defaultPostalCode={shippingAddress.postcode}
            defaultCity={shippingAddress.city}
          />
        )}

        <h3>{t("checkout.paymentDetails")}</h3>
        <div className="form-group">
          <label
            className={`payment-method ${paymentType !== "card" ? "inactive-method" : ""}`}
          >
            <div className="payment-method-header">
              <span className="card-icon">💳</span>
              <div className="card-options">
                <strong>{t("checkout.card")}</strong>
                <div>{t("checkout.cardBrands")}</div>
              </div>
            </div>
            <input
              type="radio"
              name="payment"
              checked={paymentType === "card"}
              onChange={() => setPaymentType("card")}
            />
          </label>

          {paymentType === "card" && (
            <div className="stripe-elements-box">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: "16px",
                      color: "#424770",
                      fontFamily: "system-ui, -apple-system, sans-serif",
                      "::placeholder": {
                        color: "#aab7c4",
                      },
                    },
                    invalid: {
                      color: "#fa755a",
                    },
                  },
                }}
              />
            </div>
          )}
        </div>

        {error && (
          <div style={{ color: "red", marginTop: "10px" }}>{error}</div>
        )}

        <button
          type="submit"
          className="submit-btn desktop-submit"
          disabled={!stripe || loading}
        >
          {loading ? t("checkout.submitting") : t("checkout.submit")}
        </button>
      </form>
    </div>
  );
}

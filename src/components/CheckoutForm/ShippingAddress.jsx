import React from "react";
import { useTranslation } from "react-i18next";
import CountrySelect from "./CountrySelect";

// Chaque libellé est relié à son champ (htmlFor/id) : un lecteur d'écran
// annonce « Prénom » en arrivant dans le champ. autoComplete permet au
// navigateur de remplir l'adresse en un clic (RGAA/WCAG 1.3.5).
export default function ShippingAddress({
  address,
  onChange,
  errors = {},
  isRelay,
}) {
  const { t } = useTranslation();

  // Attributs communs : le champ en erreur le dit aussi aux technologies
  // d'assistance, pas seulement par sa couleur.
  const field = (name) => ({
    id: `shipping-${name}`,
    name,
    value: address[name] || "",
    onChange,
    className: errors[name] ? "input--error" : "",
    "aria-invalid": errors[name] ? "true" : undefined,
    "aria-required": "true",
  });

  return (
    <>
      <div className="address-section-header">
        <h3>{t("address.shipping")}</h3>
        <span className="required-notice">* Champs obligatoires</span>
      </div>
      <div className="form-group">
        <div className="form-row">
          <div className="input-field">
            <label htmlFor="shipping-first_name">{t("common.firstName")} *</label>
            <input type="text" autoComplete="shipping given-name" {...field("first_name")} />
          </div>
          <div className="input-field">
            <label htmlFor="shipping-last_name">{t("common.lastName")} *</label>
            <input type="text" autoComplete="shipping family-name" {...field("last_name")} />
          </div>
        </div>

        {!isRelay && (
          <>
            <div className="input-field">
              <label htmlFor="shipping-address_1">{t("address.street")} *</label>
              <input
                type="text"
                autoComplete="shipping address-line1"
                placeholder={t("address.streetPlaceholder")}
                {...field("address_1")}
              />
            </div>
            <div className="form-row">
              <div className="input-field">
                <label htmlFor="shipping-city">{t("address.city")} *</label>
                <input type="text" autoComplete="shipping address-level2" {...field("city")} />
              </div>
              <div className="input-field">
                <label htmlFor="shipping-country">{t("address.country")} *</label>
                <CountrySelect
                  id="shipping-country"
                  value={address.country}
                  onChange={onChange}
                  hasError={!!errors.country}
                  autoComplete="shipping country"
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="input-field">
                <label htmlFor="shipping-postcode">{t("address.postcode")} *</label>
                <input type="text" autoComplete="shipping postal-code" {...field("postcode")} />
              </div>
            </div>
          </>
        )}

        <div className="form-row">
          <div className="input-field">
            <label htmlFor="shipping-phone">{t("address.phone")} *</label>
            <input type="tel" autoComplete="shipping tel" {...field("phone")} />
          </div>
          <div className="input-field">
            <label htmlFor="shipping-email">{t("common.email")} *</label>
            <input type="email" autoComplete="email" {...field("email")} />
          </div>
        </div>
      </div>
    </>
  );
}

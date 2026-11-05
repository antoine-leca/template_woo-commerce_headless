import { useTranslation } from "react-i18next";
import CountrySelect from "./CountrySelect";

// Même principe que ShippingAddress : libellés reliés aux champs, autoComplete
// « billing ». Les erreurs de ce bloc sont préfixées par billing_.
export default function BillingAddress({ address, onChange, errors = {} }) {
  const { t } = useTranslation();

  const field = (name, required = true) => ({
    id: `billing-${name}`,
    name,
    value: address[name] || "",
    onChange,
    className: errors[`billing_${name}`] ? "input--error" : "",
    "aria-invalid": errors[`billing_${name}`] ? "true" : undefined,
    "aria-required": required ? "true" : undefined,
  });

  return (
    <>
      <div className="address-section-header">
        <h3>{t("address.billing")}</h3>
        <span className="required-notice">* Champs obligatoires</span>
      </div>
      <div className="form-group">
        <div className="form-row">
          <div className="input-field">
            <label htmlFor="billing-first_name">{t("common.firstName")} *</label>
            <input type="text" autoComplete="billing given-name" {...field("first_name")} />
          </div>
          <div className="input-field">
            <label htmlFor="billing-last_name">{t("common.lastName")} *</label>
            <input type="text" autoComplete="billing family-name" {...field("last_name")} />
          </div>
        </div>
        <div className="input-field">
          <label htmlFor="billing-address_1">{t("address.street")} *</label>
          <input
            type="text"
            autoComplete="billing address-line1"
            placeholder={t("address.streetPlaceholder")}
            {...field("address_1")}
          />
        </div>
        <div className="form-row">
          <div className="input-field">
            <label htmlFor="billing-city">{t("address.city")} *</label>
            <input type="text" autoComplete="billing address-level2" {...field("city")} />
          </div>
          <div className="input-field">
            <label htmlFor="billing-country">{t("address.country")} *</label>
            <CountrySelect
              id="billing-country"
              value={address.country}
              onChange={onChange}
              hasError={!!errors.billing_country}
              autoComplete="billing country"
              required
            />
          </div>
        </div>
        <div className="form-row">
          <div className="input-field">
            <label htmlFor="billing-postcode">{t("address.postcode")} *</label>
            <input type="text" autoComplete="billing postal-code" {...field("postcode")} />
          </div>
          <div className="input-field">
            <label htmlFor="billing-phone">{t("address.phone")}</label>
            <input type="tel" autoComplete="billing tel" {...field("phone", false)} />
          </div>
        </div>
      </div>
    </>
  );
}

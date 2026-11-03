// import { useTranslation } from "react-i18next";

// export default function ShippingAddress({ address, onChange, errors = {} }) {
//   const { t } = useTranslation();

//   return (
//     <>
//       <div className="address-section-header">
//         <h3>{t("address.shipping")}</h3>
//         <span className="required-notice">* Champs obligatoires</span>
//       </div>
//       <div className="form-group">
//         <div className="form-row">
//           <div className="input-field">
//             <label>{t("common.firstName")} *</label>
//             <input
//               type="text"
//               name="first_name"
//               value={address.first_name || ""}
//               onChange={onChange}
//               className={errors.first_name ? "input--error" : ""}
//             />
//           </div>
//           <div className="input-field">
//             <label>{t("common.lastName")} *</label>
//             <input
//               type="text"
//               name="last_name"
//               value={address.last_name || ""}
//               onChange={onChange}
//               className={errors.last_name ? "input--error" : ""}
//             />
//           </div>
//         </div>
//         <div className="input-field">
//           <label>{t("address.street")} *</label>
//           <input
//             type="text"
//             name="address_1"
//             value={address.address_1 || ""}
//             placeholder={t("address.streetPlaceholder")}
//             onChange={onChange}
//             className={errors.address_1 ? "input--error" : ""}
//           />
//         </div>
//         <div className="form-row">
//           <div className="input-field">
//             <label>{t("address.city")} *</label>
//             <input
//               type="text"
//               name="city"
//               value={address.city || ""}
//               onChange={onChange}
//               className={errors.city ? "input--error" : ""}
//             />
//           </div>
//           <div className="input-field">
//             <label>{t("address.country")} *</label>
//             <input
//               type="text"
//               name="country"
//               value={address.country || "France"}
//               onChange={onChange}
//               className={errors.country ? "input--error" : ""}
//             />
//           </div>
//         </div>
//         <div className="form-row">
//           <div className="input-field">
//             <label>{t("address.postcode")} *</label>
//             <input
//               type="text"
//               name="postcode"
//               value={address.postcode || ""}
//               onChange={onChange}
//               className={errors.postcode ? "input--error" : ""}
//             />
//           </div>
//           <div className="input-field">
//             <label>{t("address.phone")} *</label>
//             <input
//               type="tel"
//               name="phone"
//               value={address.phone || ""}
//               onChange={onChange}
//             />
//           </div>
//         </div>
//         <div className="input-field">
//           <label>{t("common.email")} *</label>
//           <input
//             type="email"
//             name="email"
//             value={address.email || ""}
//             onChange={onChange}
//             className={errors.email ? "input--error" : ""}
//           />
//         </div>
//       </div>
//     </>
//   );
// }

import React from "react";
import { useTranslation } from "react-i18next";

export default function ShippingAddress({
  address,
  onChange,
  errors = {},
  isRelay,
}) {
  const { t } = useTranslation();

  return (
    <>
      <div className="address-section-header">
        <h3>{t("address.shipping")}</h3>
        <span className="required-notice">* Champs obligatoires</span>
      </div>
      <div className="form-group">
        <div className="form-row">
          <div className="input-field">
            <label>{t("common.firstName")} *</label>
            <input
              type="text"
              name="first_name"
              value={address.first_name || ""}
              onChange={onChange}
              className={errors.first_name ? "input--error" : ""}
            />
          </div>
          <div className="input-field">
            <label>{t("common.lastName")} *</label>
            <input
              type="text"
              name="last_name"
              value={address.last_name || ""}
              onChange={onChange}
              className={errors.last_name ? "input--error" : ""}
            />
          </div>
        </div>

        {!isRelay && (
          <>
            <div className="input-field">
              <label>{t("address.street")} *</label>
              <input
                type="text"
                name="address_1"
                value={address.address_1 || ""}
                placeholder={t("address.streetPlaceholder")}
                onChange={onChange}
                className={errors.address_1 ? "input--error" : ""}
              />
            </div>
            <div className="form-row">
              <div className="input-field">
                <label>{t("address.city")} *</label>
                <input
                  type="text"
                  name="city"
                  value={address.city || ""}
                  onChange={onChange}
                  className={errors.city ? "input--error" : ""}
                />
              </div>
              <div className="input-field">
                <label>{t("address.country")} *</label>
                <input
                  type="text"
                  name="country"
                  value={address.country || "France"}
                  onChange={onChange}
                  className={errors.country ? "input--error" : ""}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="input-field">
                <label>{t("address.postcode")} *</label>
                <input
                  type="text"
                  name="postcode"
                  value={address.postcode || ""}
                  onChange={onChange}
                  className={errors.postcode ? "input--error" : ""}
                />
              </div>
            </div>
          </>
        )}

        <div className="form-row">
          <div className="input-field">
            <label>{t("address.phone")} *</label>
            <input
              type="tel"
              name="phone"
              value={address.phone || ""}
              onChange={onChange}
              className={errors.phone ? "input--error" : ""}
            />
          </div>
          <div className="input-field">
            <label>{t("common.email")} *</label>
            <input
              type="email"
              name="email"
              value={address.email || ""}
              onChange={onChange}
              className={errors.email ? "input--error" : ""}
            />
          </div>
        </div>
      </div>
    </>
  );
}

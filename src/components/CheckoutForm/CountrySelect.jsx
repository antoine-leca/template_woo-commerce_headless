import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

// Pays où le site livre : la valeur envoyée est le code à 2 lettres (« FR »)
// que WooCommerce et Stripe attendent, jamais un nom saisi à la main
// (« France » est refusé par les deux).
const COUNTRIES = [
  "FR", "BE", "LU", "DE", "ES", "IT", "NL", "PT", "AT", "IE", "CH", "GB",
  "DK", "SE", "FI", "PL", "CZ", "SK", "SI", "HR", "HU", "RO", "BG", "GR",
  "EE", "LV", "LT", "CY", "MT",
];

const DEFAULT_COUNTRY = "FR";
const isCountryCode = (value) => /^[A-Za-z]{2}$/.test(String(value || ""));

export default function CountrySelect({
  id,
  value,
  onChange,
  hasError,
  autoComplete = "country",
  required,
}) {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || "fr";

  const regionNames = useMemo(
    () => new Intl.DisplayNames([language], { type: "region" }),
    [language],
  );

  const code = isCountryCode(value) ? value.toUpperCase() : DEFAULT_COUNTRY;

  // Une valeur d'avant la liste (un nom saisi à la main, comme « France »)
  // est ramenée au pays par défaut dans l'état du formulaire aussi, pour que
  // ce qui est affiché soit ce qui est envoyé.
  useEffect(() => {
    if (value !== code) {
      onChange({ target: { name: "country", value: code } });
    }
    // onChange change à chaque rendu du parent : seule la valeur compte ici.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, code]);

  // Un pays absent de la liste (adresse enregistrée dans le profil) reste
  // sélectionnable plutôt que d'être remplacé en silence.
  const codes = COUNTRIES.includes(code) ? COUNTRIES : [code, ...COUNTRIES];

  return (
    <select
      id={id}
      name="country"
      value={code}
      onChange={onChange}
      className={hasError ? "input--error" : ""}
      autoComplete={autoComplete}
      aria-invalid={hasError ? "true" : undefined}
      aria-required={required ? "true" : undefined}
    >
      {codes.map((countryCode) => (
        <option key={countryCode} value={countryCode}>
          {regionNames.of(countryCode) || countryCode}
        </option>
      ))}
    </select>
  );
}

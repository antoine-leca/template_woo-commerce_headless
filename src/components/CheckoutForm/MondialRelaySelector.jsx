import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { fetchRelayPointsThunk } from "../../thunkActionsCreator/shippingThunk";

// L'API Mondial Relay renvoie souvent des textes complétés par des espaces
// ("TABAC DU PORT ") : on nettoie à l'affichage et avant de les envoyer.
const clean = (value) => String(value ?? "").trim();

export default function MondialRelaySelector({
  selectedRelay,
  onSelectRelay,
  defaultPostalCode = "",
  defaultCity = "",
}) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [postalCode, setPostalCode] = useState(defaultPostalCode || "");
  const [city, setCity] = useState(defaultCity || "");
  // Tant que le client n'a pas modifié lui-même un champ, on suit son adresse
  const [postalTouched, setPostalTouched] = useState(false);
  const [cityTouched, setCityTouched] = useState(false);
  const [pointsRelais, setPointsRelais] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!postalTouched) setPostalCode(defaultPostalCode || "");
  }, [defaultPostalCode, postalTouched]);

  useEffect(() => {
    if (!cityTouched) setCity(defaultCity || "");
  }, [defaultCity, cityTouched]);

  // IMPORTANT : pas de <form> ici, ce composant est déjà dans le <form> du checkout
  // (les formulaires imbriqués sont invalides en HTML).
  const searchPointsRelais = async () => {
    if (!postalCode.trim()) {
      setError(t("checkout.mondialRelay.errors.postalRequired"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // L'appel API vit dans le thunk ; unwrap() renvoie la liste ou lève
      // le message d'erreur renvoyé par rejectWithValue.
      const list = await dispatch(
        fetchRelayPointsThunk({
          postalCode: postalCode.trim(),
          city: city.trim(),
        }),
      ).unwrap();

      setPointsRelais(list);
      if (list.length === 0) {
        setError(t("checkout.mondialRelay.errors.none"));
      }
    } catch (err) {
      setError(typeof err === "string" ? err : err?.message);
      setPointsRelais([]);
    } finally {
      setLoading(false);
    }
  };

  // Entrée dans un champ = lancer la recherche (et ne pas soumettre le paiement)
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchPointsRelais();
    }
  };

  return (
    <div className="mr-selector">
      <h4 className="mr-selector__title">{t("checkout.mondialRelay.title")}</h4>

      <div className="mr-selector__search">
        <input
          type="text"
          inputMode="numeric"
          className="mr-selector__input"
          placeholder={t("checkout.mondialRelay.postalPlaceholder")}
          aria-label={t("checkout.mondialRelay.postalPlaceholder")}
          value={postalCode}
          onChange={(e) => {
            setPostalTouched(true);
            setPostalCode(e.target.value);
          }}
          onKeyDown={handleKeyDown}
        />
        <input
          type="text"
          className="mr-selector__input"
          placeholder={t("checkout.mondialRelay.cityPlaceholder")}
          aria-label={t("checkout.mondialRelay.cityPlaceholder")}
          value={city}
          onChange={(e) => {
            setCityTouched(true);
            setCity(e.target.value);
          }}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="mr-selector__btn "
          onClick={searchPointsRelais}
          disabled={loading}
        >
          {loading
            ? t("checkout.mondialRelay.searching")
            : t("checkout.mondialRelay.search")}
        </button>
      </div>

      {error && (
        <p className="mr-selector__error" role="alert">
          {error}
        </p>
      )}

      {selectedRelay && (
        <div className="mr-selector__selected">
          <strong>{t("checkout.mondialRelay.selectedTitle")}</strong>
          <div>{clean(selectedRelay.LgAdr1)}</div>
          <div>{clean(selectedRelay.LgAdr3)}</div>
          <div>
            {clean(selectedRelay.CP)} {clean(selectedRelay.Ville)}
          </div>
        </div>
      )}

      {pointsRelais.length > 0 && (
        <ul className="mr-selector__list">
          {pointsRelais.map((point) => {
            const isSelected = selectedRelay?.Num === point.Num;
            return (
              <li
                key={point.Num}
                className={`mr-selector__item${isSelected ? " mr-selector__item--selected" : ""}`}
              >
                <div className="mr-selector__info">
                  <strong className="mr-selector__name">
                    {clean(point.LgAdr1)}
                  </strong>
                  <span className="mr-selector__address">
                    {clean(point.LgAdr3)} - {clean(point.CP)}{" "}
                    {clean(point.Ville)}
                    {point.Distance ? ` (${clean(point.Distance)} m)` : ""}
                  </span>
                </div>
                <button
                  type="button"
                  className={`mr-selector__choose${isSelected ? " mr-selector__choose--selected" : ""}`}
                  onClick={() => onSelectRelay(point)}
                >
                  {isSelected
                    ? t("checkout.mondialRelay.selected")
                    : t("checkout.mondialRelay.choose")}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

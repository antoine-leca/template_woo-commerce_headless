import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  fetchCurrentUserThunk,
  updateCurrentUserThunk,
  deleteCurrentUserThunk,
} from "../../../thunkActionsCreator/userThunks"; // À ajuster selon ton arborescence
import { showToast } from "../../../slices/toastSlice"; // À ajuster selon ton arborescence

export default function UserInfo() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.user);
  const profile = user?.profile;
  const loading = useSelector((state) => state.user.loading);
  const error = useSelector((state) => state.user.error);

  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "••••••••",
  });
  const [savedUser, setSavedUser] = useState(formData);

  // Nouveaux états pour la suppression du compte
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  // Propre à la suppression : `user.loading` est partagé par toutes les
  // requêtes du compte et annoncerait une suppression pendant un simple
  // rechargement du profil.
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchCurrentUserThunk());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      const loadedData = {
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
        password: "••••••••",
      };
      setFormData(loadedData);
      setSavedUser(loadedData);
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const updatePayload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
    };

    if (formData.password !== "••••••••") {
      updatePayload.password = formData.password;
    }

    // Utilisation de unwrap() pour gérer le succès ou l'échec du Thunk
    dispatch(updateCurrentUserThunk(updatePayload))
      .unwrap()
      .then(() => {
        dispatch(showToast(t("account.updated")));
        setSavedUser(formData);
        setIsEditing(false);
      })
      .catch((err) => {
        dispatch(showToast(err || t("account.updateError")));
      });
  };

  const handleCancel = () => {
    setFormData(savedUser);
    setIsEditing(false);
  };

  // --- LOGIQUE DE SUPPRESSION ---
  const handleConfirmDelete = () => {
    if (!deletePassword) {
      dispatch(showToast(t("account.passwordRequired")));
      return;
    }

    // Un second envoi partirait avant la fin du premier : le compte déjà
    // supprimé, il échouerait et afficherait une erreur juste après le succès.
    setIsDeleting(true);

    dispatch(deleteCurrentUserThunk({ password: deletePassword }))
      .unwrap()
      .then(() => {
        // La session est déjà fermée : userSlice vide le jeton, l'écouteur du
        // store remet panier et favoris à l'état invité. On remplace l'entrée
        // d'historique pour que « Précédent » ne ramène pas sur le profil d'un
        // compte qui n'existe plus.
        dispatch(showToast(t("account.deleted")));
        navigate("/", { replace: true });
      })
      .catch((err) => {
        setIsDeleting(false);
        dispatch(
          showToast(
            err || t("account.deleteError"),
          ),
        );
      });
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletePassword(""); // On vide le champ par sécurité
  };

  if (loading && !profile)
    return (
      <p style={{ marginTop: "20px" }}>{t("account.loading")}</p>
    );
  if (error) return <p style={{ color: "red" }}>Erreur: {error}</p>;

  // En édition l'intitulé est le libellé du champ (htmlFor) ; en lecture il
  // n'y a pas de champ, un <span> suffit.
  const Label = isEditing ? "label" : "span";

  return (
    <div>
      <h2 className="section-title">{t("account.personalInfo")}</h2>
      <div className="data-grid">
        <div className="data-item">
          <Label className="data-label" {...(isEditing && { htmlFor: "profile-firstname" })}>
            {t("common.firstName")}
          </Label>
          {isEditing ? (
            <input
              id="profile-firstname"
              type="text"
              name="firstName"
              autoComplete="given-name"
              value={formData.firstName}
              onChange={handleChange}
              className="data-input"
            />
          ) : (
            <span className="data-value">{formData.firstName}</span>
          )}
        </div>

        <div className="data-item">
          <Label className="data-label" {...(isEditing && { htmlFor: "profile-lastname" })}>
            {t("common.lastName")}
          </Label>
          {isEditing ? (
            <input
              id="profile-lastname"
              type="text"
              name="lastName"
              autoComplete="family-name"
              value={formData.lastName}
              onChange={handleChange}
              className="data-input"
            />
          ) : (
            <span className="data-value">{formData.lastName}</span>
          )}
        </div>

        <div className="data-item">
          <Label className="data-label" {...(isEditing && { htmlFor: "profile-email" })}>
            {t("common.email")}
          </Label>
          {isEditing ? (
            <input
              id="profile-email"
              type="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              className="data-input"
            />
          ) : (
            <span className="data-value">{formData.email}</span>
          )}
        </div>

        <div className="data-item">
          <Label className="data-label" {...(isEditing && { htmlFor: "profile-password" })}>
            {t("common.password")}
          </Label>
          {isEditing ? (
            <input
              id="profile-password"
              type="password"
              name="password"
              autoComplete="new-password"
              maxLength={128}
              value={formData.password}
              onChange={handleChange}
              className="data-input"
            />
          ) : (
            <span className="data-value">{formData.password}</span>
          )}
        </div>
      </div>

      <div className="action-buttons">
        {isEditing ? (
          <>
            <button
              className="action-btn"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? t("common.saving") : t("common.save")}
            </button>
            <button className="action-btn outline" onClick={handleCancel}>
              {t("common.cancel")}
            </button>
          </>
        ) : (
          <button className="action-btn" onClick={() => setIsEditing(true)}>
            {t("account.editInfo")}
          </button>
        )}
      </div>

      {/* --- ZONE DE DANGER --- */}
      <div className="danger-divider">
        <h2 className="section-title">{t("account.deleteTitle")}</h2>

        {/* Bascule conditionnelle entre le bouton initial et l'input de confirmation */}
        {!showDeleteConfirm ? (
          <>
            <p className="text-delete-account">
              {t("account.deleteIntro")}
            </p>
            <button
              className="action-btn outline"
              onClick={() => setShowDeleteConfirm(true)}
            >
              {t("account.deleteTitle")}
            </button>
          </>
        ) : (
          <div>
            <p className="delete-confirmation-message">
              {t("account.deleteConfirmIntro")}
            </p>
            <input
              type="password"
              autoComplete="current-password"
              aria-label={t("common.password")}
              maxLength={128}
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder={t("account.passwordPlaceholder")}
              className="data-input"
            />
            <div className="action-buttons">
              <button
                className="action-btn"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting
                  ? t("account.deleting")
                  : t("account.deleteConfirm")}
              </button>
              {/* Une requête partie ne s'annule pas : laisser ce bouton actif
                  ferait croire que la suppression peut encore être arrêtée. */}
              <button
                className="action-btn outline"
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

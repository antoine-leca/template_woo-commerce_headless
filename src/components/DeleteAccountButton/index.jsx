import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { deleteCurrentUserThunk } from "../../thunkActionsCreator/userThunks";
import { useTranslation } from "react-i18next";

export default function DeleteAccountButton() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.user);

  const handleDelete = () => {
    const confirmed = window.confirm(
      "Êtes-vous sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible.",
    );

    if (!confirmed) return;

    const password = window.prompt(
      "Entrez votre mot de passe pour confirmer la suppression :",
    );

    if (!password) return;

    dispatch(deleteCurrentUserThunk({ password }))
      .unwrap()
      .then(() => {
        alert(t("auth.accountDeleted"));
        navigate("/"); // Redirection vers l'accueil après suppression
      })
      .catch(() => {
        // Échec : le compte reste en place, l'utilisateur peut réessayer.
      });
  };

  return (
    <div className="delete-account-section">
      <button
        onClick={handleDelete}
        disabled={loading}
        style={{ backgroundColor: "red", color: "white" }}
      >
        {loading ? t("account.deleting") : t("account.deleteTitle")}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

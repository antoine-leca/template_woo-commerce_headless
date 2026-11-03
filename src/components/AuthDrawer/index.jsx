import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import {
  closeAuthModal,
  switchAuthModalView,
} from "../../slices/authModalSlice";
import { showToast } from "../../slices/toastSlice";
import {
  loginThunk,
  registerThunk,
} from "../../thunkActionsCreator/userThunks";
import ResetPasswordForm from "../ResetPasswordForm/ResetPasswordForm";
import "./index.css";
import { useTranslation } from "react-i18next";

// Rattache le message du serveur au champ qu'il concerne. Fonction pure, donc
// hors du composant : déclarée dans son corps après `if (!isOpen) return null`,
// elle n'existait pas pour les rendus où le tiroir était fermé.
const parseBackendError = (errorMsg) => {
  const fieldErrors = {};
  const errorLower = errorMsg.toLowerCase();

  if (errorLower.includes("email")) {
    fieldErrors.email = errorMsg;
  }
  if (errorLower.includes("mot de passe") || errorLower.includes("password")) {
    fieldErrors.password = errorMsg;
  }
  if (errorLower.includes("prenom") || errorLower.includes("prénom")) {
    fieldErrors.firstName = errorMsg;
  }
  if (errorLower.includes("nom")) {
    fieldErrors.lastName = errorMsg;
  }
  if (errorLower.includes("identifiant") || errorLower.includes("username")) {
    fieldErrors.username = errorMsg;
  }

  return Object.keys(fieldErrors).length > 0
    ? fieldErrors
    : { general: errorMsg };
};

export default function AuthDrawer() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isOpen, view, redirectTo } = useSelector((state) => state.authModal);
  const { loading, isAuthenticated } = useSelector((state) => state.user);

  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [justAuthenticated, setJustAuthenticated] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });

  const parseBackendError = (errorMsg) => {
    const fieldErrors = {};
    const errorLower = errorMsg.toLowerCase();

    if (errorLower.includes("email")) {
      fieldErrors.email = errorMsg;
    }
    if (errorLower.includes("mot de passe") || errorLower.includes("password")) {
      fieldErrors.password = errorMsg;
    }
    if (errorLower.includes("prenom") || errorLower.includes("prénom")) {
      fieldErrors.firstName = errorMsg;
    }
    if (errorLower.includes("nom")) {
      fieldErrors.lastName = errorMsg;
    }
    if (errorLower.includes("identifiant") || errorLower.includes("username")) {
      fieldErrors.username = errorMsg;
    }

    return Object.keys(fieldErrors).length > 0
      ? fieldErrors
      : { general: errorMsg };
  };

  useEffect(() => {
    if (isAuthenticated && justAuthenticated && isOpen) {
      // Relevée avant la fermeture, qui efface la destination du store.
      const destination = redirectTo || "/profile";
      dispatch(closeAuthModal());
      setForm({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
      });
      setErrors({});
      navigate(destination);
      setJustAuthenticated(false);
    }
  }, [isAuthenticated, justAuthenticated, isOpen, redirectTo, dispatch, navigate]);

  useEffect(() => {
    if (isOpen && view !== "reset-password") {
      setMode(view === "login" ? "login" : "register");
      setErrors({});
    }
  }, [isOpen, view]);

  if (!isOpen) return null;

  const close = () => dispatch(closeAuthModal());
  const stopPropagation = (e) => e.stopPropagation();
  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setErrors({});
  };

  const validateLogin = (e, updatedForm = form) => {
    setErrors({});
    const newErrors = {};

    if (mode === "login") {
      if (!updatedForm.username.trim()) {
        newErrors.username = "Le nom d'utilisateur est requis.";
      }
    }

    if (!updatedForm.password) {
      newErrors.password = "Le mot de passe est requis.";
    } else if (updatedForm.password.length < 8) {
      newErrors.password = "Il faut au moins 8 caractères.";
    }

    if (mode === "register") {
      if (!updatedForm.email.trim()) {
        newErrors.email = "L'adresse e-mail est requise.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updatedForm.email)) {
        newErrors.email = "Entrez une adresse e-mail valide.";
      }
      if (!updatedForm.firstName.trim()) {
        newErrors.firstName = "Le prénom est requis.";
      }
      if (!updatedForm.lastName.trim()) {
        newErrors.lastName = "Le nom est requis.";
      }
      if (!updatedForm.confirmPassword) {
        newErrors.confirmPassword = "Veuillez confirmer votre mot de passe.";
      } else if (updatedForm.confirmPassword !== updatedForm.password) {
        newErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
      }
    }
    setErrors(newErrors);
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...form, [name]: value };
    setForm(updatedForm);
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    validateLogin(e, updatedForm);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validateLogin();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setJustAuthenticated(true);
    const request =
      mode === "login"
        ? loginThunk({
            username: form.username.trim(),
            password: form.password,
          })
        : registerThunk({
            email: form.email.trim(),
            password: form.password,
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
          });

    // Seul l'échec de CETTE soumission concerne le tiroir. Il écoutait
    // auparavant `user.error`, que remplit n'importe quelle requête du compte
    // (profil, adresses, commandes…) : il affichait donc leurs erreurs comme
    // des erreurs de connexion, et plantait quand il était fermé.
    dispatch(request)
      .unwrap()
      .catch((message) => {
        dispatch(showToast(message));
        setErrors(parseBackendError(message));
        setJustAuthenticated(false);
      });
  };

  // Petite fonction pour générer l'icône oeil proprement
  const renderEyeIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {showPassword ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
        />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      )}
    </svg>
  );

  return (
    <div className="drawer-backdrop" onClick={close}>
      <div className="drawer-content" onClick={stopPropagation}>
        <button className="close-btn" onClick={close}>
          ✕
        </button>

        {view === "reset-password" ? (
          <ResetPasswordForm />
        ) : (
          <>
            <div className="drawer-header">
              <h2 className="drawer-title">
                {mode === "login" ? t("auth.loginTitle") : t("auth.createAccountTitle")}
              </h2>
            </div>

            {errors.general && (
              <div className="error-message" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(errors.general) }} />
            )}

            <form className="drawer-form" onSubmit={handleSubmit}>
              {mode === "login" && (
                <div className="input-group">
                  <label htmlFor="username">{t("auth.login")}</label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={form.username}
                    onChange={handleChange}
                    className={errors.username ? "input-error" : ""}
                    placeholder={t("auth.loginPlaceholder")}
                    autoComplete="username"
                  />
                  {errors.username && <p className="error-text" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(errors.username) }} />}
                  <p className="help-text">
                    {t("auth.loginHint")}
                  </p>
                </div>
              )}

              {mode === "register" && (
                <div className="input-group">
                  <label htmlFor="email">{t("common.email")}</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className={errors.email ? "input-error" : ""}
                    placeholder={t("auth.emailPlaceholder")}
                    autoComplete="email"
                  />
                  {errors.email && <p className="error-text" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(errors.email) }} />}
                </div>
              )}

              {mode === "register" && (
                <div className="input-group">
                  <label htmlFor="firstName">{t("common.firstName")}</label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={form.firstName}
                    onChange={handleChange}
                    className={errors.firstName ? "input-error" : ""}
                    placeholder={t("auth.firstNamePlaceholder")}
                    autoComplete="given-name"
                  />
                  {errors.firstName && <p className="error-text" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(errors.firstName) }} />}
                </div>
              )}

              {mode === "register" && (
                <div className="input-group">
                  <label htmlFor="lastName">{t("common.lastName")}</label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={form.lastName}
                    onChange={handleChange}
                    className={errors.lastName ? "input-error" : ""}
                    placeholder={t("auth.lastNamePlaceholder")}
                    autoComplete="family-name"
                  />
                  {errors.lastName && <p className="error-text" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(errors.lastName) }} />}
                </div>
              )}

              <div className="input-group">
                <label htmlFor="password">{t("common.password")}</label>
                <div className="password-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    className={errors.password ? "input-error" : ""}
                    placeholder="••••••••"
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={t("auth.showPassword")}
                  >
                    {renderEyeIcon()}
                  </button>
                </div>
                {errors.password && <p className="error-text" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(errors.password) }} />}
                {mode === "register" && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div
                        className={`strength-fill ${form.password.length >= 8 ? "valid" : ""}`}
                        style={{ width: `${Math.min((form.password.length / 8) * 100, 100)}%` }}
                      />
                    </div>
                    <span className={`strength-text ${form.password.length >= 8 ? "valid" : ""}`}>
                      {form.password.length}/8 caractères
                    </span>
                  </div>
                )}
              </div>

              {mode === "register" && (
                <div className="input-group">
                  <label htmlFor="confirmPassword">
                    {t("auth.confirmPassword")}
                  </label>
                  <div className="password-wrapper">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={handleChange}
                      className={errors.confirmPassword ? "input-error" : ""}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={t("auth.showPassword")}
                    >
                      {renderEyeIcon()}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="error-text" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(errors.confirmPassword) }} />}
                </div>
              )}

              {mode === "login" && (
                <button
                  type="button"
                  className="forgot-btn"
                  onClick={() =>
                    dispatch(switchAuthModalView("reset-password"))
                  }
                >
                  {t("auth.forgotPassword")}
                </button>
              )}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading
                  ? t("common.loading")
                  : mode === "login"
                    ? t("auth.signIn")
                    : t("auth.signUp")}
              </button>
            </form>

            <div className="drawer-footer">
              {mode === "login" ? (
                <>
                  <span>{t("auth.noAccount")}</span>
                  <button
                    type="button"
                    className="toggle-btn"
                    onClick={() => {
                      setMode("register");
                      setErrors({});
                    }}
                  >
                    {t("auth.createAccount")}
                  </button>
                </>
              ) : (
                <>
                  <span>{t("auth.hasAccount")}</span>
                  <button
                    type="button"
                    className="toggle-btn"
                    onClick={() => {
                      setMode("login");
                      setErrors({});
                    }}
                  >
                    {t("auth.signIn")}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

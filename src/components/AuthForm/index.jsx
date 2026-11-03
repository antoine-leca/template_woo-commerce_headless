import "./index.css";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  closeAuthModal,
  switchAuthModalView,
} from "../../slices/authModalSlice";
import { showToast } from "../../slices/toastSlice";
import {
  loginThunk,
  registerThunk,
} from "../../thunkActionsCreator/userThunks";
import { useTranslation } from "react-i18next";

export default function AuthForm() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector((state) => state.user);
  const [mode, setMode] = useState("login");
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });

  const isLogin = mode === "login";

  useEffect(() => {
    if (isAuthenticated) dispatch(closeAuthModal());
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    dispatch(showToast(error));
  }, [error]);

  const validateLogin = (e, updatedForm) => {
    setErrors({});
    const newErrors = {};
    !updatedForm && (updatedForm = form);
    if (!updatedForm.username.trim()) {
      newErrors.username = "Le nom d'utilisateur est requis.";
    }
    if (!updatedForm.password)
      newErrors.password = "Le mot de passe est requis.";
    else if (updatedForm.password.length < 8)
      newErrors.password = " Il faut au moins 8 caractères.";
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
    e.target.className === "login" && setMode("login");
    e.target.className === "signin" && setMode("register");
    const validation = validateLogin();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    if (mode === "login") {
      dispatch(
        loginThunk({ username: form.username.trim(), password: form.password }),
      );
    }
    if (mode === "register") {
      dispatch(
        registerThunk({
          email: form.email.trim(),
          password: form.password,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
        }),
      );
    }
    return;
  };

  return (
    <form className="auth-form">
      <h2>
        {mode === "login"
          ? t("auth.greeting")
          : mode === "register"
            ? t("auth.createAccountTitle")
            : t("auth.confirmPasswordTitle")}
      </h2>
      {isLogin && (
        <div className="auth-form__field">
          <label htmlFor="username">{t("auth.username")}</label>
          <input
            id="username"
            name="username"
            type="text"
            value={form.username}
            onChange={handleChange}
            className={errors.username ? "input--error" : ""}
            autoComplete="username"
            placeholder={errors.username}
            title={errors.username}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </div>
      )}
      {mode === "register" && (
        <div className="auth-form__field">
          <label htmlFor="email">{t("common.email")}</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className={errors.email ? "input--error" : ""}
            autoComplete="email"
            placeholder={errors.email}
            title={errors.email}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </div>
      )}
      {mode === "register" && (
        <div className="auth-form__field">
          <label htmlFor="firstName">{t("common.firstName")}</label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            value={form.firstName}
            onChange={handleChange}
            className={errors.firstName ? "input--error" : ""}
            autoComplete="given-name"
            placeholder={errors.firstName}
            title={errors.firstName}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </div>
      )}
      {mode === "register" && (
        <div className="auth-form__field">
          <label htmlFor="lastName">{t("common.lastName")}</label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            value={form.lastName}
            onChange={handleChange}
            className={errors.lastName ? "input--error" : ""}
            autoComplete="family-name"
            placeholder={errors.lastName}
            title={errors.lastName}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </div>
      )}
      <div className="auth-form__field">
        <label htmlFor="password">{t("common.password")}</label>
        <input
          id="password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          className={errors.password ? "input--error" : ""}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder={errors.password}
          title={errors.password}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
      </div>
      {mode === "register" && (
        <div className="auth-form__field">
          <label htmlFor="confirmPassword">{t("auth.confirmPassword")}</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            className={errors.confirmPassword ? "input--error" : ""}
            autoComplete="new-password"
            autoFocus
            placeholder={errors.confirmPassword}
            title={errors.confirmPassword}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </div>
      )}
      <button
        type="button"
        className="auth-form__forgot"
        onClick={() => dispatch(switchAuthModalView("reset-password"))}
      >
        {t("auth.forgotPassword")}
      </button>
      <div className="auth-form__buttons">
        <button
          className="login"
          type="button"
          onClick={(e) => handleSubmit(e)}
        >
          {t("auth.signIn")}
        </button>
        <button
          type="button"
          className="signin"
          onClick={(e) => handleSubmit(e)}
        >
          {t("auth.signUp")}
        </button>{" "}
      </div>
    </form>
  );
}

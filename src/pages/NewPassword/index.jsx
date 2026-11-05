import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Seo from "../../components/Seo";

export default function NewPassword() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const key = searchParams.get("key");
  const login = searchParams.get("login");

  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/wp-json/custom/v1/new-password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, login, password }),
      },
    );
    const data = await response.json();
    setMessage(data.message);
    if (response.ok) navigate("/");
  };

  return (
    <div>
      <Seo title={t("seo.newPassword")} noIndex />
      <h1>{t("auth.newPassword")}</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="password">{t("auth.newPassword")}</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">{t("auth.confirm")}</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

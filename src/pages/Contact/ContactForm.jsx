import { useState } from "react";
import "./ContactForm.css";
import { useTranslation } from "react-i18next";

export default function ContactForm() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    // Champ piège (voir plus bas) : toujours vide chez un vrai visiteur.
    website: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/wp-json/custom/v1/contact`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setFormData({ name: "", email: "", message: "", website: "" });
        setTimeout(() => setSuccess(false), 5000);
      } else {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ general: data.message });
        }
      }
    } catch (error) {
      setErrors({ general: t("contact.networkError") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      {success && (
        <div
          role="status"
          className="contact-form__message contact-form__message--success"
        >
          {t("contact.sent")}
        </div>
      )}

      {errors.general && (
        <div
          role="alert"
          className="contact-form__message contact-form__message--error"
        >
          {errors.general}
        </div>
      )}

      <div className="contact-form__group">
        <label htmlFor="name">{t("contact.name")} *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder={t("contact.namePlaceholder")}
          disabled={loading}
          autoComplete="name"
          maxLength={100}
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && (
          <span id="name-error" role="alert" className="contact-form__error">
            {errors.name}
          </span>
        )}
      </div>

      <div className="contact-form__group">
        <label htmlFor="email">{t("common.email")} *</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder={t("auth.emailPlaceholder")}
          disabled={loading}
          autoComplete="email"
          maxLength={254}
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <span id="email-error" role="alert" className="contact-form__error">
            {errors.email}
          </span>
        )}
      </div>

      <div className="contact-form__group">
        <label htmlFor="message">{t("contact.message")} *</label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder={t("contact.messagePlaceholder")}
          rows="6"
          disabled={loading}
          maxLength={5000}
          aria-required="true"
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
        />
        {errors.message && (
          <span id="message-error" role="alert" className="contact-form__error">
            {errors.message}
          </span>
        )}
      </div>

      {/* Champ piège : hors écran, ignoré des lecteurs d'écran et du clavier.
          Un robot qui remplit tous les champs le remplit aussi, et le serveur
          écarte alors le message sans rien envoyer. */}
      <div className="contact-form__trap" aria-hidden="true">
        <label htmlFor="website">website</label>
        <input
          type="text"
          id="website"
          name="website"
          value={formData.website}
          onChange={handleChange}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <button type="submit" className="contact-form__button" disabled={loading}>
        {loading ? t("contact.sending") : t("contact.send")}
      </button>
    </form>
  );
}

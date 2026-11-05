import { useTranslation } from "react-i18next";

// Premier élément focalisable de la page : un utilisateur du clavier saute
// l'en-tête et la navigation d'un seul appui. La cible (id="main-content") est
// le <main> de chaque page.
export default function SkipLink() {
  const { t } = useTranslation();

  return (
    <a className="skip-link" href="#main-content">
      {t("a11y.skipToContent")}
    </a>
  );
}

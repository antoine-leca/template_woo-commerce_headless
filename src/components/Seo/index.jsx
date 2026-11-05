import { Helmet } from "react-helmet-async";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const stripHtml = (value) =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Les moteurs de recherche tronquent au-delà d'environ 160 caractères.
const MAX_DESCRIPTION_LENGTH = 160;

const truncate = (text) =>
  text.length > MAX_DESCRIPTION_LENGTH
    ? `${text.slice(0, MAX_DESCRIPTION_LENGTH - 1).trimEnd()}…`
    : text;

// Les balises de chaque page remplacent celles de la page précédente (c'est le
// dernier <Seo> rendu qui l'emporte) ; celui de main.jsx, sans propriété, donne
// les valeurs par défaut du site.
function Seo({
  title,
  description,
  image,
  url,
  type = "website",
  jsonLd,
  noIndex = false,
  lang,
}) {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const {
    name: siteName,
    description: siteDescription,
    faviconUrl,
    logoUrl,
  } = useSelector((state) => state.site);

  // La langue du document suit celle de l'interface : un « fr » en dur la
  // laissait à « fr » quand le site était affiché en anglais, et les lecteurs
  // d'écran lisaient l'anglais avec une voix française.
  const language = lang || i18n.resolvedLanguage || "fr";
  const locale = language.startsWith("en") ? "en_US" : "fr_FR";

  const cleanTitle = stripHtml(title);
  const finalTitle =
    cleanTitle && siteName && !cleanTitle.includes(siteName)
      ? `${cleanTitle} | ${siteName}`
      : cleanTitle || siteName;
  // Le slogan WordPress est souvent vide : sans repli, la plupart des pages
  // n'auraient aucune description.
  const finalDescription = truncate(
    stripHtml(description) || siteDescription || t("seo.homeDescription"),
  );
  const finalImage = image || logoUrl;
  const cardType = finalImage ? "summary_large_image" : "summary";

  // Adresse canonique : celle de la page, sans paramètres de recherche ni de
  // filtre, pour que /catalogue?page=2 et /catalogue ne soient pas deux pages.
  const canonicalUrl = url || `${window.location.origin}${pathname}`;

  return (
    <Helmet htmlAttributes={{ lang: language }}>
      {finalTitle && <title>{finalTitle}</title>}
      {finalDescription && <meta name="description" content={finalDescription} />}
      {faviconUrl && <link rel="icon" href={faviconUrl} />}

      {/* Une page privée ou sans contenu propre n'a pas à apparaître dans les
          résultats de recherche, ni à recevoir d'adresse canonique. */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      {!noIndex && <link rel="canonical" href={canonicalUrl} />}

      {finalTitle && <meta property="og:title" content={finalTitle} />}
      {finalDescription && (
        <meta property="og:description" content={finalDescription} />
      )}
      <meta property="og:type" content={type} />
      <meta property="og:locale" content={locale} />
      {siteName && <meta property="og:site_name" content={siteName} />}
      {!noIndex && <meta property="og:url" content={canonicalUrl} />}
      {finalImage && <meta property="og:image" content={finalImage} />}

      <meta name="twitter:card" content={cardType} />
      {finalTitle && <meta name="twitter:title" content={finalTitle} />}
      {finalDescription && (
        <meta name="twitter:description" content={finalDescription} />
      )}
      {finalImage && <meta name="twitter:image" content={finalImage} />}

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}

export default Seo;

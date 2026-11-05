import { useTranslation } from "react-i18next";
import Feed from "../../components/Feed";
import Seo from "../../components/Seo";
import Filters from "../../components/Filters";

export default function Store() {
  const { t } = useTranslation();

  return (
    <>
      <Seo title={t("seo.catalog")} description={t("seo.catalogDescription")} />
      <h1 className="visually-hidden">{t("seo.catalog")}</h1>
      <Filters />
      <Feed />
    </>
  );
}
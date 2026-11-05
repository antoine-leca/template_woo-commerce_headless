import { useTranslation } from "react-i18next";
import PageContent from "../../components/PageContent";
import Seo from "../../components/Seo";
import ContactForm from "./ContactForm";

export default function Contact() {
  const { t } = useTranslation();

  return (
    <>
      <Seo title={t("seo.contact")} description={t("seo.contactDescription")} />
      <PageContent slug="contact" />
      <ContactForm />
    </>
  );
}

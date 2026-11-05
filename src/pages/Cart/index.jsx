import { useTranslation } from "react-i18next";
import CartComponent from "../../components/Cart";
import Seo from "../../components/Seo";

export default function Cart() {
  const { t } = useTranslation();

  return (
    <>
      <Seo title={t("seo.cart")} noIndex />
      <CartComponent />
    </>
  );
}
import { OrderSummary } from "./components/OrderSummaryA";
import { AddressForm } from "./components/AddressForm";
import { PaymentForm } from "./components/PaymentForm";
import {
  mockCartItems,
  mockCartTotals,
  mockShippingAddress,
  mockBillingAddress,
} from "./mockData";
import "./index.scss";
import { useTranslation } from "react-i18next";
import Seo from "../../components/Seo";

export default function Payment() {
  const { t } = useTranslation();

  return (
    <div className="payment">
      <Seo title={t("seo.checkout")} noIndex />
      <h1 className="payment__title">{t("cart.checkout")}</h1>

      <div className="payment__container">
        {/* Section Gauche: Informations */}
        <div className="payment__left">
          <section className="payment__card">
            <AddressForm
              title={t("address.shipping")}
              address={mockShippingAddress}
              type="shipping"
            />
          </section>

          <section className="payment__card">
            <AddressForm
              title={t("address.billing")}
              address={mockBillingAddress}
              type="billing"
            />
          </section>
        </div>

        {/* Section Droite: Paiement + Résumé */}
        <div className="payment__right">
          <section className="payment__card">
            <PaymentForm total={mockCartTotals.total} />
          </section>

          <section className="payment__card">
            <OrderSummary items={mockCartItems} totals={mockCartTotals} />
          </section>
        </div>
      </div>
    </div>
  );
}

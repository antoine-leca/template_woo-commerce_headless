import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  applyCouponThunk,
  removeCouponThunk,
} from "../../thunkActionsCreator/cartThunks";
import { showToast } from "../../slices/toastSlice";
import { formatAmount } from "../../utils/formatPrice";
import { useTranslation } from "react-i18next";

export default function Coupon() {
  const { totals, coupons } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [code, setCode] = useState("");

  const applyCoupon = async (e) => {
    e.preventDefault();
    if (!code) return;
    const result = await dispatch(applyCouponThunk({ code }));
    if (applyCouponThunk.fulfilled.match(result)) {
      dispatch(showToast(t("coupon.applied")));
      setCode("");
    } else {
      dispatch(showToast(result.payload || t("coupon.invalid")));
    }
  };

  return (
    <>
      <form onSubmit={applyCoupon}>
        <input
          name="coupon"
          autoComplete="off"
          maxLength={50}
          aria-label={t("coupon.placeholder")}
          placeholder={t("coupon.placeholder")}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button type="submit">{t("coupon.apply")}</button>
      </form>

      {coupons.map((coupon) => (
        <p key={coupon.code}>
          {coupon.code}{" "}
          <button
            onClick={() => dispatch(removeCouponThunk({ code: coupon.code }))}
          >
            {t("coupon.remove")}
          </button>
        </p>
      ))}

      {totals && parseInt(totals.total_discount) > 0 && (
        <div>
          {t("coupon.discount")} : −{formatAmount(
            parseInt(totals.total_discount) / 100,
            totals.currency_code,
          )}
        </div>
      )}
    </>
  );
}

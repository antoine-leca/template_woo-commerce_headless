import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Loader from "../Loader";
import "./index.css";
import { formatDate } from "../../utils/formatDate";
import { withAuth } from "../../utils/withAuth";
import { useTranslation } from "react-i18next";

const Review = ({ productId }) => {
  const { t } = useTranslation();
  const userState = useSelector((state) => state.user || {});

  const user = userState.profile || userState.customer || null;
  const csrfToken = userState.csrfToken;
  const userOrders = useSelector((state) => state.user?.orders ?? []);

  // États pour les avis
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // États pour l'achat et le formulaire
  const [hasPurchased, setHasPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const baseUrl = import.meta.env.VITE_API_URL;

  // --- Chargement des avis ---
  const fetchReviews = () => {
    if (!productId) {
      setReviews([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(
      `${baseUrl}/wp-json/wc/store/v1/products/reviews?product_id=${productId}`,
    )
      .then((response) => {
        if (!response.ok) throw new Error(`Erreur réseau ${response.status}`);
        return response.json();
      })
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || t("review.loadError")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  // Helper pour vérifier si une liste d'articles contient le produit
  const containsProduct = (lineItems, targetId) => {
    if (!Array.isArray(lineItems)) return false;

    const target = targetId?.toString();

    return lineItems.some((item) => {
      if (!item || typeof item !== "object") return false;

      const candidates = [
        item.product_id,
        item.variation_id,
        item.product,
        item.id,
        item.name,
      ]
        .filter(Boolean)
        .map((value) => value?.toString());

      return candidates.some(
        (value) => value === target || value?.includes(target),
      );
    });
  };

  // --- Vérification de l'achat du produit ---
  useEffect(() => {
    if (!user || !productId) {
      setHasPurchased(false);
      return;
    }

    const checkPurchase = async () => {
      setCheckingPurchase(true);
      try {
        if (Array.isArray(userOrders) && userOrders.length > 0) {
          const purchased = userOrders.some((order) => {
            const status = order?.status?.toLowerCase?.() || "";
            const isCompleted = ["completed", "processing", "paid"].includes(
              status,
            );
            const hasProduct = [
              order?.line_items,
              order?.items,
              order?.products,
            ].some((items) => containsProduct(items, productId));

            return isCompleted && hasProduct;
          });

          if (purchased) {
            setHasPurchased(true);
            setCheckingPurchase(false);
            return;
          }
        }

        // 2. Option B : Appel API WooCommerce si aucune commande n’est déjà chargée
        const response = await fetch(
          `${baseUrl}/wp-json/wc/v3/orders?customer=${user?.id}&status=completed`,
          withAuth(csrfToken),
        );

        if (response.ok) {
          const orders = await response.json();
          const purchased = orders.some((order) => {
            const status = order?.status?.toLowerCase?.() || "";
            const isCompleted = ["completed", "processing", "paid"].includes(
              status,
            );
            const hasProduct = [
              order?.line_items,
              order?.items,
              order?.products,
            ].some((items) => containsProduct(items, productId));

            return isCompleted && hasProduct;
          });
          setHasPurchased(purchased);
        } else {
          console.error(
            `❌ [Review] Erreur API Orders (${response.status}) :`,
            await response.text(),
          );
          setHasPurchased(false);
        }
      } catch (err) {
        console.error(
          "❌ [Review] Erreur lors de la vérification de l'achat :",
          err,
        );
        setHasPurchased(false);
      } finally {
        setCheckingPurchase(false);
      }
    };

    checkPurchase();
  }, [user, productId, userOrders, csrfToken, baseUrl]);

  // --- Soumission d'un avis ---
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !rating) return;

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const response = await fetch(
        `${baseUrl}/wp-json/wc/v3/products/reviews`,
        withAuth(csrfToken, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: productId,
            review: comment,
            reviewer: user?.username,
            reviewer_email: user?.email,
            rating: rating,
          }),
        }),
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || t("review.sendError"));
      }

      setSubmitSuccess(true);
      setComment("");
      setRating(0);
      fetchReviews();
    } catch (err) {
      setSubmitError(err.message || t("review.publishError"));
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (ratingValue) => {
    const value = Math.round(Number(ratingValue) || 0);
    return Array.from({ length: 5 }, (_, index) =>
      index < value ? "★" : "☆",
    ).join("");
  };

  return (
    <div id="reviews-section" className="review-list">
      <h2>{t("review.title")}</h2>

      {/* --- BLOC NOUVEL AVIS --- */}
      <div className="add-review-section">
        {!user ? (
          <p className="review-info">{t("review.signInPrompt")}</p>
        ) : checkingPurchase ? (
          <p className="review-info">{t("review.checking")}</p>
        ) : hasPurchased ? (
          <form onSubmit={handleSubmitReview} className="review-form">
            <h3>{t("review.write")}</h3>

            {submitSuccess && <p>{t("review.published")}</p>}
            {submitError && <p>{submitError}</p>}

            <div>
              <label>{t("review.rating")} : </label>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  aria-label={`Choisir ${star} étoiles`}
                  className={`review-star-button ${star <= rating ? "active" : ""}`}
                >
                  ★
                </button>
              ))}
              {!rating && (
                <p className="review-helper-text">
                  {t("review.ratingHint")}
                </p>
              )}
            </div>

            <div>
              <textarea
                rows="3"
                className="review-textarea"
                placeholder={t("review.placeholder")}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={submitting}>
              {submitting ? t("review.submitting") : t("review.submit")}
            </button>
          </form>
        ) : (
          <p className="review-info">
            {t("review.customersOnly")}
            avis.
          </p>
        )}
      </div>

      {/* --- LISTE DES AVIS --- */}
      {loading && <Loader size="lg" />}
      {error && <p className="review-error">{t("common.error")} : {error}</p>}
      {!loading && !error && reviews.length === 0 && <p>{t("review.none")}</p>}

      {reviews.map((review) => (
        <article key={review.id || review.review_id} className="review-item">
          <div className="review-stars">{renderStars(review.rating)}</div>
          <div className="review-meta">
            <strong>
              {review.reviewer ?? t("review.anonymous")}
              {" - "}
            </strong>
            <span>
              {formatDate(review.date_created)}
            </span>
          </div>
          <div
            className="review-content"
            dangerouslySetInnerHTML={{
              __html: review.review || "",
            }}
          />
        </article>
      ))}
    </div>
  );
};

export default Review;

import "./index.css";

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Loader from "../../components/Loader";
import { fetchProductsThunk } from "../../thunkActionsCreator/productsThunks";
import { fetchCategoriesThunk } from "../../thunkActionsCreator/categoriesThunks";
import ProductCard from "../ProductCard";

export default function Feed() {
  const dispatch = useDispatch();
  const filters = useSelector((state) => state.filters);
  const { list, loading, error } = useSelector((state) => state.products);
  const items = list?.data || [];
  const currentPage = list?.page || 1;
  const perPage = list?.perPage || 20;
  const hasMore = items.length > 0 && items.length % perPage === 0;
  const loadMoreRef = useRef(null);
  const feedContainerRef = useRef(null);

  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          loadMoreProducts();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, currentPage, dispatch]);

  useEffect(() => {
    if (feedContainerRef.current) {
      feedContainerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [filters]);

  const loadMoreProducts = () => {
    if (hasMore && !loading) {
      dispatch(
        fetchProductsThunk({
          ...filters,
          page: currentPage + 1,
          per_page: 20,
        }),
      );
    }
  };

  return (
    <div className="feed-container">
      <span ref={feedContainerRef}></span>
      {items.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
      {hasMore && !loading && (
        <div className="load-more">
          <span ref={loadMoreRef}></span>
        </div>
      )}
      {loading && <Loader size="lg" />}
    </div>
  );
}

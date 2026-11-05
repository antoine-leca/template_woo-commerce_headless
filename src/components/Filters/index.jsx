import { useEffect, useState } from "react";
import { fetchCategoriesThunk } from "../../thunkActionsCreator/categoriesThunks";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductsThunk } from "../../thunkActionsCreator/productsThunks";
import { setFilters } from "../../slices/filtersSlice";
import { useTranslation } from "react-i18next";
import { decodeHtml } from "../../utils/decodeHtml";

export default function Filters() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { items: categories, loading: categoriesLoading } = useSelector(
    (state) => state.categories,
  );
  const { list, loading, error } = useSelector((state) => state.products);
  const filters = useSelector((state) => state.filters);

  useEffect(() => {
    dispatch(fetchCategoriesThunk());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchProductsThunk({ ...filters, page: 1, per_page: 20 }));
  }, [filters, dispatch]);

  const handleCategoryChange = (e) => {
    dispatch(setFilters({ category: e.target.value, search: "" }));
  };

  const handleSortChange = (e) => {
    const [orderby, order] = e.target.value.split("-");
    dispatch(setFilters({ orderby, order }));
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    dispatch(setFilters({ [name]: value }));
  };

  return (
    <>
      <input
        type="text"
        value={filters.search}
        onChange={(e) => dispatch(setFilters({ search: e.target.value }))}
        placeholder={t("catalog.searchProduct")}
      />
      <select value={filters.category} onChange={handleCategoryChange}>
        <option value="">{t("catalog.allCategories")}</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {decodeHtml(cat.name)}
          </option>
        ))}
      </select>
      <input
        type="number"
        name="min_price"
        value={filters.min_price}
        onChange={handlePriceChange}
        placeholder={t("catalog.priceMin")}
      />
      <input
        type="number"
        name="max_price"
        value={filters.max_price}
        onChange={handlePriceChange}
        placeholder={t("catalog.priceMax")}
      />
      <select
        value={`${filters.orderby}-${filters.order}`}
        onChange={handleSortChange}
      >
        <option value="date-desc">{t("catalog.newest")}</option>
        <option value="price-asc">{t("catalog.priceAsc")}</option>
        <option value="price-desc">{t("catalog.priceDesc")}</option>
        <option value="title-asc">{t("catalog.nameAsc")}</option>
      </select>
    </>
  );
}

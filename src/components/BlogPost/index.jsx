import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { fetchBlogPostBySlugThunk} from "../../thunkActionsCreator/blogThunks";
import Seo from "../Seo";
import "./index.css";
import { formatLongDate } from "../../utils/formatDate";
import { useTranslation } from "react-i18next";
import { sanitizeHtml } from "../../utils/sanitizeHtml";

export default function BlogPostComponent() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { singlePost, loadingSingle, errorSingle } = useSelector(
    (state) => state.blog,
  );
  const baseUrl = window.location.origin;

  useEffect(() => {
    dispatch(fetchBlogPostBySlugThunk(slug));
  }, [slug, dispatch]);

  if (loadingSingle) {
    return <Loader size="md" />
  }

  if (errorSingle || !singlePost) {
    return <div>{t("blog.notFound")}</div>;
  }

  return (
    <div className="blog-post">
      <Seo
        title={singlePost.titleText}
        description={singlePost.excerptText}
        image={singlePost.image}
        url={`${baseUrl}/blog/${singlePost.id}`}
        type="article"
      />

      <h1>{singlePost.titleText}</h1>
      <p className="blog-post-date">
        {formatLongDate(singlePost.date)}
      </p>

      <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(singlePost.contentHtml) }} />
    </div>
  );
}
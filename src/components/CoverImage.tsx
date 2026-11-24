import ArticleCover from "@/components/visuals/ArticleCover";
import { safeHref } from "@/components/RichText";

/** Article cover: the uploaded image when one is set, otherwise the generated category cover. */
export default function CoverImage({ article, size = "md", className = "" }: { article: { category: string; coverImage?: string; coverAlt?: string }; size?: "md" | "lg"; className?: string }) {
  if (article.coverImage) {
    // eslint-disable-next-line @next/next/no-img-element -- uploaded media, already sized; no optimiser on shared hosting
    return <img src={safeHref(article.coverImage, "")} alt={article.coverAlt ?? ""} className={`w-full object-cover ${className}`} loading="lazy" />;
  }
  return <ArticleCover category={article.category} size={size} className={className} />;
}

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getAllMedia } from "../api/page.api";

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function transformMedia(item: any): any {
  return {
    id: String(item.id),
    title: item.title,
    description: item.description || item.shortDescription || "",
    content: "",
    readTime: "",
    category: item.tags?.[0]?.name || "Uncategorized",
    categoryAr: item.tags?.[0]?.name_ar || item.tags?.[0]?.name || "غير مصنف",
    image: item.file || item.media || "",
    isVideo: item.fileType === "video",
    date: formatDate(item.createdAt),
    author: "",
    tags: (item.tags || []).map((t: any) => t.name),
    tagsAr: (item.tags || []).map((t: any) => t.name_ar || t.name),
    type: "media",
    fileType: item.fileType,
  };
}

export function getLocalizedTags(item: any, lang: string): string[] {
  return lang === 'ar' ? (item.tagsAr || item.tags || []) : (item.tags || []);
}

export function getLocalizedCategory(item: any, lang: string): string {
  return lang === 'ar' ? (item.categoryAr || item.category) : item.category;
}

export function useMedia(page = 1, limit = 100) {
  const { i18n } = useTranslation();
  const [items, setItems] = useState<any>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchMedia() {
      setLoading(true);
      setError(null);
      try {
        const res = await getAllMedia(page, limit);
        if (cancelled) return;
        const transformed = (res.data.data || []).map(transformMedia);
        setItems(transformed);
        setTotal(res.data.total);
        setPages(res.data.pages);
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to load media");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchMedia();

    return () => {
      cancelled = true;
    };
  }, [page, limit]);

  return { items, total, pages, loading, error, lang: i18n.language };
}

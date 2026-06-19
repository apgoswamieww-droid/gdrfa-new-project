import { useState, useEffect } from "react";
import { getAllBlogs } from "../api/page.api";
import { editorJsToHtml } from "../utils/editorJsToHtml";

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function extractReadTime(readingTime: string): string {
  const match = readingTime.match(/^(\d+)/);
  return match ? match[1] : readingTime;
}

export function transformBlog(item: any): any {
  return {
    id: String(item.id),
    title: item.title,
    title_ar: item.title_ar,
    description: item.description || item.shortDescription || "",
    description_ar: item.description_ar || item.shortDescription_ar,
    content: editorJsToHtml(item.content),
    readTime: extractReadTime(item.readingTime),
    category: item.tags?.[0]?.name || "Uncategorized",
    image: item.media || "",
    isVideo: item.mediaType === "video",
    date: formatDate(item.createdAt),
    author: "",
    tags: (item.tags || []).map((t: any) => t.name),
    type: "blog",
  };
}

export function useBlogs(page = 1, limit = 10) {
  const [items, setItems] = useState<any>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchBlogs() {
      setLoading(true);
      setError(null);
      try {
        const res = await getAllBlogs(page, limit);
        if (cancelled) return;
        const transformed = (res.data.data || []).map(transformBlog);
        setItems(transformed);
        setTotal(res.data.total);
        setPages(res.data.pages);
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to load blogs");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchBlogs();

    return () => {
      cancelled = true;
    };
  }, [page, limit]);

  return { items, total, pages, loading, error };
}

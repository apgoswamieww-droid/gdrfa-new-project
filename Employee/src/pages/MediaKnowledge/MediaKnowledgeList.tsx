import { useBlogs } from "../../hooks/useBlogs";
import { useMedia } from "../../hooks/useMedia";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function MediaKnowledgeList() {
  const { t } = useTranslation();
  const { items: blogItems, loading: blogLoading } = useBlogs(1, 100);
  const { items: mediaItems, loading: mediaLoading } = useMedia(1, 100);
  const [activeType, setActiveType] = useState<"blog" | "media">("blog");
  const [activeCategory, setActiveCategory] = useState("All");

  const allItems = useMemo(() => [...blogItems, ...mediaItems], [blogItems, mediaItems]);

  const loading = activeType === "blog" ? blogLoading : mediaLoading;

  const categories = useMemo(() => {
    const relevantData = allItems.filter((item) => item.type === activeType);
    const uniqueCategories = Array.from(new Set(relevantData.map((item) => item.category)));
    return ["All", ...uniqueCategories];
  }, [allItems, activeType]);

  const filteredData = useMemo(() => {
    return allItems.filter((item) => {
      const matchesType = item.type === activeType;
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      return matchesType && matchesCategory;
    });
  }, [allItems, activeType, activeCategory]);

  return (
    <section className="relative xl:pt-36 lg:pt-30 pt-24 xl:pb-24 lg:pb-16 pb-10 overflow-hidden bg-[linear-gradient(180deg,#FFF3F3_0%,#FFFFFF_48%,#F7FAFD_100%)]">
      <div className="absolute inset-0 media-detail-grid opacity-40" />
      <div className="relative max-w-341.5 w-full mx-auto md:px-7 px-4">
        <div className="flex lg:flex-nowrap flex-wrap lg:items-end justify-between gap-5 lg:mb-10 mb-6">
          <div className="lg:max-w-150 max-w-full">
            <span className="inline-flex rounded-full bg-primary/10 text-primary px-4 py-2 text-sm font-bold mb-4">
              {t("mediaKnowledge.title")}
            </span>
            <h1 className="xl:text-[52px]/[0.98] md:text-4xl/tight text-3xl/tight font-bold text-secondary">
              {t("mediaKnowledge.subtitle")}
            </h1>
          </div>
          <div className="flex flex-col lg:items-end gap-4">
            <div className="flex p-1 rounded-2xl border border-secondary/20 bg-white/50 backdrop-blur-sm">
              <button
                onClick={() => {
                  setActiveType("blog");
                  setActiveCategory("All");
                }}
                className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeType === "blog"
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-secondary/60 hover:text-secondary"
                }`}
              >
                {t("mediaKnowledge.blog")}
              </button>
              <button
                onClick={() => {
                  setActiveType("media");
                  setActiveCategory("All");
                }}
                className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeType === "media"
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-secondary/60 hover:text-secondary"
                }`}
              >
                {t("mediaKnowledge.media")}
              </button>
            </div>
            <p className="lg:max-w-120 text-secondary/60 md:text-base/tight text-sm/tight font-medium lg:text-end">
              {t("mediaKnowledge.description")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-5 py-2.5 text-sm font-bold border transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? "bg-primary text-white border-primary"
                  : "bg-white/70 text-secondary border-secondary/10 hover:border-primary hover:text-primary"
              }`}
            >
              {cat === "All" ? t("mediaKnowledge.all") : cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-secondary/60">Loading...</div>
        ) : (
        <div className="grid xl:grid-cols-3 md:grid-cols-2 grid-cols-1 xl:gap-6 gap-5">
          {filteredData.map((item: any, index: any) => (
            <article
              key={item.id}
              className={`group cursor-pointer ${index === 0 ? "md:col-span-2 lg:col-span-1" : ""}`}
            >
              <div className="relative lg:rounded-3xl rounded-2xl lg:h-78 sm:h-68 h-60 overflow-hidden">
                {item.type === "media" && item.isVideo ? (
                  <video src={item.image} muted playsInline className="w-full h-full object-cover" />
                ) : item.type === "media" && !item.isVideo ? (
                  <div className="w-full h-full bg-gradient-to-br from-primary/80 to-[#2E0006] flex items-center justify-center">
                    <span className="text-white/90 text-2xl font-bold">{getFileExt(item.image) || "FILE"}</span>
                  </div>
                ) : (
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(360deg,#2E0006_0%,rgba(148,1,20,0)_100%)]" />
                <div className="absolute inset-0 z-10 flex flex-col justify-between p-4">
                  <div className="flex gap-2 flex-wrap">
                    <span className="rounded-full text-white md:text-xs/tight text-[10px]/tight font-semibold py-1 px-2.5 bg-primary">
                      {item.category}
                    </span>
                    {item.isVideo && (
                      <span className="rounded-full text-white md:text-xs/tight text-[10px]/tight font-semibold py-1 px-2.5 bg-black/50 flex items-center gap-1">
                        <PlayIcon />
                        {t("mediaKnowledge.video")}
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-white/80 rounded-xl p-3 flex flex-col justify-between backdrop-blur-[2px]">
                    <h3 className="font-bold md:text-base/tight text-sm/tight text-secondary line-clamp-2">{item.title}</h3>
                    <div className="flex items-center gap-3 mt-2 text-xs font-medium text-secondary/70">
                      <span className="flex items-center gap-1">
                        <CalendarSmallIcon />
                        {item.date}
                      </span>
                      {item.readTime && <span>{item.readTime} {t("mediaKnowledge.minRead")}</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="xl:mt-4 mt-2.5 lg:px-0 px-1 flex gap-3 items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-secondary/60 md:text-sm/tight text-xs/tight font-medium line-clamp-3">{item.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {item.tags.slice(0, 3).map((tag: any) => (
                      <span key={tag} className="text-xs font-semibold text-primary/70 bg-primary/8 px-2 py-1 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <Link
                  to={`/media-knowledge/${item.id}?type=${item.type}`}
                  className="group/arrow xl:min-w-11 xl:w-11 min-w-9 w-9 text-white hover:text-primary aspect-square border border-primary rounded-full bg-primary hover:bg-transparent flex justify-center items-center flex-shrink-0 transition-all duration-300 mt-auto"
                  aria-label={`${t("mediaKnowledge.readMore")} ${item.title}`}
                >
                  <svg className="group-hover/arrow:-rotate-45 transition-transform duration-300 rtl:-scale-x-100 xl:w-6 w-5 h-auto" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M17 7L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M11 6.13C11 6.13 16.63 5.66 17.49 6.51C18.34 7.36 17.8 13 17.8 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
            </article>
          ))}
        </div>
        )}
      </div>
    </section>
  );
}

function getFileExt(url: string): string {
  const match = url.match(/\.(\w+)(?:\?|$)/);
  return match ? match[1].toUpperCase() : "";
}

function PlayIcon() {
  return (
    <svg className="w-3 h-3" width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M3.5 2.5L9.5 6L3.5 9.5V2.5Z" fill="currentColor" />
    </svg>
  );
}

function CalendarSmallIcon() {
  return (
    <svg className="w-3.5 h-3.5" width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M10.5 2.5V4.5M3.5 2.5V4.5M2.5 6.5H11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M11.5 8.5C11.5 6.01 11.5 4.75 10.63 4.01C9.75 3.25 8.51 3.25 6 3.25C3.51 3.25 2.25 3.25 1.5 4.01C0.75 4.75 0.75 6.01 0.75 8.5C0.75 10.99 0.75 12.25 1.5 13.01C2.25 13.75 3.51 13.75 6 13.75C8.51 13.75 9.75 13.75 10.63 13.01C11.5 12.25 11.5 10.99 11.5 8.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

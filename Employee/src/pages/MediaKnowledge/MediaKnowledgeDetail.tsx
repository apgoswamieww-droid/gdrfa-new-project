import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { getBlogById, getMediaById } from "../../api/page.api";
import { transformBlog } from "../../hooks/useBlogs";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function MediaKnowledgeDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "blog";
  const isMedia = type === "media";

  const [item, setItem] = useState<any | null>(null);
  const [relatedItems, setRelatedItems] = useState<any[]>([]);
  const [mediaFile, setMediaFile] = useState<string>("");
  const [mediaFileType, setMediaFileType] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setNotFound(false);
      try {
        if (isMedia) {
          const res = await getMediaById(id as string);
          if (cancelled) return;
          const d = res.data;
          setMediaFile(d.file || "");
          setMediaFileType(d.fileType);
          setItem({
            id: String(d.id),
            title: d.title,
            description: d.description || d.shortDescription || "",
            content: "",
            readTime: d.readingTime || "",
            category: d.tags?.[0]?.name || "Uncategorized",
            image: d.file || "",
            isVideo: d.fileType === "video",
            date: d.createdAt ? new Date(d.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
            author: "",
            tags: (d.tags || []).map((tg: any) => tg.name),
            type: "media",
            fileType: d.fileType,
          });
          setRelatedItems((d.relatedMedia || []).map(transformRelatedMedia));
        } else {
          const res = await getBlogById(id as string | number);
          if (cancelled) return;
          setItem(transformBlog(res.data));
          setRelatedItems((res.data.relatedBlogs || []).map(transformRelatedBlog));
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [id, isMedia]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  if (loading) {
    return (
      <div className="relative xl:pt-36 lg:pt-30 pt-24 xl:pb-24 lg:pb-16 pb-10">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-secondary/60">Loading...</div>
        </div>
      </div>
    );
  }

  if (!item || notFound) return <Navigate to="/media-knowledge" replace />;

  return (
    <article className="relative xl:pt-36 lg:pt-30 pt-24 xl:pb-24 lg:pb-16 pb-10">
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-primary/20">
        <div className="h-full bg-Primary transition-[] duration-75" style={{ width: `${scrollProgress}%` }} />
      </div>

      {isMedia ? (
        <MediaHero item={item} mediaFile={mediaFile} mediaFileType={mediaFileType} t={t} />
      ) : (
        <BlogHero item={item} t={t} />
      )}

      <div className="relative max-w-341.5 mx-auto md:px-7 px-4">
        <div className="grid lg:grid-cols-[1fr_300px] gap-10 xl:gap-16 items-start">
          <div className="min-w-0">
            {isMedia ? (
              <MediaBody item={item} mediaFile={mediaFile} mediaFileType={mediaFileType} t={t} />
            ) : (
              <BlogBody item={item} relatedItems={relatedItems} t={t} />
            )}
          </div>

          <aside className="lg:block hidden sticky top-24">
            <div className="rounded-3xl bg-white border border-Secondary/10 p-6 mb-6">
              <h3 className="font-bold text-lg/-tight text-Secondary mb-4">{t("mediaKnowledge.inThisArticle")}</h3>
              <div className="text-sm font-medium text-Secondary/60 space-y-2 [&_h3]:font-bold [&_h3]:text-base [&_h3]:text-Primary [&_h3]:mb-2">
                <p>Getting started</p>
                <p>Event highlights</p>
                <p>Awards ceremony</p>
                <p>Looking ahead</p>
              </div>
            </div>

            <div className="rounded-3xl bg-[#F7EEF0] border border-Primary/10 p-6">
              <h3 className="font-bold text-lg/tight text-Secondary mb-4">{t("mediaKnowledge.browseByCategory")}</h3>
              <div className="space-y-2">
                {["All", "Running", "Football", "Cycling", "Wellness", "Fitness"].map((cat) => (
                  <Link key={cat} to={`/media-knowledge?category=${cat}`} className="flex items-center justify-between py-2 px-3 rounded-xl text-sm font-semibold text-Secondary hover:bg-Primary/8 hover:text-Primary transition-[]">
                    {cat === "All" ? t("mediaKnowledge.all") : cat}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}

function BlogHero({ item, t }: { item: any; t: any }) {
  return (
    <div className="relative lg:h-[55dvh] md:h-[45dvh] sm:h-[40dvh] h-72 overflow-hidden mb-10">
      <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-[linear-gradient(360deg,#2E0006_0%,rgba(46,0,6,0.20)_60%,rgba(46,0,6,0)_100%)]" />
      <Breadcrumb item={item} t={t} />
      <HeroContent item={item} t={t} />
    </div>
  );
}

function getFileExt(url: string): string {
  const match = url.match(/\.(\w+)(?:\?|$)/);
  return match ? match[1].toUpperCase() : "";
}

function MediaHero({ item, mediaFile, mediaFileType, t }: { item: any; mediaFile: string; mediaFileType: string; t: any }) {
  const ext = getFileExt(mediaFile);
  const isDoc = mediaFileType !== "video" && ext && !["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext.toLowerCase());

  return (
    <div className="relative lg:h-[55dvh] md:h-[45dvh] sm:h-[40dvh] h-72 overflow-hidden mb-10">
      {mediaFileType === "video" && mediaFile ? (
        <video
          src={mediaFile}
          className="absolute inset-0 w-full h-full object-contain bg-black"
          controls
          autoPlay
          muted
          playsInline
        />
      ) : isDoc ? (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary/80 to-[#2E0006] flex items-center justify-center">
          <span className="text-white/20 text-8xl font-bold">{ext}</span>
        </div>
      ) : (
        <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(360deg,#2E0006_0%,rgba(46,0,6,0.20)_60%,rgba(46,0,6,0)_100%)]" />
      <Breadcrumb item={item} t={t} />
      <HeroContent item={item} t={t} />
    </div>
  );
}

function Breadcrumb({ item, t }: { item: any; t: any }) {
  return (
    <div className="absolute top-0 inset-x-0 z-20 max-w-341.5 mx-auto md:px-7 px-4 xl:pt-8 lg:pt-6 pt-4">
      <nav className="flex items-center gap-2 text-sm font-Just font-bold text-white/80">
        <Link to="/" className="hover:text-white transition-[]">{t("home")}</Link>
        <ChevronRightIcon />
        <Link to="/media-knowledge" className="hover:text-white transition-[]">{t("mediaKnowledge.title")}</Link>
        <ChevronRightIcon />
        <span className="text-white line-clamp-1">{item.category}</span>
      </nav>
    </div>
  );
}

function HeroContent({ item, t }: { item: any; t: any }) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 max-w-341.5 mx-auto md:px-7 px-4 xl:pb-10 lg:pb-8 pb-5">
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="rounded-2xl bg-Primary text-white px-4 py-2 text-sm font-bold">{item.category}</span>
        {item.isVideo && (
          <span className="rounded-2xl bg-white/20 text-white px-4 py-2 text-sm font-bold flex items-center gap-2 backdrop-blur-md">
            <PlayIcon />
            {t("mediaKnowledge.video")}
          </span>
        )}
      </div>
      <h1 className="text-white xl:text-[48px]/[1.05] md:text-4xl/-tight text-2xl/-tight font-bold max-2xl:text-[58px]">{item.title}</h1>
    </div>
  );
}

function BlogBody({ item, relatedItems, t }: { item: any; relatedItems: any[]; t: any }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-4 pb-6 border-b border-Secondary/20 mb-8">
        <div className="flex items-center gap-2 text-Secondary/60">
          <CalendarIcon />
          <span className="text-sm font-semibold">{item.date}</span>
        </div>
        <span className="text-Secondary/30">|</span>
        <div className="flex items-center gap-2 text-Secondary/60">
          <ClockIcon />
          <span className="text-sm font-semibold">{item.readTime} {t("mediaKnowledge.minRead")}</span>
        </div>
        {item.author && (
          <>
            <span className="text-Secondary/30">|</span>
            <div className="flex items-center gap-2 text-Secondary/60">
              <UserIcon />
              <span className="text-sm font-semibold">{item.author}</span>
            </div>
          </>
        )}
      </div>

      <div
        className="article-content prose-custom text-Secondary/80"
        dangerouslySetInnerHTML={{ __html: item.content }}
      />

      <div className="mt-10 pt-6 border-t border-Secondary/20">
        <span className="text-sm font-bold text-Secondary/60 block mb-3">{t("mediaKnowledge.tags")}</span>
        <div className="flex flex-wrap gap-2">
          {item.tags.map((tag: any) => (
            <Link key={tag} to={`/media-knowledge?tag=${tag}`} className="rounded-full border border-Primary/20 text-Primary px-4 py-2 text-sm font-semibold hover:bg-Primary hover:text-white transition-[]">#{tag}</Link>
          ))}
        </div>
      </div>

      {relatedItems.length > 0 && (
        <RelatedSection items={relatedItems} t={t} />
      )}
    </>
  );
}

function MediaBody({ item, mediaFile, mediaFileType, t }: { item: any; mediaFile: string; mediaFileType: string; t: any }) {
  const ext = getFileExt(mediaFile).toLowerCase();
  const displayType = ext || mediaFileType;
  const isPptx = ["ppt", "pptx"].includes(ext);
  const isPdf = ext === "pdf";
  const isDocFile = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext);

  return (
    <>
      <div className="flex flex-wrap items-center gap-4 pb-6 border-b border-Secondary/20 mb-8">
        <div className="flex items-center gap-2 text-Secondary/60">
          <CalendarIcon />
          <span className="text-sm font-semibold">{item.date}</span>
        </div>
        <span className="text-Secondary/30">|</span>
        <div className="flex items-center gap-2 text-Secondary/60">
          <FileTypeIcon />
          <span className="text-sm font-semibold uppercase">{displayType}</span>
        </div>
      </div>

      <p className="text-Secondary/80 leading-relaxed mb-8">{item.description}</p>

      {mediaFileType === "video" && mediaFile && (
        <div className="mb-8">
          <video
            src={mediaFile}
            className="w-full rounded-xl bg-black"
            controls
            autoPlay
            muted
            playsInline
          />
        </div>
      )}

      {isPptx && mediaFile && (
        <>
          <div className="mb-4 aspect-video">
            <iframe
              src={`https://docs.google.com/gview?url=${encodeURIComponent(mediaFile)}&embedded=true`}
              className="w-full h-full rounded-xl"
              allowFullScreen
              title={item.title}
            />
          </div>
          <p className="text-sm text-secondary/50 mb-4">If the preview doesn't load, download the file below.</p>
          <div className="mb-8 p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-[#2E0006]/5 border border-primary/10 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <FileTypeIcon />
            </div>
            <div>
              <p className="font-bold text-secondary text-lg mb-1">{item.title}</p>
              <p className="text-sm text-secondary/60">{displayType.toUpperCase()} file</p>
            </div>
            <a
              href={mediaFile}
              download
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all"
            >
              <DownloadIcon />
              Download {displayType.toUpperCase()}
            </a>
          </div>
        </>
      )}

      {isPdf && mediaFile && (
        <>
          <div className="mb-4 aspect-video">
            <iframe
              src={mediaFile}
              className="w-full h-full rounded-xl"
              title={item.title}
            />
          </div>
          <a
            href={mediaFile}
            download
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all mb-8"
          >
            <DownloadIcon />
            Download PDF
          </a>
        </>
      )}

      {isDocFile && !isPptx && !isPdf && mediaFile && (
        <a
          href={mediaFile}
          download
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all mb-8"
        >
          <DownloadIcon />
          Download {displayType.toUpperCase()}
        </a>
      )}

      {!isDocFile && mediaFileType !== "video" && mediaFile && (
        <a
          href={mediaFile}
          download
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all mb-8"
        >
          <DownloadIcon />
          Download File
        </a>
      )}

      <div className="mt-10 pt-6 border-t border-Secondary/20">
        <span className="text-sm font-bold text-Secondary/60 block mb-3">{t("mediaKnowledge.tags")}</span>
        <div className="flex flex-wrap gap-2">
          {item.tags.map((tag: any) => (
            <Link key={tag} to={`/media-knowledge?tag=${tag}`} className="rounded-full border border-Primary/20 text-Primary px-4 py-2 text-sm font-semibold hover:bg-Primary hover:text-white transition-[]">#{tag}</Link>
          ))}
        </div>
      </div>
    </>
  );
}

function RelatedSection({ items, t }: { items: any[]; t: any }) {
  return (
    <div className="mt-12 pt-8 border-t border-Secondary/20">
      <h3 className="font-bold xl:text-2xl text-xl/-tight text-Secondary mb-6">{t("mediaKnowledge.related")}</h3>
      <div className="grid md:grid-cols-3 gap-5">
        {items.slice(0, 3).map((related) => (
          <Link key={related.id} to={`/media-knowledge/${related.id}?type=${related.type}`} className="group block rounded-2xl overflow-hidden border border-Secondary/10 hover:shadow-[0_12px_40px_rgba(10,34,64,0.12)] transition-[]">
            <div className="relative h-36 overflow-hidden">
              <img src={related.image} alt={related.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-[linear-gradient(360deg,#2E0006_0%,rgba(148,1,20,0)_100%)]" />
            </div>
            <div className="bg-white p-4">
              {related.category && <span className="text-xs font-bold text-Primary">{related.category}</span>}
              <h4 className="font-bold text-sm/-tight text-Secondary line-clamp-2 mt-1">{related.title}</h4>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function transformRelatedBlog(rb: any): any {
  return {
    id: String(rb.id),
    title: rb.title,
    description: rb.shortDescription || "",
    content: "",
    readTime: "",
    category: "",
    image: rb.media || "",
    isVideo: rb.mediaType === "video",
    date: rb.createdAt ? new Date(rb.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
    author: "",
    tags: [],
    type: "blog",
  };
}

function transformRelatedMedia(rm: any): any {
  return {
    id: String(rm.id),
    title: rm.title,
    description: rm.description || "",
    content: "",
    readTime: "",
    category: "",
    image: rm.file || "",
    isVideo: rm.fileType === "video",
    date: rm.createdAt ? new Date(rm.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
    author: "",
    tags: [],
    type: "media",
    fileType: rm.fileType,
  };
}

function ChevronRightIcon() {
  return (
    <svg className="w-4 h-4 rtl:rotate-180" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg className="w-4 h-4" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 2.5L12.5 8L4 13.5V2.5Z" fill="currentColor" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg className="w-4 h-4" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M11.5 2.5V4.5M4.5 2.5V4.5M2.5 6.5H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13.5 8.5C13.5 6.01 13.5 4.75 12.75 4.01C12 3.25 10.75 3.25 8 3.25C5.25 3.25 4 3.25 3.25 4.01C2.5 4.75 2.5 6.01 2.5 8.5C2.5 10.99 2.5 12.25 3.25 13.01C4 13.75 5.25 13.75 8 13.75C10.75 13.75 12 13.75 12.75 13.01C13.5 12.25 13.5 10.99 13.5 8.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg className="w-4 h-4" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 7.5V8L10.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2.5 8C2.5 4.96 2.5 3.44 3.72 2.47C4.94 1.5 6.46 1.5 9.5 1.5C12.54 1.5 14.06 1.5 15.03 2.47C15.5 2.94 15.5 3.44 15.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg className="w-4 h-4" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 14.5C2.5 11.46 4.94 9 8 9C11.06 9 13.5 11.46 13.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function FileTypeIcon() {
  return (
    <svg className="w-4 h-4" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 1.5H5.5C3.5 1.5 2.5 2.5 2.5 4.5V11.5C2.5 13.5 3.5 14.5 5.5 14.5H10.5C12.5 14.5 13.5 13.5 13.5 11.5V4.5C13.5 2.5 12.5 1.5 10.5 1.5H10Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 1.5V3.5C10 4.6 10.9 5.5 12 5.5H13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 8.5H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M5.5 11.5H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg className="w-5 h-5" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2.5V13.5M10 13.5L6 9.5M10 13.5L14 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.5 13.5V14.5C2.5 16.5 3.5 17.5 5.5 17.5H14.5C16.5 17.5 17.5 16.5 17.5 14.5V13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

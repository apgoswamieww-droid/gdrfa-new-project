import { useEffect, useState } from "react";
import { getPageBySlug } from "../api/page.api";
import { editorJsToHtml } from "../utils/editorJsToHtml";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const slugTitleMap: Record<string, string> = {
  "system-user-guide": "System User Guide",
  "privacy-policy": "Privacy Policy",
  "terms-conditions": "Terms & Conditions",
  "end-user-licence-agreement": "End User Licence Agreement",
};

const slugIcons: Record<string, string> = {
  "system-user-guide": "📖",
  "privacy-policy": "🛡️",
  "terms-conditions": "⚖️",
  "end-user-licence-agreement": "📄",
};

const floatingIcons = ["⚽", "🏃", "🚴", "🏊", "🏆", "⏱", "🥇", "🎯"];

export default function CmsPageWrapper({ slug }: { slug: string }) {
  const { t } = useTranslation();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await getPageBySlug(slug);
        if (!cancelled) setPage(res.data);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) return <LoadingState slug={slug} />;
  if (notFound || !page) return <NotFoundState />;

  const title = slugTitleMap[slug] || page.name;
  const icon = slugIcons[slug] || "📋";
  const htmlContent = editorJsToHtml(page.description);

  return (
    <section className="relative xl:pt-36 lg:pt-30 pt-24 xl:pb-24 lg:pb-16 pb-10 overflow-hidden bg-[linear-gradient(180deg,#FFF3F3_0%,#FFFFFF_48%,#F7FAFD_100%)] min-h-dvh">
      <div className="absolute inset-0 sports-detail-grid opacity-40" />
      <AnimatedSportsBackground />

      <div className="relative max-w-[860px] w-full mx-auto md:px-7 px-4">
        <nav className="flex items-center gap-2.5 text-sm font-bold text-secondary/50 mb-6">
          <Link to="/" className="hover:text-primary transition-colors duration-300 flex items-center gap-1.5">
            <HomeIcon />
            {t("home")}
          </Link>
          <ChevronRightIcon />
          <span className="text-primary">{title}</span>
        </nav>

        <div className="flex items-center gap-4 mb-8">
          <span className="text-4xl md:text-5xl">{icon}</span>
          <div>
            <span className="text-xs text-primary font-bold uppercase tracking-[0.2em] block mb-1">
              GDRFA SPORTS
            </span>
            <h1 className="xl:text-[40px]/tight md:text-3xl/tight text-2xl/tight font-bold text-secondary">
              {title}
            </h1>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-secondary/10 shadow-[0_20px_60px_rgba(10,34,64,0.08)] p-8 md:p-12">
          <div
            className="cms-content text-secondary/80 text-base leading-[1.8] [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-secondary [&_h1]:mt-12 [&_h1]:mb-4 [&_h1]:pb-3 [&_h1]:border-b [&_h1]:border-primary/10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-secondary [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-secondary/5 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-secondary [&_h3]:mt-8 [&_h3]:mb-2 [&_h4]:text-base [&_h4]:font-bold [&_h4]:text-secondary [&_h4]:mt-6 [&_h4]:mb-2 [&_p]:mb-5 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-5 [&_ul_li]:mb-2 [&_ul_li]:pl-1 [&_ul_li::marker]:text-primary [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-5 [&_ol_li]:mb-2 [&_ol_li]:pl-1 [&_ol_li::marker]:text-primary [&_hr]:border-secondary/10 [&_hr]:my-10 [&_blockquote]:border-s-4 [&_blockquote]:border-primary/30 [&_blockquote]:bg-primary/[0.03] [&_blockquote]:rounded-r-xl [&_blockquote]:px-6 [&_blockquote]:py-4 [&_blockquote]:my-6 [&_blockquote_p]:mb-0 [&_blockquote_cite]:text-sm [&_blockquote_cite]:text-secondary/50 [&_blockquote_cite]:mt-2 [&_blockquote_cite]:block [&_code]:bg-primary/5 [&_code]:text-primary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-sm [&_code]:font-mono [&_pre]:bg-secondary [&_pre]:text-white [&_pre]:rounded-2xl [&_pre]:p-6 [&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:text-white [&_pre_code]:p-0 [&_pre_code]:rounded-none [&_table]:w-full [&_table]:border-collapse [&_table]:my-6 [&_table]:rounded-2xl [&_table]:overflow-hidden [&_table]:border [&_table]:border-secondary/10 [&_th]:bg-primary/5 [&_th]:text-secondary [&_th]:font-bold [&_th]:text-sm [&_th]:p-4 [&_th]:text-start [&_th]:border-b [&_th]:border-secondary/10 [&_td]:p-4 [&_td]:border-b [&_td]:border-secondary/5 [&_td]:text-sm [&_tr:last-child_td]:border-b-0 [&_a]:text-primary [&_a]:underline [&_a]:decoration-primary/30 [&_a:hover]:decoration-primary [&_a]:transition-all [&_a]:duration-300"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-secondary/5">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-secondary/50 hover:text-primary transition-colors duration-300 group"
          >
            <span className="transform group-hover:-translate-x-1 transition-transform duration-300">
              <ArrowLeftIcon />
            </span>
            {t("backToHome") || "Back to Home"}
          </Link>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-2 text-sm font-bold text-secondary/50 hover:text-primary transition-colors duration-300 group"
          >
            {t("backToTop") || "Back to Top"}
            <span className="transform group-hover:-translate-y-1 transition-transform duration-300">
              <ArrowUpIcon />
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}

function AnimatedSportsBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {floatingIcons.map((icon, index) => (
        <span
          key={icon}
          className="sports-clip absolute text-primary/[0.06] font-bold select-none"
          style={{
            insetInlineStart: `${5 + (index * 13) % 85}%`,
            top: `${8 + (index * 17 + 5) % 75}%`,
            animationDelay: `${index * 500}ms`,
            animationDuration: `${7 + (index % 3) * 2}s`,
          }}
        >
          {icon}
        </span>
      ))}
    </div>
  );
}

function LoadingState({ slug: _slug }: { slug: string }) {
  return (
    <section className="relative xl:pt-36 lg:pt-30 pt-24 xl:pb-24 lg:pb-16 pb-10 overflow-hidden bg-[linear-gradient(180deg,#FFF3F3_0%,#FFFFFF_48%,#F7FAFD_100%)] min-h-dvh">
      <div className="absolute inset-0 sports-detail-grid opacity-40" />
      <AnimatedSportsBackground />
      <div className="relative max-w-[860px] w-full mx-auto md:px-7 px-4">
        <div className="h-5 bg-secondary/5 rounded-full w-48 animate-pulse mb-8" />
        <div className="h-10 bg-secondary/5 rounded-full w-72 mb-8 animate-pulse" />
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-secondary/10 p-8 md:p-12">
          <div className="space-y-4">
            <div className="h-4 bg-secondary/5 rounded-full w-full animate-pulse" />
            <div className="h-4 bg-secondary/5 rounded-full w-3/4 animate-pulse" />
            <div className="h-4 bg-secondary/5 rounded-full w-5/6 animate-pulse" />
            <div className="h-4 bg-secondary/5 rounded-full w-full animate-pulse" />
            <div className="h-4 bg-secondary/5 rounded-full w-2/3 animate-pulse" />
            <div className="pt-4">
              <div className="h-4 bg-secondary/5 rounded-full w-full animate-pulse" />
              <div className="h-4 bg-secondary/5 rounded-full w-4/5 animate-pulse mt-3" />
              <div className="h-4 bg-secondary/5 rounded-full w-3/5 animate-pulse mt-3" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function NotFoundState() {
  const { t } = useTranslation();
  return (
    <section className="relative xl:pt-36 lg:pt-30 pt-24 xl:pb-24 lg:pb-16 pb-10 overflow-hidden bg-[linear-gradient(180deg,#FFF3F3_0%,#FFFFFF_48%,#F7FAFD_100%)] min-h-dvh">
      <div className="absolute inset-0 sports-detail-grid opacity-40" />
      <AnimatedSportsBackground />
      <div className="relative max-w-[860px] w-full mx-auto md:px-7 px-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <span className="text-8xl mb-6">🏗️</span>
        <h1 className="xl:text-[40px]/tight md:text-3xl/tight text-2xl/tight font-bold text-secondary mb-4">
          {t("pageNotFound") || "Page Not Found"}
        </h1>
        <p className="text-secondary/60 text-base max-w-md mb-8">
          {t("pageNotFoundMessage") || "The page you're looking for doesn't exist or has been moved."}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-primary text-white font-bold px-8 py-3.5 rounded-xl hover:bg-primary/90 transition-all duration-300 text-sm"
        >
          <ArrowLeftIcon />
          {t("backToHome") || "Back to Home"}
        </Link>
      </div>
    </section>
  );
}

function HomeIcon() {
  return (
    <svg className="w-3.5 h-3.5" width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5.25 12.25V7H8.75V12.25M1.75 5.25L7 1.75L12.25 5.25V11.0833C12.25 11.3928 12.1271 11.6895 11.9083 11.9083C11.6895 12.1271 11.3928 12.25 11.0833 12.25H2.91667C2.60725 12.25 2.3105 12.1271 2.09171 11.9083C1.87292 11.6895 1.75 11.3928 1.75 11.0833V5.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="w-4 h-4 text-secondary/30 rtl:rotate-180" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg className="w-4 h-4" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M12 8H4M4 8L7.5 11.5M4 8L7.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg className="w-4 h-4" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 12V4M8 4L4 7.5M8 4L12 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

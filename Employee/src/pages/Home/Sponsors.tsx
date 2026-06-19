import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { getSponsors } from "../../api/page.api";

export default function Sponsors() {
  const { t } = useTranslation();
  const [sponsors, setSponsors] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        const res = await getSponsors();
        if (!cancelled && res.status) setSponsors(res.data);
      } catch (err: any) {
        if (!cancelled) setError(err.message || t("sponsors.failedToLoad"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="bg-[#F7FAFD] relative overflow-hidden min-h-screen">
      <AnimatedSponsorsBackground />

      <section className="relative xl:pt-36 lg:pt-30 pt-24 xl:pb-24 lg:pb-16 pb-10 z-10">
        <div className="max-w-341.5 mx-auto md:px-7 px-4">
          <div className="flex flex-col items-center text-center mb-16">
            <span className="inline-flex rounded-full bg-primary/10 text-primary px-4 py-2 text-sm font-bold mb-5">
              {t("sponsors.eyebrow")}
            </span>
            <h1 className="xl:text-6xl md:text-5xl text-4xl font-bold text-secondary max-w-240 leading-tight">
              {t("sponsors.title")}
            </h1>
            <p className="mt-6 text-secondary/60 md:text-lg font-medium max-w-180">
              {t("sponsors.subtitle")}
            </p>
          </div>

          {loading && (
            <div className="grid xl:grid-cols-4 lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white/70 rounded-[32px] h-44 flex items-center justify-center p-10 animate-pulse">
                  <div className="w-full h-12 bg-gray-200 rounded-lg" />
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-20">
              <span className="text-5xl">😕</span>
              <p className="mt-4 text-secondary/60 text-lg font-medium">{error}</p>
            </div>
          )}

          {!loading && !error && sponsors.length === 0 && (
            <div className="text-center py-20">
              <span className="text-5xl">🤝</span>
              <p className="mt-4 text-secondary/60 text-lg font-medium">{t("sponsors.noSponsors")}</p>
            </div>
          )}

          {!loading && !error && sponsors.length > 0 && (
            <div className="grid xl:grid-cols-4 lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-6">
              {sponsors.map((sponsor: any) => (
                <a
                  key={sponsor.id}
                  href={sponsor.website_url?.startsWith('http') ? sponsor.website_url : `https://${sponsor.website_url?.replace(/^https?:\/\//, '') || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white/70 backdrop-blur-sm border border-secondary/5 rounded-[32px] h-44 flex items-center justify-center p-10 transition-all duration-500 hover:bg-white hover:shadow-2xl hover:border-primary/20 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/[0.02] transition-colors" />
                  {sponsor.logo ? (
                    <img
                      src={sponsor.logo}
                      alt={sponsor.name}
                      className="max-w-full max-h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500 opacity-60 group-hover:opacity-100 transform group-hover:scale-110"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-secondary/30 group-hover:text-secondary/60 transition-colors">
                      {sponsor.name.charAt(0)}
                    </span>
                  )}
                  <div className="absolute inset-x-4 bottom-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                    <p className="text-xs font-bold text-primary text-center truncate">{sponsor.name}</p>
                    {sponsor.discount_text && (
                      <p className="text-[10px] text-secondary/50 text-center mt-0.5 truncate">{sponsor.discount_text}</p>
                    )}
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </div>
                </a>
              ))}
            </div>
          )}

          <div className="mt-24 bg-primary rounded-[40px] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl group">
            <div className="absolute inset-0 bg-[url('/assets/images/pattern.png')] opacity-10" />
            <div className="relative z-10">
              <h2 className="text-white text-3xl md:text-4xl font-bold mb-6">{t("sponsors.ctaTitle")}</h2>
              <p className="text-white/80 text-base md:text-lg mb-10 max-w-140 mx-auto">
                {t("sponsors.ctaSubtitle")}
              </p>
              <Link
                to="/contact-us"
                className="bg-white text-primary px-10 py-4 rounded-2xl font-bold text-lg hover:bg-secondary hover:text-white transition-all transform hover:scale-105 cursor-pointer shadow-xl inline-block"
              >
                {t("sponsors.becomeSponsor")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function AnimatedSponsorsBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {["🤝", "💎", "🌟", "🌍", "🏆", "✨"].map((icon, index) => (
        <span
          key={icon}
          className="sports-clip absolute text-primary/10 font-bold select-none"
          style={{
            insetInlineStart: `${10 + index * 15}%`,
            top: `${15 + (index % 3) * 25}%`,
            animationDelay: `${index * 900}ms`,
            animationDuration: `${10 + index}s`
          }}
        >
          {icon}
        </span>
      ))}
    </div>
  );
}

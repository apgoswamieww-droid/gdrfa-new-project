import { useEffect, useState } from "react";
import { getFaqs } from "../api/page.api";
import { useTranslation } from "react-i18next";

export default function Faq() {
  const { t } = useTranslation();
  const [faqs, setFaqs] = useState<any>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        const res = await getFaqs();
        if (!cancelled) setFaqs(res.data);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="relative xl:pt-36 lg:pt-30 pt-24 xl:pb-24 lg:pb-16 pb-10 overflow-hidden bg-[linear-gradient(180deg,#FFF3F3_0%,#FFFFFF_48%,#F7FAFD_100%)]">
      <div className="max-w-341.5 w-full mx-auto md:px-7 px-4">
        <div className="max-w-200 mx-auto">
          <span className="inline-flex rounded-full bg-primary/10 text-primary px-4 py-2 text-sm font-bold mb-4">
            {t("faq.eyebrow")}
          </span>
          <h1 className="xl:text-[52px]/[0.98] md:text-4xl/tight text-3xl/tight font-bold text-secondary mb-10">
            {t("faqs")}
          </h1>

          {loading ? (
            <div className="text-center py-20 text-secondary/60">{t("faq.loading")}</div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-20 text-secondary/60">{t("faq.noFaqs")}</div>
          ) : (
            <div className="space-y-3">
              {faqs.map((faq: any) => {
                const isOpen = openId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="rounded-2xl border border-secondary/10 bg-white overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setOpenId(isOpen ? null : faq.id)}
                      className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer"
                    >
                      <span className="font-bold text-secondary text-sm md:text-base">{faq.question}</span>
                      <svg
                        className={`w-5 h-5 text-secondary/40 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        width="20" height="20" viewBox="0 0 20 20" fill="none"
                      >
                        <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 text-sm text-secondary/70 leading-relaxed">{faq.answer}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

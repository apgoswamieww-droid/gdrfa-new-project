import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";
import { getCertificates, downloadCertificateImage } from "../../api/page.api";
import { useAuthStore } from "../../store/store";
import { CertificateImg } from "../../assets/images/images";
import Toast from "../../components/ui/Toast";

type CertDisplay = {
  id: number;
  title: string;
  eventName: string;
  issueDate: string;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtDate(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function Certificates() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const isLoggedIn = Boolean(token);

  const [certs, setCerts] = useState<CertDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewCert, setPreviewCert] = useState<CertDisplay | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        const res = await getCertificates();
        if (cancelled) return;
        if (res.status) {
          setCerts(
            (res.data || []).map((c: any) => ({
              id: c.id,
              title: c.activity_title || "Certificate",
              eventName: c.event_title || "",
              issueDate: c.createdAt ? fmtDate(new Date(c.createdAt)) : "-",
            }))
          );
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || t("evaluationCertificates.failedToLoad"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, [t]);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="bg-[#F7FAFD] relative overflow-hidden min-h-screen">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <section className="relative xl:pt-36 lg:pt-30 pt-24 xl:pb-24 lg:pb-16 pb-10 z-10">
        <div className="max-w-341.5 mx-auto md:px-7 px-4">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-2 text-secondary/60 hover:text-primary transition-colors text-sm font-bold cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>

          <div className="flex lg:flex-row flex-col lg:items-end justify-between gap-5 mb-12">
            <div className="max-w-170 text-start">
              <span className="inline-flex rounded-full bg-primary/10 text-primary px-4 py-2 text-sm font-bold">
                {t("evaluationCertificates.title")}
              </span>
              <h1 className="mt-5 xl:text-5xl md:text-4xl text-3xl font-bold text-secondary">
                {t("achievementsPage.myCertificates")}
              </h1>
            </div>
            <p className="text-secondary/60 md:text-base font-medium lg:max-w-105 text-start">
              {t("evaluationCertificates.subtitle")}
            </p>
          </div>

          {loading && (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white/90 rounded-[32px] p-6 shadow-sm border border-secondary/5 animate-pulse">
                  <div className="flex gap-5 items-center">
                    <div className="min-w-20 w-20 h-20 rounded-2xl bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-2.5 bg-gray-100 rounded w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="bg-white/90 backdrop-blur-sm rounded-[32px] p-12 shadow-sm border border-secondary/5 text-center">
              <p className="text-secondary/60 font-medium">{error}</p>
            </div>
          )}

          {!loading && !error && certs.length === 0 && (
            <div className="bg-white/90 backdrop-blur-sm rounded-[32px] p-12 shadow-sm border border-secondary/5 text-center">
              <span className="block text-5xl mb-4">📜</span>
              <p className="text-secondary/60 font-medium">{t("achievementsPage.noCertificates")}</p>
            </div>
          )}

          {!loading && certs.length > 0 && (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {certs.map((cert) => (
                <button
                  key={cert.id}
                  onClick={() => setPreviewCert(cert)}
                  className="bg-white/90 backdrop-blur-sm rounded-[32px] p-6 shadow-sm border border-secondary/5 flex gap-5 items-center text-start transition-all hover:bg-white hover:shadow-md group w-full cursor-pointer"
                >
                  <div className="min-w-20 w-20 h-20 rounded-2xl overflow-hidden border border-secondary/10 bg-secondary/5 relative">
                    <img src={CertificateImg} alt="cert" className="w-full h-full object-cover p-2" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-secondary font-bold text-lg leading-tight mb-1 truncate group-hover:text-primary transition-colors">{cert.title}</h4>
                    <p className="text-secondary/50 text-sm font-medium mb-1 truncate">{cert.eventName}</p>
                    <p className="text-[11px] text-secondary/40 font-medium">{cert.issueDate}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {previewCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setPreviewCert(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-secondary/5 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <img src={CertificateImg} alt={previewCert.title} className="w-full h-auto" />
              <button onClick={() => setPreviewCert(null)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center text-secondary hover:text-primary transition-colors cursor-pointer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="p-4 text-start">
              <h3 className="text-secondary font-bold text-base mb-1 truncate">{previewCert.title}</h3>
              <p className="text-secondary/50 text-xs font-medium mb-1 truncate">{previewCert.eventName}</p>
              <p className="text-[11px] text-secondary/40 font-medium mb-4">{previewCert.issueDate}</p>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    try {
                      await downloadCertificateImage(previewCert.id);
                    } catch {
                      setToast({ message: "Download failed", type: "error" });
                    }
                  }}
                  className="flex-1 rounded-xl bg-primary text-white px-4 py-2.5 text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

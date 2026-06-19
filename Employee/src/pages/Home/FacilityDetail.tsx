import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams, useNavigate, Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/store";
import { getFacilities, createFacilityRequest, getBookedTimes } from "../../api/page.api";
import { slugify } from "../../utils/slug";
import { ArrowIcon } from "../SportsEvents/SportsEventList";
import Toast from "../../components/ui/Toast";

const timeSlots = [
  "12:00 AM", "01:00 AM", "02:00 AM", "03:00 AM", "04:00 AM", "05:00 AM",
  "06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM",
  "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM", "11:00 PM"
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = Partial<Record<"fullName" | "email" | "description" | "slot", string>>;

export default function FacilityDetail() {
  const { t, i18n } = useTranslation();
  const { facilityId } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [facilities, setFacilities] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    description: ""
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [bookedSlots, setBookedSlots] = useState<{ date: string; time_slot: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(false);
        const resp = await getFacilities();
        if (!cancelled) setFacilities(resp.data || []);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const facility = facilities.find(
    (f: any) => slugify(f.title) === facilityId
  );

  useEffect(() => {
    if (!facility) return;
    let cancelled = false;
    const fetchBooked = async () => {
      try {
        const resp = await getBookedTimes(facility.id);
        if (!cancelled) {
          const slots = (resp.data || []).map((b: any) => ({
            date: b.date.split('T')[0],
            time_slot: b.time_slot || ""
          }));
          setBookedSlots(slots);
        }
      } catch {
        if (!cancelled) setBookedSlots([]);
      }
    };
    fetchBooked();
    return () => { cancelled = true; };
  }, [facility?.id]);

  const isSlotBooked = (date: string, slot: string) =>
    bookedSlots.some(b => b.date === date && b.time_slot === slot);

  const facilityTitle = facility
    ? (i18n.language === 'ar' ? (facility.title_ar || facility.title) : facility.title)
    : '';

  const location = facility
    ? facility.title.split('–').pop()?.trim()?.split(',')[0] || 'GDRFA'
    : '';

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!formData.fullName.trim()) next.fullName = t("facilities.fullNameRequired");
    if (!formData.email.trim()) {
      next.email = t("facilities.emailRequired");
    } else if (!EMAIL_REGEX.test(formData.email)) {
      next.email = t("facilities.invalidEmail");
    }
    if (!formData.description.trim()) next.description = t("facilities.descriptionRequired");
    if (!selectedSlot) next.slot = t("facilities.selectSlot");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  if (loading) {
    return (
      <div className="bg-[#F7FAFD] min-h-screen flex items-center justify-center">
        <div className="animate-pulse space-y-6 w-full max-w-341.5 mx-auto md:px-7 px-4">
          <div className="h-96 bg-gray-200 rounded-[40px]" />
          <div className="h-48 bg-gray-200 rounded-[32px]" />
        </div>
      </div>
    );
  }

  if (!facility || error) {
    return <Navigate to="/facilities" replace />;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FieldErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const payload: any = {
        facility_id: facility.id,
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        date: selectedDate,
        time_slot: selectedSlot || undefined,
        description: formData.description.trim(),
      };

      const response = await createFacilityRequest(payload);

      if (response.status) {
        navigate("/facilities", {
          state: { toast: { message: t("facilities.requestSent"), type: "success" as const } },
        });
      } else {
        setToast({ message: response.message || t("facilities.failedToSubmit"), type: "error" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("facilities.somethingWentWrong");
      setToast({ message: msg, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F7FAFD] relative overflow-hidden min-h-screen">
      <AnimatedFacilitiesBackground />

      <section className="relative xl:pt-36 lg:pt-30 pt-24 xl:pb-24 lg:pb-10 pb-10 z-10">
        <div className="max-w-341.5 mx-auto md:px-7 px-4">
          <Link to="/facilities" className="inline-flex items-center gap-2 text-primary text-sm font-bold mb-8 hover:text-secondary transition-colors group">
            <span className="rtl:-scale-x-100 rotate-180"><ArrowIcon /></span>
            {t("facilities.backToFacilities")}
          </Link>

          <div className="grid lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-7 space-y-10">
              <div className="relative h-[450px] rounded-[40px] overflow-hidden shadow-2xl border border-secondary/5 group">
                <img src={facility.image ?? undefined} alt={facilityTitle} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,34,64,0)_0%,rgba(10,34,64,0.6)_100%)]" />
                <div className="absolute bottom-10 left-10 right-10 text-start">
                  <h1 className="text-white text-3xl md:text-4xl font-bold leading-tight">
                    {facilityTitle}
                  </h1>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-[32px] p-8 md:p-10 shadow-sm border border-secondary/5 text-start">
                <h2 className="text-secondary font-bold text-2xl mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-lg">📝</span>
                  {t("facilities.facilityOverview")}
                </h2>
                <p className="text-secondary/60 text-base md:text-lg leading-relaxed font-medium mb-8">
                  {i18n.language === 'ar' ? (facility.description_ar || facility.description) : facility.description}
                </p>

                <div className="grid sm:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-secondary font-bold text-sm uppercase tracking-wider mb-4 opacity-40">{t("facilities.location")}</h3>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">📍</div>
                      <p className="text-secondary font-bold text-base">{location}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-8">
              <div className="bg-white/95 backdrop-blur-md rounded-[40px] p-8 md:p-10 shadow-xl border border-secondary/5 sticky top-24 text-start">
                <h3 className="text-secondary font-bold text-2xl mb-8 border-b border-secondary/5 pb-6">
                  {t("facilities.bookThisFacility")}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-6">

                  <div>
                    <label className="block text-[10px] text-secondary/40 font-bold uppercase tracking-wider mb-2 ml-1">{t("facilities.selectDate")}</label>
                    <input
                      type="date"
                      value={selectedDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedSlot(null);
                      }}
                      className="w-full bg-secondary/5 border border-secondary/10 rounded-2xl px-5 py-4 text-secondary font-bold focus:outline-none focus:border-primary transition-colors appearance-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-secondary/40 font-bold uppercase tracking-wider mb-3 ml-1">{t("facilities.availableSlots")}</label>
                    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                      {timeSlots.map(slot => {
                        const slotTaken = isSlotBooked(selectedDate, slot);
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={slotTaken}
                            onClick={() => {
                              setSelectedSlot(slot);
                              if (errors.slot) setErrors(prev => ({ ...prev, slot: undefined }));
                            }}
                            className={`py-2.5 rounded-xl text-[10px] font-bold transition-all border ${slotTaken
                              ? "bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed"
                              : selectedSlot === slot
                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                : "bg-white text-secondary/60 border-secondary/5 hover:border-primary/30 hover:text-primary"
                              }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                    {errors.slot && (
                      <span className="mt-2 block text-sm font-semibold text-primary">{errors.slot}</span>
                    )}
                  </div>

                  <div className="space-y-4 pt-4 border-t border-secondary/5">
                    <div>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder={t("facilities.fullName")}
                        className={`w-full bg-secondary/5 border rounded-2xl px-5 py-4 text-secondary font-bold placeholder:text-secondary/30 focus:outline-none transition-colors ${errors.fullName ? "border-primary" : "border-secondary/10 focus:border-primary"
                          }`}
                      />
                      {errors.fullName && (
                        <span className="mt-2 block text-sm font-semibold text-primary">{errors.fullName}</span>
                      )}
                    </div>
                    <div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder={t("facilities.emailId")}
                        className={`w-full bg-secondary/5 border rounded-2xl px-5 py-4 text-secondary font-bold placeholder:text-secondary/30 focus:outline-none transition-colors ${errors.email ? "border-primary" : "border-secondary/10 focus:border-primary"
                          }`}
                      />
                      {errors.email && (
                        <span className="mt-2 block text-sm font-semibold text-primary">{errors.email}</span>
                      )}
                    </div>
                    <div>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder={t("facilities.bookingPurpose")}
                        rows={3}
                        className={`w-full bg-secondary/5 border rounded-2xl px-5 py-4 text-secondary font-bold placeholder:text-secondary/30 focus:outline-none transition-colors resize-none ${errors.description ? "border-primary" : "border-secondary/10 focus:border-primary"
                          }`}
                      />
                      {errors.description && (
                        <span className="mt-2 block text-sm font-semibold text-primary">{errors.description}</span>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary text-white py-4 px-8 rounded-2xl font-bold text-base hover:bg-secondary transition-all transform hover:scale-[1.02] cursor-pointer shadow-xl shadow-primary/20 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        {t("facilities.submitting")}
                      </>
                    ) : (
                      t("facilities.sendRequest")
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

function AnimatedFacilitiesBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {["🏢", "🏟️", "🏗️", "📐", "📍", "🔑"].map((icon, index) => (
        <span
          key={icon}
          className="sports-clip absolute text-primary/10 font-bold select-none"
          style={{
            insetInlineStart: `${5 + index * 17}%`,
            top: `${12 + (index % 4) * 23}%`,
            animationDelay: `${index * 800}ms`,
            animationDuration: `${9 + index}s`
          }}
        >
          {icon}
        </span>
      ))}
    </div>
  );
}

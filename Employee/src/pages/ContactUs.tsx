import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { submitContact } from "../api/page.api";
import { useTranslation } from "react-i18next";

type ContactForm = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

type ContactErrors = Partial<Record<keyof ContactForm, string>>;

const initialForm: ContactForm = {
  name: "",
  email: "",
  phone: "",
  message: "",
};

const suspiciousPattern =
  /(<\s*script|<\/|<[^>]+>|javascript\s*:|data\s*:|vbscript\s*:|on\w+\s*=|&#|%3c|%3e|union\s+select|drop\s+table|insert\s+into|delete\s+from)/i;

const fieldLimits: Record<keyof ContactForm, number> = {
  name: 80,
  email: 120,
  phone: 12,
  message: 800,
};

function cleanInput(value: string, field: keyof ContactForm) {
  const normalized = value.replace(/\s+/g, " ").trimStart();
  return normalized.slice(0, fieldLimits[field]);
}

function sanitizeForSubmit(value: string) {
  return value
    .trim()
    .replace(/[<>"'`]/g, "")
    .replace(/\s+/g, " ");
}

export default function ContactUs() {
  const { t } = useTranslation();
  const [form, setForm] = useState<ContactForm>(initialForm);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  const charactersLeft = useMemo(() => fieldLimits.message - form.message.length, [form.message]);

  const validateForm = (form: ContactForm) => {
    const errors: ContactErrors = {};
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const message = form.message.trim();

    if (!name) {
      errors.name = t("contactUs.validation.nameRequired");
    } else if (!/^[A-Za-z][A-Za-z .'-]{1,78}$/.test(name)) {
      errors.name = t("contactUs.validation.nameLetters");
    } else if (suspiciousPattern.test(name)) {
      errors.name = t("contactUs.validation.nameInvalid");
    }

    if (!email) {
      errors.email = t("contactUs.validation.emailRequired");
    } else if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(email)) {
      errors.email = t("contactUs.validation.emailInvalid");
    } else if (suspiciousPattern.test(email)) {
      errors.email = t("contactUs.validation.emailInvalid");
    }

    if (!phone) {
      errors.phone = t("contactUs.validation.phoneRequired");
    } else if (!/^\+?[0-9][0-9\s()-]{7,10}$/.test(phone) || phone.length > fieldLimits.phone) {
      errors.phone = t("contactUs.validation.phoneInvalid");
    } else if (suspiciousPattern.test(phone)) {
      errors.phone = t("contactUs.validation.phoneInvalid");
    }

    if (!message) {
      errors.message = t("contactUs.validation.messageRequired");
    } else if (message.length < 10) {
      errors.message = t("contactUs.validation.messageLength");
    } else if (suspiciousPattern.test(message)) {
      errors.message = t("contactUs.validation.messageUnsafe");
    }

    return errors;
  };

  const handleChange = (field: keyof ContactForm, value: string) => {
    const nextValue = cleanInput(value, field);

    setForm((current) => ({
      ...current,
      [field]: nextValue,
    }));

    if (errors[field]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    setSubmitted(false);
    setApiError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload = {
      name: sanitizeForSubmit(form.name),
      email: sanitizeForSubmit(form.email),
      phone: sanitizeForSubmit(form.phone),
      message: sanitizeForSubmit(form.message),
    };

    setSubmitting(true);
    try {
      await submitContact(payload);
      setForm(initialForm);
      setSubmitted(true);
    } catch (err: any) {
      setApiError(err.message || t("contactUs.validation.messageUnsafe"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="relative xl:pt-32 lg:pt-28 pt-24 xl:pb-18 lg:pb-14 pb-10 overflow-hidden bg-[linear-gradient(180deg,#FFF3F3_0%,#FFFFFF_48%,#F7FAFD_100%)]">
      <div className="absolute top-24 -inset-s-20 w-90 h-90 rounded-full bg-primary/8 blur-3xl" />
      <div className="absolute bottom-24 -inset-e-20 w-96 h-96 rounded-full bg-secondary/8 blur-3xl" />

      <div className="relative max-w-[1180px] w-full mx-auto md:px-7 px-4">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-5 items-stretch">
          <div className="bg-primary text-white xl:rounded-[32px] rounded-3xl xl:p-6 md:p-5 p-4 shadow-[0_20px_60px_rgba(122,37,48,0.18)]">
            <span className="inline-flex rounded-full bg-white/12 border border-white/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest">
              {t("contactUs.eyebrow")}
            </span>
            <h1 className="mt-4 xl:text-4xl/tight md:text-3xl/tight text-2xl/tight font-bold">
              {t("contactUs.heroTitle")}
            </h1>
            <p className="mt-3 text-white/72 text-sm/tight font-medium max-w-120">
              {t("contactUs.heroSubtitle")}
            </p>

            <div className="mt-6 overflow-hidden rounded-3xl border border-white/15 bg-white/10">
              <iframe
                title="GDRFA Dubai map"
                src="https://www.google.com/maps?q=GDRFA%20Dubai&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-58 w-full border-0"
              />
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="bg-white/90 border border-white xl:rounded-[32px] rounded-3xl xl:p-6 md:p-5 p-4 backdrop-blur-xl shadow-[0_20px_60px_rgba(10,34,64,0.10)]"
          >
            <div className="flex sm:flex-row flex-col sm:items-end justify-between gap-4 mb-5">
              <div className="text-start">
                <h2 className="text-secondary font-bold xl:text-2xl/tight text-xl/tight">{t("contactUs.title")}</h2>
                <p className="mt-1 text-secondary/55 text-sm font-medium">{t("contactUs.subtitle")}</p>
              </div>
              {submitted && !submitting && (
                <span className="rounded-full bg-green-500/10 text-green-700 px-4 py-2 text-xs font-bold">
                  {t("contactUs.success")}
                </span>
              )}
              {apiError && (
                <span className="rounded-full bg-red-500/10 text-red-700 px-4 py-2 text-xs font-bold">
                  {apiError}
                </span>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <ContactField
                label={t("contactUs.name")}
                value={form.name}
                error={errors.name}
                placeholder={t("contactUs.namePlaceholder")}
                autoComplete="name"
                onChange={(value) => handleChange("name", value)}
              />
              <ContactField
                label={t("contactUs.email")}
                type="email"
                value={form.email}
                error={errors.email}
                placeholder={t("contactUs.emailPlaceholder")}
                autoComplete="email"
                onChange={(value) => handleChange("email", value)}
              />
              <ContactField
                label={t("contactUs.phone")}
                type="tel"
                value={form.phone}
                error={errors.phone}
                placeholder={t("contactUs.phonePlaceholder")}
                autoComplete="tel"
                maxLength={fieldLimits.phone}
                onChange={(value) => handleChange("phone", value)}
              />
             
            </div>

            <label className="mt-4 block text-start">
              <span className="mb-2 block text-secondary text-sm font-bold">{t("contactUs.message")}</span>
              <textarea
                value={form.message}
                onChange={(event) => handleChange("message", event.target.value)}
                placeholder={t("contactUs.messagePlaceholder")}
                rows={5}
                maxLength={fieldLimits.message}
                className={`w-full resize-none rounded-2xl border bg-white px-4 py-3 text-secondary text-sm font-semibold outline-none transition-all placeholder:text-secondary/35 focus:border-primary focus:ring-4 focus:ring-primary/10 ${
                  errors.message ? "border-primary" : "border-secondary/10"
                }`}
              />
            </label>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-primary text-xs font-bold">{errors.message || ""}</span>
              <span className="text-secondary/45 text-xs font-bold">{charactersLeft} {t("contactUs.charsLeft")}</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 rounded-full bg-primary text-white hover:bg-secondary px-6 py-3 text-sm font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_14px_34px_rgba(122,37,48,0.18)]"
            >
              {submitting ? t("contactUs.submitting") : t("contactUs.submit")}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function ContactField({
  label,
  value,
  error,
  placeholder,
  autoComplete,
  maxLength,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  placeholder: string;
  autoComplete: string;
  maxLength?: number;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-start">
      <span className="mb-2 block text-secondary text-sm font-bold">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        className={`w-full rounded-2xl border bg-white px-4 py-3 text-secondary text-sm font-semibold outline-none transition-all placeholder:text-secondary/35 focus:border-primary focus:ring-4 focus:ring-primary/10 ${
          error ? "border-primary" : "border-secondary/10"
        }`}
      />
      <span className="mt-2 block min-h-4 text-primary text-xs font-bold">{error || ""}</span>
    </label>
  );
}

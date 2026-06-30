import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import PrimaryBtn from "../../component/Button/PrimaryButton";
import EventForm from "./EventForm";
import { createEventApi, createEventWithImageApi } from "../../api/events.api";
import { useTranslation } from "../../hooks/useTranslation";
import toast from "react-hot-toast";

const CreateEvent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any, imageFile?: File | null) => {
    setIsSubmitting(true);
    const loadingToast = toast.loading(t.events?.creating || "Creating event...");
    try {
      if (imageFile) {
        const formData = new FormData();
        (Object.entries(data) as [string, unknown][]).forEach(([key, value]) => {
          if (value !== undefined && value !== null && key !== "image") {
            formData.append(key, String(value));
          }
        });
        formData.append("image", imageFile);
        await createEventWithImageApi(formData);
      } else {
        await createEventApi(data);
      }
      toast.success(t.events?.successCreate || "Event created successfully!", { id: loadingToast });
      navigate("/events");
    } catch (error: any) {
      toast.error(error.message || "Something went wrong", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/events" className="flex items-center gap-1.5 text-secondary/60 hover:text-secondary transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="font-semibold text-sm">{t.events?.manage || "Back to Events"}</span>
        </Link>
      </div>

      <div className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-secondary">{t.events?.createEventTitle || "Create New Event"}</h2>
        </div>

        <EventForm onSubmit={handleSubmit} />

        <div className="flex gap-3 pt-4 border-t mt-4">
          <Link
            to="/events"
            className="flex lg:gap-1.5 gap-1 justify-center items-center font-bold 2xl:text-[0.84vw]/normal lg:text-base/normal text-sm/normal rounded-lg lg:px-4 px-2.5 border border-gray-200 lg:py-1.5 py-1.5 text-gray-600 hover:bg-gray-50 transition ease-in-out duration-300 cursor-pointer flex-1"
          >
            {t.events?.cancel || "Cancel"}
          </Link>
          <PrimaryBtn type="submit" form="event-form" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? (t.events?.saving || "Saving...") : (t.events?.save || "Save")}
          </PrimaryBtn>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;

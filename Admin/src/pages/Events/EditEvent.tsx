import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import PrimaryBtn from "../../component/Button/PrimaryButton";
import EventForm from "./EventForm";
import { getEventByIdApi, updateEventApi, updateEventWithImageApi } from "../../api/events.api";
import { useTranslation } from "../../hooks/useTranslation";
import toast from "react-hot-toast";

const EditEvent = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [eventData, setEventData] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchEvent = async () => {
      try {
        const res = await getEventByIdApi(Number(id));
        if (res.status && res.data) {
          setEventData(res.data);
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to load event");
        navigate("/events");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, navigate]);

  const handleSubmit = async (data: any, imageFile?: File | null) => {
    if (!id) return;
    setIsSubmitting(true);
    const loadingToast = toast.loading(t.events?.updating || "Updating event...");
    try {
      if (imageFile) {
        const formData = new FormData();
        (Object.entries(data) as [string, unknown][]).forEach(([key, value]) => {
          if (value !== undefined && value !== null && key !== "image") {
            formData.append(key, String(value));
          }
        });
        formData.append("image", imageFile);
        await updateEventWithImageApi(Number(id), formData);
      } else {
        await updateEventApi(Number(id), data);
      }
      toast.success(t.events?.successUpdate || "Event updated successfully!", { id: loadingToast });
      navigate("/events");
    } catch (error: any) {
      toast.error(error.message || "Something went wrong", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        <p className="mt-4 text-secondary/60 font-medium">{t.events?.loading || "Loading event..."}</p>
      </div>
    );
  }

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
          <h2 className="text-xl font-bold text-secondary">{t.events?.editEvent || "Edit Event"}</h2>
        </div>

        <EventForm
          initialData={eventData}
          onSubmit={handleSubmit}
        />

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

export default EditEvent;

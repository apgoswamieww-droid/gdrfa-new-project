import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getContactApi } from "../../api/contact.api";
import { formatDate } from "../../utils/dateUtils";
import toast from "react-hot-toast";

const ViewContact = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchContact = async () => {
      try {
        const response = await getContactApi(Number(id));
        if (response.status && response.data) {
          setContact(response.data);
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to load contact");
        navigate("/cms/contacts");
      } finally {
        setLoading(false);
      }
    };
    fetchContact();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        <p className="mt-4 text-secondary/60 font-medium">Loading...</p>
      </div>
    );
  }

  if (!contact) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/cms/contacts" className="flex items-center gap-1.5 text-secondary/60 hover:text-secondary transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="font-semibold text-sm">Back to Contacts</span>
        </Link>
      </div>

      <div className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-secondary">any Details</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full font-medium">
            ID: {contact.id}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-secondary/50 mb-1">Name</label>
            <p className="text-secondary font-medium">{contact.name}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-secondary/50 mb-1">Email</label>
            <p className="text-secondary font-medium">
              <a href={`mailto:${contact.email}`} className="hover:text-[#364B9B] transition-colors">{contact.email}</a>
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-secondary/50 mb-1">Phone</label>
            <p className="text-secondary font-medium">
              <a href={`tel:${contact.phone}`} className="hover:text-[#364B9B] transition-colors">{contact.phone || "-"}</a>
            </p>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-xs font-semibold text-secondary/50 mb-1">Message</label>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{contact.message}</p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm text-gray-500">
          <div>
            <span className="font-semibold">Received At:</span> {formatDate(contact.createdAt)}
          </div>
          <div>
            <span className="font-semibold">Updated At:</span> {formatDate(contact.updatedAt)}
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
          <Link
            to="/cms/contacts"
            className="flex items-center justify-center font-bold text-sm rounded-lg px-4 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Back to List
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ViewContact;

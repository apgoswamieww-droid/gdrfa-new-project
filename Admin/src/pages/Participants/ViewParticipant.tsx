import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getParticipantByIdApi } from "../../api/participants.api";
import { getApprovalHistoryApi } from "../../api/approvalHistory.api";
import type { Participant } from "../../api/participants.api";
import { formatDate } from "../../utils/dateUtils";
import toast from "react-hot-toast";

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || "https://localhost:3000/";

const getImageUrl = (path?: string) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${IMAGE_BASE_URL}${path.startsWith("/") ? path.slice(1) : path}`;
};

interface ApprovalHistoryItem {
  id: number;
  participate_id: number;
  approval_level: string;
  approver_id: string | null;
  approver_name: string | null;
  status: string;
  assigned_date: string;
  action_date: string | null;
  comment: string | null;
}

const levelLabel: Record<string, string> = {
  section: "Section Manager",
  department: "Department Manager",
  admin: "Admin",
};

const StatusBadge = ({ status, currentApprovalLevel, workflowStatus }: { status: string; currentApprovalLevel?: string | null; workflowStatus?: string | null }) => {
  const levelSuffix = currentApprovalLevel ? ` (${levelLabel[currentApprovalLevel] || currentApprovalLevel})` : "";
  if (workflowStatus === "fully_approved" || status === "1")
    return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Approved</span>;
  if (workflowStatus === "rejected" || status === "2")
    return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-700"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Rejected</span>;
  return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />Pending{levelSuffix}</span>;
};

const EventStatusBadge = ({ status }: { status?: string }) => {
  if (status === "1")
    return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Approved</span>;
  return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-700"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Rejected</span>;
};

const EventActiveBadge = ({ status }: { status?: string }) => {
  if (status === "1")
    return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" />In Progress</span>;
  return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Completed</span>;
};

const DetailRow = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
  <div>
    <p className="text-xs font-semibold text-secondary/50 mb-0.5 uppercase tracking-wider">{label}</p>
    <p className="text-secondary font-medium">{value ?? "N/A"}</p>
  </div>
);

const SectionCard = ({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon?: React.ReactNode; children: React.ReactNode }) => (
  <div className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100">
    {(title || icon) && (
      <div className="flex items-center gap-2 mb-4">
        {icon && <div className="rounded-lg bg-primary/10 p-2">{icon}</div>}
        <div>
          <h3 className="text-base font-bold text-secondary">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>
    )}
    {children}
  </div>
);

const ViewParticipant = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const res = await getParticipantByIdApi(Number(id));
        if (res.status && res.data) {
          setParticipant(res.data);
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to load participant details");
        navigate("/participant-requests");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  useEffect(() => {
    if (!id || !participant) return;
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const res = await getApprovalHistoryApi({ participate_id: Number(id) });
        if (res.status && res.data?.data) {
          setApprovalHistory(res.data.data);
        }
      } catch {
        // silently fail
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [id, participant]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        <p className="mt-4 text-secondary/60 font-medium">Loading...</p>
      </div>
    );
  }

  if (!participant) return null;

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/participant-requests" className="flex items-center gap-1.5 text-secondary/60 hover:text-secondary transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="font-semibold text-sm">Back to Participants</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── LEFT COLUMN: Participant Details ── */}
        <div className="space-y-6">
          <SectionCard
            title="Participant Details"
            subtitle="Personal & organizational information"
            icon={
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          >
            <div className="text-center mb-5">
              {participant.user.image ? (
                <img
                  src={getImageUrl(participant.user.image)!}
                  alt={participant.user.name}
                  className="w-28 h-28 rounded-full object-cover border-4 border-gray-100 shadow-sm mx-auto"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary mx-auto border-4 border-gray-100 shadow-sm">
                  {participant.user.name?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <DetailRow label="Name" value={participant.user.name} />
              <DetailRow label="Email" value={participant.user.email} />
              <DetailRow label="Mobile" value={participant.user.mobile} />
              <DetailRow label="Date of Birth" value={participant.user.dob || "-"} />
              <DetailRow label="Age" value={participant.user.age != null ? `${participant.user.age} years` : null} />
              <DetailRow label="Gender" value={participant.user.gender || "-"} />
              <DetailRow label="Examiner" value={participant.manager?.name || "-"} />
              <DetailRow label="Activity Name" value={participant.sportActivity?.name || "-"} />
              <DetailRow label="Activity Type" value={participant.activityType || "-"} />
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs font-bold text-secondary/50 mb-3 uppercase tracking-wider">Organization Hierarchy</p>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Sector</span><span className="font-medium text-secondary">{participant.user.sector || "N/A"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Department</span><span className="font-medium text-secondary">{participant.user.department || "N/A"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Section</span><span className="font-medium text-secondary">{participant.user.section || "N/A"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Branch</span><span className="font-medium text-secondary">{participant.user.branch || "N/A"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Rank</span><span className="font-medium text-secondary">{participant.user.rank || "N/A"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Job Title</span><span className="font-medium text-secondary">{participant.user.jobTitle || "N/A"}</span></div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ── RIGHT COLUMN: Event Details ── */}
        <div className="space-y-6">
          <SectionCard
            title="Event Details"
            subtitle="Event information and schedule"
            icon={
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <DetailRow label="Event Name" value={participant.event.name} />
              <DetailRow label="Year" value={participant.event.year} />
              <DetailRow label="Start Date" value={participant.event.startDate ? formatDate(participant.event.startDate) : null} />
              <DetailRow label="End Date" value={participant.event.endDate ? formatDate(participant.event.endDate) : null} />
              <DetailRow label="Start Time" value={participant.event.startTime || "-"} />
              <DetailRow label="End Time" value={participant.event.endTime || "-"} />
              <DetailRow label="Location" value={participant.event.location || "-"} />
              <DetailRow label="Number of Hours" value={participant.event.numberOfHour} />
            </div>

            <div className="mt-4 flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-secondary/50 uppercase tracking-wider">Coordinator Status:</span>
                <EventStatusBadge status={participant.event.status} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-secondary/50 uppercase tracking-wider">Event Status:</span>
                <EventActiveBadge status={participant.event.eventActiveStatus} />
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs font-bold text-secondary/50 mb-2 uppercase tracking-wider">Event Description</p>
              <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">
                {participant.event.eventDescription || "No description available"}
              </p>
            </div>
          </SectionCard>

          {/* Participant Status */}
          <SectionCard title="Participation Status">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-secondary/50 uppercase tracking-wider">Current Status</span>
              <StatusBadge status={participant.status} currentApprovalLevel={participant.currentApprovalLevel} workflowStatus={participant.workflowStatus} />
            </div>
            {(participant.status === "0" || participant.workflowStatus === "in_progress") && (
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                {(function() {
                  const stages = ["section", "department", "admin"];
                  const currentIdx = stages.indexOf(participant.currentApprovalLevel || "");
                  return stages.map((stage, i) => (
                    <span key={stage} className={`flex items-center gap-1 ${i <= currentIdx ? "text-primary font-semibold" : "text-gray-300"}`}>
                      {i > 0 && <span className="mx-0.5">→</span>}
                      {levelLabel[stage]}
                    </span>
                  ));
                })()}
              </div>
            )}
          </SectionCard>

          {/* Approval History Timeline */}
          <SectionCard title="Approval Flow">
            {loadingHistory ? (
              <p className="text-xs text-gray-400">Loading...</p>
            ) : approvalHistory.length === 0 ? (
              <p className="text-xs text-gray-400">No approval history available</p>
            ) : (
              <div className="space-y-0">
                {approvalHistory.slice().reverse().map((item, i) => {
                  const isLast = i === approvalHistory.length - 1;
                  const statusColor =
                    item.status === "approved" ? "bg-green-500" :
                    item.status === "rejected" ? "bg-red-500" :
                    item.status === "escalated" ? "bg-orange-400" : "bg-yellow-400";
                  const statusText =
                    item.status === "approved" ? "Approved" :
                    item.status === "rejected" ? "Rejected" :
                    item.status === "escalated" ? "Escalated" : "Pending";
                  return (
                    <div key={item.id} className="relative flex gap-3 pb-4">
                      {!isLast && <div className="absolute left-[11px] top-5 bottom-0 w-0.5 bg-gray-200" />}
                      <div className={`shrink-0 mt-1 w-[22px] h-[22px] rounded-full flex items-center justify-center ${statusColor}`}>
                        {item.status === "approved" ? (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        ) : item.status === "rejected" ? (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        ) : item.status === "escalated" ? (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        ) : (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-secondary">{levelLabel[item.approval_level] || item.approval_level}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                            item.status === "approved" ? "bg-green-50 text-green-700" :
                            item.status === "rejected" ? "bg-red-50 text-red-700" :
                            item.status === "escalated" ? "bg-orange-50 text-orange-700" : "bg-yellow-50 text-yellow-700"
                          }`}>{statusText}</span>
                        </div>
                        {item.approver_name && (
                          <p className="text-xs text-gray-500 mt-0.5">By: {item.approver_name}</p>
                        )}
                        {item.action_date && (
                          <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(item.action_date)}</p>
                        )}
                        {item.comment && (
                          <p className="text-xs text-gray-500 italic mt-0.5 border-l-2 border-gray-200 pl-2">"{item.comment}"</p>
                        )}
                        {item.status === "pending" && item.assigned_date && (
                          <p className="text-[10px] text-gray-400 mt-0.5">Assigned: {formatDate(item.assigned_date)}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* Event Activities */}
          {participant.event.activities && participant.event.activities.length > 0 && (
            <SectionCard title="Event Activities">
              <div className="flex flex-wrap gap-2">
                {participant.event.activities.map((act) => (
                  <span key={act.id} className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                    {act.name}{act.typeName ? ` — ${act.typeName}` : ""}
                  </span>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Event Coordinator */}
          {participant.event.eventCoordinators && participant.event.eventCoordinators.length > 0 && (
            <SectionCard title="Event Coordinator">
              {participant.event.eventCoordinators.map((coord, i) => (
                <div key={i} className="flex items-center gap-3">
                  {coord.image ? (
                    <img src={getImageUrl(coord.image)!} alt={coord.name} className="w-12 h-12 rounded-full object-cover border-2 border-gray-200" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">
                      {coord.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-secondary text-sm">{coord.name}</p>
                    <p className="text-xs text-gray-500">{coord.email}</p>
                    <p className="text-xs text-gray-500">{coord.mobile}</p>
                  </div>
                </div>
              ))}
            </SectionCard>
          )}

          {/* Timestamps */}
          <SectionCard title="Details">
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-500">
              <div><span className="font-semibold">Requested At:</span> {formatDate(participant.createdAt)}</div>
            </div>
          </SectionCard>

          {/* Back Button */}
          <div className="flex gap-3">
            <Link
              to="/participant-requests"
              className="flex items-center justify-center font-bold text-sm rounded-lg px-4 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Back to List
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewParticipant;

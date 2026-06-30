import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getEventActivitiesApi, updateEventActivitiesApi, getYearsApi } from "../../api/events.api";
import { getEmployeesWithFiltersApi, type EmployeeFilterOptions } from "../../api/employees.api";
import EmployeeSelectionModal from "../../component/EmployeeSelectionModal/EmployeeSelectionModal";
import { useTranslation } from "../../hooks/useTranslation";
import { formatDate } from "../../utils/dateUtils";
import toast from "react-hot-toast";

// ─── Helpers ──────────────────────────────────────────────────────
const toDateInputValue = (d?: string) => {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

interface ActivityScheduleItemProps {
  actId: string;
  actName: string;
  sched: { startDate: string; endDate: string; startTime: string; endTime: string; description: string };
  onScheduleChange: (actId: string, field: string, value: string) => void;
  datePickerOpts: any;
  t: any;
}

const ActivityScheduleItem = React.memo(({ actId, actName, sched, onScheduleChange, datePickerOpts, t }: ActivityScheduleItemProps) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/30">
      <h4 className="font-semibold text-secondary mb-3 text-sm">{actName}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">{t.events?.startDate || "Start Date"}</label>
          <input
            type="date"
            value={sched.startDate}
            min={datePickerOpts?.minDate || undefined}
            max={datePickerOpts?.maxDate || undefined}
            onChange={(e) => onScheduleChange(actId, "startDate", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">{t.events?.endDate || "End Date"}</label>
          <input
            type="date"
            value={sched.endDate}
            min={sched.startDate || datePickerOpts?.minDate || undefined}
            max={datePickerOpts?.maxDate || undefined}
            onChange={(e) => {
              if (sched.startDate && e.target.value < sched.startDate) {
                toast.error("End date cannot be before start date");
                return;
              }
              onScheduleChange(actId, "endDate", e.target.value);
            }}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">{t.events?.startTime || "Start Time"}</label>
          <input
            type="time"
            value={sched.startTime}
            onChange={(e) => onScheduleChange(actId, "startTime", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">{t.events?.endTime || "End Time"}</label>
          <input
            type="time"
            value={sched.endTime}
            onChange={(e) => {
              if (sched.startTime && e.target.value < sched.startTime) {
                toast.error("End time cannot be before start time");
                return;
              }
              onScheduleChange(actId, "endTime", e.target.value);
            }}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <label className="block text-xs font-semibold text-gray-500 mb-1">{t.events?.description || "Description"}</label>
          <input
            type="text"
            value={sched.description}
            onChange={(e) => onScheduleChange(actId, "description", e.target.value)}
            placeholder="Optional description"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
});

const validateScheduleDates = (sched: Record<string, any>, eventStart: string, eventEnd: string, label: string): string | null => {
  if (!sched.startDate && !sched.endDate) return null;
  const evStart = eventStart?.split("T")[0];
  const evEnd = eventEnd?.split("T")[0];
  if (sched.startDate && sched.startDate < evStart) return `${label}: Start date cannot be before event start`;
  if (sched.endDate && sched.endDate > evEnd) return `${label}: End date cannot be after event end`;
  if (sched.startDate && sched.endDate && sched.startDate > sched.endDate) return `${label}: Start date must be before end date`;
  return null;
};

// ─── Main Component ────────────────────────────────────────────────
const ManageEventActivity = () => {
  const { t } = useTranslation();
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [targetType, setTargetType] = useState("");
  const [teamName, setTeamName] = useState<string[]>([]);
  const [targetedEmployees, setTargetedEmployees] = useState("all");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [schedules, setSchedules] = useState<Record<string, { startDate: string; endDate: string; startTime: string; endTime: string; description: string }>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [years, setYears] = useState<Array<{ id: number; year: number }>>([]);

  // Employee modal
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [filterOptions, setFilterOptions] = useState<EmployeeFilterOptions>({
    sectors: [], departments: [], sections: [], branches: [],
    ranks: [], jobTitles: [], genders: [], workSystems: [], staffTypes: [],
  });

  const eventStartStr = useMemo(() => {
    if (!data?.event?.startDate) return "";
    const d = new Date(data.event.startDate);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, [data?.event?.startDate]);

  const eventEndStr = useMemo(() => {
    if (!data?.event?.endDate) return "";
    const d = new Date(data.event.endDate);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, [data?.event?.endDate]);

  // Flatpickr config
  const datePickerOpts = useMemo(() => ({
    dateFormat: "Y-m-d",
    minDate: eventStartStr || undefined,
    maxDate: eventEndStr || undefined,
    disableMobile: true,
  }), [eventStartStr, eventEndStr]);

  const fetchData = async () => {
    if (!eventId) return;
    try {
      const res = await getEventActivitiesApi(Number(eventId));
      if (res.status && res.data) {
        setData(res.data);
        const ev = res.data.event;
        setSelectedActivities(ev.activityId || []);
        setTargetType(ev.targetType || "");
        setTargetedEmployees(ev.targetedEmployees || "all");
        setTeamName(ev.teamName || []);
        setSelectedUserIds(ev.selectedEmployees ? ev.selectedEmployees.split(",").map((s: any) => s.trim()).filter(Boolean) : []);
        const schedMap: Record<string, any> = {};
        if (res.data.schedules) {
          res.data.schedules.forEach((s: any) => {
            schedMap[String(s.activity_id)] = {
              startDate: toDateInputValue(s.start_date),
              endDate: toDateInputValue(s.end_date),
              startTime: s.start_time || "",
              endTime: s.end_time || "",
              description: s.description || "",
            };
          });
        }
        setSchedules(schedMap);
      }
      // Load employee filter options
      const empRes = await getEmployeesWithFiltersApi();
      if (empRes.status && empRes.data?.filterOptions) {
        setFilterOptions(empRes.data.filterOptions);
      }

      // Load years for summary display
      const yearsRes = await getYearsApi();
      if (yearsRes.status && yearsRes.data) {
        setYears(yearsRes.data);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to load event data");
      navigate("/events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [eventId]);

  const handleActivityToggle = (id: string) => {
    setSelectedActivities((prev) => {
      const next = prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id];

      // Auto-set target type + teams based on selected activities' isTeam
      const hasTeamActivity = next.some((actId) =>
        data?.sportActivities?.find((a: any) => String(a.id) === actId)?.isTeam === "1"
      );

      setTimeout(() => {
        if (hasTeamActivity) {
          setTargetType("competitive");
          if (data?.teams && data.teams.length > 0) {
            setTeamName((data?.teams ?? []).map((t: any) => String(t.id)));
          }
        } else if (next.length > 0) {
          setTargetType("ragular");
          setTeamName([]);
        }
      }, 0);

      return next;
    });
  };

  const handleScheduleChange = useCallback((activityId: string, field: string, value: string) => {
    setSchedules((prev) => {
      const current = prev[activityId] || { startDate: "", endDate: "", startTime: "", endTime: "", description: "" };
      if (current[field as keyof typeof current] === value) return prev;

      // Prevent endDate < startDate at field level
      if (field === "endDate" && value && current.startDate && value < current.startDate) {
        toast.error("End date cannot be before start date");
        return prev;
      }

      return {
        ...prev,
        [activityId]: { ...current, [field]: value },
      };
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (selectedActivities.length === 0) {
      setErrors({ activities: "Please select at least one activity" });
      return;
    }
    if (!targetType) {
      setErrors({ targetType: "Please select target type" });
      return;
    }
    if (targetType === "competitive" && teamName.length === 0) {
      setErrors({ teamName: "Please select at least one team" });
      return;
    }
    if (targetType === "ragular" && targetedEmployees === "selected" && selectedUserIds.length === 0) {
      setErrors({ selectedEmployees: "Please select at least one employee" });
      return;
    }

    // Validate schedule dates against event dates
    if (data) {
      const eventStart = data.event.startDate;
      const eventEnd = data.event.endDate;
      for (const actId of selectedActivities) {
        const act = data.sportActivities.find((a: any) => String(a.id) === actId);
        const label = act?.name || `Activity #${actId}`;
        const sched = schedules[actId];
        if (sched) {
          const err = validateScheduleDates(sched, eventStart, eventEnd, label);
          if (err) {
            setErrors({ schedule: err });
            return;
          }
        }
      }
    }

    setSaving(true);
    try {
      const schedArray = selectedActivities.map((actId) => ({
        activityId: actId,
        ...(schedules[actId] || { startDate: "", endDate: "", startTime: "", endTime: "", description: "" }),
      }));

      const body: Record<string, any> = {
        activityId: selectedActivities,
        targetType,
        schedules: schedArray,
      };

      if (targetType === "competitive") {
        body.teamName = teamName;
      } else {
        body.targetedEmployees = targetedEmployees;
        if (targetedEmployees === "selected") {
          body.selectedUserIds = selectedUserIds;
        }
      }

      const res = await updateEventActivitiesApi(Number(eventId), body);
      if (res.status) {
        toast.success(res.message || "Event activities updated successfully");
        navigate(`/events/view/${eventId}`);
      } else {
        toast.error(res.message || "Failed to update");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update event activities");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        <p className="mt-4 text-secondary/60 font-medium">{t.events?.loading || "Loading..."}</p>
      </div>
    );
  }

  if (!data) return null;

  const ev = data.event;
  const isEventCompleted = ev.eventActiveStatus === '2';

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <Link to={`/events/view/${eventId}`} className="flex items-center gap-1.5 text-secondary/60 hover:text-secondary transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="font-semibold text-sm">{t.events?.backToList || "Back to Event"}</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Summary */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-secondary mb-4">{t.events?.eventSummary || "Event Summary"}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-lg p-4">
              <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">{t.events?.eventName || "Event Name"}</span>
              <p className="font-semibold text-secondary">{ev.name}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">{t.events?.year || "Year"}</span>
              <p className="font-semibold text-secondary">
                {years.find(y => String(y.id) === String(ev.year))?.year || ev.year}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">{t.events?.startDate || "Start Date"}</span>
              <p className="font-semibold text-secondary">{formatDate(ev.startDate)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">{t.events?.endDate || "End Date"}</span>
              <p className="font-semibold text-secondary">{formatDate(ev.endDate)}</p>
            </div>
          </div>
        </div>

        {/* Activity & Target Type */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-secondary mb-4">{t.events?.activityConfiguration || "Activity Configuration"}</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                {t.events?.selectActivities || "Select Activities"} <span className="text-red-500">*</span>
              </label>
              <div className="border border-gray-200 rounded-lg p-3 max-h-56 overflow-y-auto space-y-2">
                {isEventCompleted && (
                  <div className="flex items-center gap-2 p-2 mb-1 text-xs font-semibold text-gray-400 bg-gray-50 rounded-lg">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Event is completed. Activities cannot be modified.
                  </div>
                )}
                {data.sportActivities.map((act: any) => {
                  const isSelected = selectedActivities.includes(String(act.id));
                  const isTeamAct = act.isTeam === "1";
                  return (
                    <label key={act.id} className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${isSelected ? "bg-primary/10" : ""} ${isEventCompleted ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-gray-50"}`}>
                      <input type="checkbox" checked={isSelected} disabled={isEventCompleted} onChange={() => handleActivityToggle(String(act.id))} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-secondary">{act.name}</p>
                        <div className="flex items-center gap-2">
                          {act.activityTypeName && <p className="text-xs text-gray-400">{act.activityTypeName}</p>}
                          {isTeamAct && <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">Team</span>}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
              {errors.activities && <p className="text-xs text-red-500 mt-1">{errors.activities}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                {t.events?.targetType || "Target Type"} <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50/50">
                <label className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-colors ${targetType === "ragular" ? "bg-primary text-white" : "bg-white border border-gray-200 hover:border-primary"}`}>
                  <input type="radio" name="targetType" value="ragular" checked={targetType === "ragular"} onChange={(e) => setTargetType(e.target.value)} className="sr-only" />
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm font-semibold">{t.events?.regularEmployee || "Regular Employee"}</span>
                </label>
                <label className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-colors ${targetType === "competitive" ? "bg-primary text-white" : "bg-white border border-gray-200 hover:border-primary"}`}>
                  <input type="radio" name="targetType" value="competitive" checked={targetType === "competitive"} onChange={(e) => setTargetType(e.target.value)} className="sr-only" />
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-sm font-semibold">{t.events?.competitiveEmployee || "Competitive Employee"}</span>
                </label>
              </div>
              {errors.targetType && <p className="text-xs text-red-500 mt-1">{errors.targetType}</p>}
            </div>
          </div>

          {/* Teams (competitive) */}
          {targetType === "competitive" && (
            <div className="mt-6">
              <label className="block text-sm font-semibold text-secondary mb-2">{t.events?.teams || "Teams"} <span className="text-red-500">*</span></label>
              <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {data.teams.map((team: any) => {
                  const isSelected = teamName.includes(String(team.id));
                  return (
                    <label key={team.id} className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${isSelected ? "bg-primary/10" : "hover:bg-gray-50"}`}>
                      <input type="checkbox" checked={isSelected} onChange={() => setTeamName((prev) => prev.includes(String(team.id)) ? prev.filter((t) => t !== String(team.id)) : [...prev, String(team.id)])} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                      <span className="text-sm font-medium text-secondary">{team.name}</span>
                    </label>
                  );
                })}
              </div>
              {errors.teamName && <p className="text-xs text-red-500 mt-1">{errors.teamName}</p>}
            </div>
          )}

          {/* Targeted Employees (regular) */}
          {targetType === "ragular" && (
            <div className="mt-6">
              <label className="block text-sm font-semibold text-secondary mb-2">{t.events?.targetedEmployees || "Targeted Employees"} <span className="text-red-500">*</span></label>
              <div className="flex gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50/50">
                <label className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-colors ${targetedEmployees === "all" ? "bg-primary text-white" : "bg-white border border-gray-200 hover:border-primary"}`}>
                  <input type="radio" name="targetedEmployees" value="all" checked={targetedEmployees === "all"} onChange={() => setTargetedEmployees("all")} className="sr-only" />
                  <span className="text-sm font-semibold">{t.events?.allEmployees || "All Employees"}</span>
                </label>
                <label className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-colors ${targetedEmployees === "selected" ? "bg-primary text-white" : "bg-white border border-gray-200 hover:border-primary"}`}>
                  <input type="radio" name="targetedEmployees" value="selected" checked={targetedEmployees === "selected"} onChange={() => setTargetedEmployees("selected")} className="sr-only" />
                  <span className="text-sm font-semibold">{t.events?.selectedEmployees || "Selected Employees"}</span>
                </label>
              </div>

              {targetedEmployees === "selected" && (
                <div className="mt-3">
                  <button type="button" onClick={() => setShowEmployeeModal(true)} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border border-primary text-primary text-sm font-semibold hover:bg-primary/5 transition-colors cursor-pointer">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {selectedUserIds.length > 0
                      ? `Manage Employees (${selectedUserIds.length} selected)`
                      : "Select Employees"}
                  </button>
                  {selectedUserIds.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">{selectedUserIds.length} employee{selectedUserIds.length > 1 ? "s" : ""} selected</p>
                  )}
                  {errors.selectedEmployees && <p className="text-xs text-red-500 mt-1">{errors.selectedEmployees}</p>}
                </div>
              )}


            </div>
          )}
        </div>

        {/* Activity Schedules with Flatpickr */}
        {selectedActivities.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-base font-bold text-secondary mb-4">{t.events?.activitySchedules || "Activity Schedules"}</h3>
            {errors.schedule && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errors.schedule}</div>
            )}
            <div className="space-y-4">
              {selectedActivities.map((actId) => {
                const act = data.sportActivities.find((a: any) => String(a.id) === actId);
                const sched = schedules[actId] || { startDate: "", endDate: "", startTime: "", endTime: "", description: "" };
                return (
                  <ActivityScheduleItem
                    key={actId}
                    actId={actId}
                    actName={act?.name || `Activity #${actId}`}
                    sched={sched}
                    onScheduleChange={handleScheduleChange}
                    datePickerOpts={datePickerOpts}
                    t={t}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <Link to={`/events/view/${eventId}`} className="flex items-center justify-center font-bold text-sm rounded-lg px-6 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
            {t.events?.cancel || "Cancel"}
          </Link>
          <button type="submit" disabled={saving || isEventCompleted} className="flex items-center justify-center font-bold text-sm rounded-lg px-6 py-1.5 bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer">
            {saving ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                {t.events?.saving || "Saving..."}
              </>
            ) : (t.events?.submit || "Submit")}
          </button>
        </div>
      </form>

      {/* Employee Selection Modal */}
      <EmployeeSelectionModal
        open={showEmployeeModal}
        onClose={() => setShowEmployeeModal(false)}
        selected={selectedUserIds}
        onSave={(ids) => { setSelectedUserIds(ids); setShowEmployeeModal(false); }}
        filterOptions={filterOptions}
      />
    </div>
  );
};

export default ManageEventActivity;

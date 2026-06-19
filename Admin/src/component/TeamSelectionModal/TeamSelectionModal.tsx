import { useState, useEffect, useMemo, useCallback } from "react";
import { apiRequest } from "../../api/request";

export interface TeamOption {
  id: number;
  name: string;
  activity: string;
  numberOfMembers: number;
}

const TeamSelectionModal = ({
  open, onClose, selected, onSave, activityId, excludeTeamIds,
}: {
  open: boolean;
  onClose: () => void;
  selected: number[];
  onSave: (ids: number[]) => void;
  activityId?: string;
  excludeTeamIds?: number[];
}) => {
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>(selected);
  const [search, setSearch] = useState("");

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activityId) params.append("activity_id", activityId);
      const res = await apiRequest({
        url: `/admin/teams/list-all?${params.toString()}`,
        method: "GET",
      });
      if (res.status && Array.isArray(res.data)) setTeams(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [activityId]);

  useEffect(() => {
    if (open) fetchTeams();
  }, [open, fetchTeams]);

  useEffect(() => {
    setSelectedIds(selected);
  }, [selected, open]);

  const toggleTeam = (id: number) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    const filteredIds = filtered.map(e => e.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedIds(prev => {
        const next = [...prev];
        filteredIds.forEach(id => {
          if (!next.includes(id)) next.push(id);
        });
        return next;
      });
    }
  };

  const availableTeams = useMemo(() =>
    excludeTeamIds && excludeTeamIds.length > 0
      ? teams.filter((t) => !excludeTeamIds.includes(t.id))
      : teams,
    [teams, excludeTeamIds]
  );

  const filtered = useMemo(() => {
    if (!search) return availableTeams;
    const s = search.toLowerCase();
    return availableTeams.filter((t) =>
      t.name?.toLowerCase().includes(s) ||
      String(t.id).includes(s)
    );
  }, [availableTeams, search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-secondary">Select Teams</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <input
            type="text"
            placeholder="Search teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-1.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filtered.length > 0 && filtered.every(e => selectedIds.includes(e.id))} onChange={selectAll} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
              <span className="text-sm font-medium text-secondary">Select All ({filtered.length} teams)</span>
            </label>
            <span className="text-xs text-gray-400">{selectedIds.length} selected</span>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="w-10 p-2 text-left" />
                    <th className="p-2 text-left font-semibold text-gray-600">Team Name</th>
                    <th className="p-2 text-left font-semibold text-gray-600">Members</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={3} className="text-center py-8 text-gray-400">Loading...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={3} className="text-center py-8 text-gray-400">No teams found</td></tr>
                  ) : filtered.map((team) => (
                    <tr key={team.id} className={`border-t border-gray-100 hover:bg-gray-50 cursor-pointer ${selectedIds.includes(team.id) ? "bg-primary/5" : ""}`} onClick={() => toggleTeam(team.id)}>
                      <td className="p-2">
                        <input type="checkbox" checked={selectedIds.includes(team.id)} onChange={() => toggleTeam(team.id)} onClick={(e) => e.stopPropagation()} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                      </td>
                      <td className="p-2 font-medium text-secondary">{team.name}</td>
                      <td className="p-2 text-gray-500">{team.numberOfMembers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-1.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={() => onSave(selectedIds)} className="px-5 py-1.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer">
            Add Selected Teams ({selectedIds.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamSelectionModal;

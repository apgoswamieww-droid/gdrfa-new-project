import { useState, useEffect, useMemo, useCallback } from "react";
import { getEmployeesWithFiltersApi, type EmployeeWithDetails, type EmployeeFilterOptions } from "../../api/employees.api";

export type { EmployeeFilterOptions, EmployeeWithDetails };

const EmployeeSelectionModal = ({
  open, onClose, selected, onSave, filterOptions,
}: {
  open: boolean;
  onClose: () => void;
  selected: string[];
  onSave: (ids: string[]) => void;
  filterOptions: EmployeeFilterOptions;
}) => {
  const [employees, setEmployees] = useState<EmployeeWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(selected);
  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState({
    gender: "", sector: "", department: "", section: "", branch: "",
    rank: "", jobTitle: "", workSystem: "", staffType: "", peopleOfDetermination: "", from_age: "", to_age: "",
  });

  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setDebouncedFilters(filters);
    }, 500);
    return () => clearTimeout(timer);
  }, [search, filters]);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (debouncedSearch) params.search = debouncedSearch;
      Object.entries(debouncedFilters).forEach(([k, v]) => { if (v) params[k] = v; });
      const res = await getEmployeesWithFiltersApi(params);
      if (res.status && res.data) setEmployees(res.data.employees);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [debouncedSearch, debouncedFilters]);

  useEffect(() => {
    if (open) fetchEmployees();
  }, [open, fetchEmployees]);

  useEffect(() => {
    setSelectedIds(selected);
  }, [selected, open]);

  const toggleEmployee = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    const filteredIds = filtered.map(e => e.id);
    const allFilteredSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.includes(id));

    if (allFilteredSelected) {
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

  const filtered = useMemo(() => {
    let list = employees;

    if (search) {
      const s = search.toLowerCase();
      list = list.filter((e) =>
        e.name?.toLowerCase().includes(s) ||
        e.email?.toLowerCase().includes(s) ||
        e.mobile?.includes(s) ||
        e.id?.toLowerCase().includes(s) ||
        e.grp?.toLowerCase().includes(s)
      );
    }

    if (filters.from_age) {
      const from = parseInt(filters.from_age, 10);
      if (!isNaN(from)) list = list.filter((e) => !e.age || parseInt(e.age, 10) >= from);
    }
    if (filters.to_age) {
      const to = parseInt(filters.to_age, 10);
      if (!isNaN(to)) list = list.filter((e) => !e.age || parseInt(e.age, 10) <= to);
    }
    if (filters.gender) list = list.filter(e => e.gender?.toLowerCase() === filters.gender.toLowerCase());
    if (filters.sector) list = list.filter(e => e.sector === filters.sector);
    if (filters.department) list = list.filter(e => e.department === filters.department);
    if (filters.section) list = list.filter(e => e.section === filters.section);
    if (filters.branch) list = list.filter(e => e.branch === filters.branch);
    if (filters.rank) list = list.filter(e => e.rank === filters.rank);
    if (filters.jobTitle) list = list.filter(e => e.jobTitle === filters.jobTitle);
    if (filters.workSystem) list = list.filter(e => e.workSystem === filters.workSystem);
    if (filters.staffType) list = list.filter(e => e.staffType === filters.staffType);
    if (filters.peopleOfDetermination) list = list.filter(e => e.peopleOfDetermination === filters.peopleOfDetermination);

    return list;
  }, [employees, search, filters]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-secondary">Select Employees</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-1.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <select value={filters.sector} onChange={(e) => setFilters((p) => ({ ...p, sector: e.target.value }))} className="px-3 py-2 border border-gray-200 rounded-xl text-sm">
              <option value="">All Sectors</option>
              {filterOptions.sectors.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.department} onChange={(e) => setFilters((p) => ({ ...p, department: e.target.value }))} className="px-3 py-2 border border-gray-200 rounded-xl text-sm">
              <option value="">All Departments</option>
              {filterOptions.departments.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.section} onChange={(e) => setFilters((p) => ({ ...p, section: e.target.value }))} className="px-3 py-2 border border-gray-200 rounded-xl text-sm">
              <option value="">All Sections</option>
              {filterOptions.sections.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.branch} onChange={(e) => setFilters((p) => ({ ...p, branch: e.target.value }))} className="px-3 py-2 border border-gray-200 rounded-xl text-sm">
              <option value="">All Branches</option>
              {filterOptions.branches.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.gender} onChange={(e) => setFilters((p) => ({ ...p, gender: e.target.value }))} className="px-3 py-2 border border-gray-200 rounded-xl text-sm">
              <option value="">All Genders</option>
              {filterOptions.genders.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="number" placeholder="Age From" value={filters.from_age} onChange={(e) => setFilters((p) => ({ ...p, from_age: e.target.value }))} className="px-3 py-2 border border-gray-200 rounded-xl text-sm" />
            <input type="number" placeholder="Age To" value={filters.to_age} onChange={(e) => setFilters((p) => ({ ...p, to_age: e.target.value }))} className="px-3 py-2 border border-gray-200 rounded-xl text-sm" />
            <select value={filters.rank} onChange={(e) => setFilters((p) => ({ ...p, rank: e.target.value }))} className="px-3 py-2 border border-gray-200 rounded-xl text-sm">
              <option value="">All Ranks</option>
              {filterOptions.ranks.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.jobTitle} onChange={(e) => setFilters((p) => ({ ...p, jobTitle: e.target.value }))} className="px-3 py-2 border border-gray-200 rounded-xl text-sm">
              <option value="">All Job Titles</option>
              {filterOptions.jobTitles.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.staffType} onChange={(e) => setFilters((p) => ({ ...p, staffType: e.target.value }))} className="px-3 py-2 border border-gray-200 rounded-xl text-sm">
              <option value="">All Staff Types</option>
              {filterOptions.staffTypes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.peopleOfDetermination} onChange={(e) => setFilters((p) => ({ ...p, peopleOfDetermination: e.target.value }))} className="px-3 py-2 border border-gray-200 rounded-xl text-sm">
              <option value="">All People of Determination</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filtered.length > 0 && filtered.every(e => selectedIds.includes(e.id))} onChange={selectAll} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
              <span className="text-sm font-medium text-secondary">Select All ({filtered.length} employees)</span>
            </label>
            <span className="text-xs text-gray-400">{selectedIds.length} selected</span>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="w-10 p-2 text-left" />
                    <th className="p-2 text-left font-semibold text-gray-600">Name</th>
                    <th className="p-2 text-left font-semibold text-gray-600">Email</th>
                    <th className="p-2 text-left font-semibold text-gray-600">Mobile</th>
                    <th className="p-2 text-left font-semibold text-gray-600">Sector</th>
                    <th className="p-2 text-left font-semibold text-gray-600">Department</th>
                    <th className="p-2 text-left font-semibold text-gray-600">Section</th>
                    <th className="p-2 text-left font-semibold text-gray-600">Branch</th>
                    <th className="p-2 text-left font-semibold text-gray-600">GRP</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={9} className="text-center py-8 text-gray-400">Loading...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-8 text-gray-400">No employees found</td></tr>
                  ) : filtered.map((emp) => (
                    <tr key={emp.id} className={`border-t border-gray-100 hover:bg-gray-50 cursor-pointer ${selectedIds.includes(emp.id) ? "bg-primary/5" : ""}`} onClick={() => toggleEmployee(emp.id)}>
                      <td className="p-2">
                        <input type="checkbox" checked={selectedIds.includes(emp.id)} onChange={() => toggleEmployee(emp.id)} onClick={(e) => e.stopPropagation()} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                      </td>
                      <td className="p-2 font-medium text-secondary">{emp.name}</td>
                      <td className="p-2 text-gray-500">{emp.email}</td>
                      <td className="p-2 text-gray-500">{emp.mobile}</td>
                      <td className="p-2 text-gray-500">{emp.sector}</td>
                      <td className="p-2 text-gray-500">{emp.department}</td>
                      <td className="p-2 text-gray-500">{emp.section}</td>
                      <td className="p-2 text-gray-500">{emp.branch}</td>
                      <td className="p-2 text-gray-500">{emp.grp}</td>
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
            Save ({selectedIds.length} selected)
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeSelectionModal;
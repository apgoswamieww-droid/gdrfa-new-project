import { useState, useMemo } from "react";

// ─── Types ─────────────────────────────────────────────────────
export type Column<T> = {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  className?: string;
};

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: (row: T) => React.ReactNode;
  perPageOptions?: number[];
  className?: string;
  keyExtractor?: (row: T, index: number) => string | number;
  loading?: boolean;
  loadingText?: string;
  totalRecords?: number;
}

// ─── Icons ──────────────────────────────────────────────────────
const SortIcon = ({ active, dir }: { active: boolean; dir: "asc" | "desc" }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.6043 9.59964C11.7683 9.59964 11.8629 9.78334 11.7634 9.91368C11.043 10.8568 8.87285 13.5996 8 13.5996C7.12713 13.5996 4.95716 10.857 4.2367 9.91373" fill={active ? "#0A2240" : "#B2B1B1"} className={dir === "desc" ? "" : "opacity-40"} />
    <path d="M8 13.5996C8.87285 13.5996 11.043 10.8568 11.7634 9.91368C11.8629 9.78334 11.7683 9.59964 11.6043 9.59964L4.39575 9.59961C4.23173 9.59961 4.13713 9.78338 4.2367 9.91373C4.95716 10.857 7.12713 13.5996 8 13.5996Z" stroke="#161616" strokeLinecap="round" strokeLinejoin="round" className={dir === "asc" ? "" : "opacity-40"} />
    <path d="M11.6043 6.40036C11.7683 6.40036 11.8629 6.21666 11.7634 6.08632C11.043 5.14321 8.87285 2.40039 8 2.40039C7.1271 2.40039 4.95701 5.14324 4.23663 6.08636" fill={active ? "#0A2240" : "#B2B1B1"} className={dir === "asc" ? "" : "opacity-40"} />
    <path d="M8 2.40039C7.1271 2.40039 4.95701 5.14324 4.23663 6.08636C4.13708 6.21669 4.23167 6.40039 4.39568 6.40039L11.6043 6.40036C11.7683 6.40036 11.8629 6.21666 11.7634 6.08632C11.043 5.14321 8.87285 2.40039 8 2.40039Z" stroke="#161616" strokeLinecap="round" strokeLinejoin="round" className={dir === "desc" ? "" : "opacity-40"} />
  </svg>
);

const ChevronLeft = () => (
  <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.89839 0.900391C6.89839 0.900391 0.898437 5.31929 0.898438 6.90039C0.898438 8.48159 6.89844 12.9004 6.89844 12.9004" stroke="#B2B1B1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronRight = () => (
  <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0.898487 0.900391C0.898487 0.900391 6.89844 5.31929 6.89844 6.90039C6.89844 8.48159 0.898438 12.9004 0.898438 12.9004" stroke="#161616" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronDown = () => (
  <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.8984 0.900432C10.8984 0.900432 7.21602 5.90039 5.89844 5.90039C4.58077 5.90039 0.898438 0.900391 0.898438 0.900391" stroke="#161616" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── DataTable ────────────────────────────────────────────────────
export default function DataTable<T>({
  data,
  columns,
  actions,
  perPageOptions = [5, 10, 20, 50],
  className = "",
  keyExtractor = (_row: T, index: number) => index,
  loading = false,
  loadingText = "Loading...",
  totalRecords,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(perPageOptions[1] || 10);

  // Sorting
  const sorted = useMemo(() => {
    const sortedData = Array.isArray(data) ? [...data] : [];
    if (sortKey) {
      sortedData.sort((a: T, b: T) => {
        const av = a[sortKey as keyof T];
        const bv = b[sortKey as keyof T];
        if (av < bv) return sortDir === "asc" ? -1 : 1;
        if (av > bv) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortedData;
  }, [data, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.ceil(sorted.length / perPage);
  const paginated = sorted.slice((currentPage - 1) * perPage, currentPage * perPage);

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className={`bg-white rounded-xl overflow-visible flex flex-col ${className}`}>
      {/* Table */}
      <div className="flex-1 overflow-auto custom-scrollbar 2xl:max-h-[600px] max-h-[400px]">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead className="bg-[#E7D2D2]/24 sticky top-0 z-10 [&>tr>th:first-child]:rounded-s-xl [&>tr>th:last-child]:rounded-e-xl">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-3 py-2 text-start 2xl:text-base text-sm font-bold text-black select-none whitespace-nowrap bg-[#fcf9f9] first:rounded-s-xl last:rounded-e-xl ${col.sortable ? "cursor-pointer" : ""} ${col.className || ""}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && <SortIcon active={sortKey === col.key} dir={sortDir} />}
                  </span>
                </th>
              ))}
              {actions && (
                <th className="px-3 py-2 text-start 2xl:text-base text-sm font-bold text-black whitespace-nowrap bg-[#fcf9f9] last:rounded-e-xl">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary/11">
            {loading ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="px-3 py-8 text-center text-gray-400 2xl:text-base text-sm">
                {loadingText}
              </td>
            </tr>
          ) : paginated.length > 0 ? (
              paginated.map((row, index) => (
                <tr key={keyExtractor(row, index)} className="transition-colors duration-150 hover:bg-gray-50/50">
                  {columns.map((col) => (
                    <td key={String(col.key)} className={`px-3 py-2 border-b border-secondary/11 text-[13px] ${col.className || ""}`}>
                      {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? "")}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-3 py-2 border-b border-secondary/11">
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-3 py-8 text-center text-gray-400 2xl:text-base text-sm">
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between border-t border-gray-100 gap-2 mt-auto p-3">
        {/* Results count */}
        <span className="2xl:text-base text-sm font-medium text-gray-200">
          Showing{" "}
          <span className="font-bold text-primary">
            {String(paginated.length).padStart(2, "0")}
          </span>{" "}
          Of{" "}
          <span className="font-medium text-gray-200">
            {String(totalRecords ?? sorted.length).padStart(2, "0")}
          </span>{" "}
          Results
        </span>

        {/* Pagination */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-7 h-7 flex items-center justify-center rounded-full text-black disabled:opacity-30 transition-colors rtl:-scale-x-100"
          >
            <ChevronLeft />
          </button>

          {(() => {
            const pages: (number | "...")[] = [];
            if (totalPages <= 7) {
              for (let i = 1; i <= totalPages; i++) pages.push(i);
            } else {
              pages.push(1);
              if (currentPage > 3) pages.push("...");
              const start = Math.max(2, currentPage - 1);
              const end = Math.min(totalPages - 1, currentPage + 1);
              for (let i = start; i <= end; i++) pages.push(i);
              if (currentPage < totalPages - 2) pages.push("...");
              pages.push(totalPages);
            }
            return pages.map((page, idx) =>
              page === "..." ? (
                <span key={`ellipsis-${idx}`} className="2xl:w-9 w-8 h-8 flex items-center justify-center text-sm text-gray-400 select-none">...</span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`2xl:w-9 w-8 2xl:h-9 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors
                    ${currentPage === page
                      ? "bg-primary text-white"
                      : "text-gray-500 hover:bg-gray-100"}`}
                >
                  {page}
                </button>
              )
            );
          })()}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-7 h-7 flex items-center justify-center rounded-full text-black disabled:opacity-30 transition-colors rtl:-scale-x-100"
          >
            <ChevronRight />
          </button>
        </div>

        {/* Per page */}
        <div className="flex items-center gap-2 2xl:text-base text-sm font-medium text-gray-200">
          <span>Show Per Page</span>
          <div className="relative">
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="appearance-none bg-transparent border border-[#B2B1B166] rounded-full ps-2.5 pe-8 py-1 2xl:text-base text-sm font-medium text-primary focus:outline-none cursor-pointer"
            >
              {perPageOptions.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span className="absolute inset-e-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <ChevronDown />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


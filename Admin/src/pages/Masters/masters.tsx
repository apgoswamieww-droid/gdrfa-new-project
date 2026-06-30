// src/pages/Masters/Masters.tsx
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "../../hooks/useTranslation";

const Masters = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const menuItems = [
    {
      path: "/masters/manage-kpis",
      label: t.kpi?.manage || "Manage KPIs",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    {
      path: "/masters/event-types",
      label: t.eventType?.manage || "Manage Event Types",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      path: "/masters/event-activities",
      label: t.eventActivity?.manage || "Manage Event Activities",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      ),
    },
    {
      path: "/masters/plans",
      label: t.plan?.manage || "Manage Plans",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
    },
    {
      path: "/masters/faqs",
      label: "Manage FAQs",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex gap-4">
      {/* Sidebar Menu */}
      <div className="w-64 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-secondary mb-4 px-2">Masters</h2>
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <h1 className="text-xl font-bold text-secondary mb-2">Masters Menu</h1>
          <p className="text-gray-500 mb-6">Select a module from the sidebar to manage.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition ${
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
                  }`}
                >
                  <div className={`p-3 rounded-xl ${isActive ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}>
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Masters;

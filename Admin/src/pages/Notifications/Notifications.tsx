import { useState, useEffect, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import {
  getAdminNotifications,
  markAdminNotificationAsRead,
  clearAllAdminNotifications,
} from "../../api/notification.api";

function formatTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hours ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} days ago`;
  return new Date(dateStr).toLocaleDateString();
}

const Notifications = () => {
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [clearing, setClearing] = useState(false);

  const fetchNotifications = useCallback(async (p: number, type: "all" | "unread") => {
    setLoading(true);
    try {
      const res = await getAdminNotifications(p, 20, type);
      setNotifications(res.data.notifications || []);
      const pag = res.data.pagination;
      setTotalPages(pag?.totalPages || 1);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchNotifications(1, tab);
  }, [tab, fetchNotifications]);

  useEffect(() => {
    if (page > 1) fetchNotifications(page, tab);
  }, [page, tab, fetchNotifications]);

  const markAsRead = async (id: number) => {
    try {
      await markAdminNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: 1 } : n))
      );
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const clearAll = async () => {
    if (!window.confirm("Clear all notifications?")) return;
    setClearing(true);
    try {
      await clearAllAdminNotifications();
      setNotifications([]);
      setTotalPages(1);
      toast.success("All notifications cleared");
    } catch {
      toast.error("Failed to clear notifications");
    } finally {
      setClearing(false);
    }
  };

  const unreadCount = useMemo(() =>
    notifications.filter(n => !n.isRead).length,
    [notifications]
  );

  return (
    <div className="2xl:space-y-8 md:space-y-6 space-y-4 h-full flex flex-col">
      <div className="flex sm:flex-row flex-col gap-3 justify-between md:mb-7 mb-5">
        <h1 className="text-xl font-bold text-secondary">Notifications</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setTab("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              tab === "all" ? "bg-primary text-white" : "bg-gray-100 text-secondary hover:bg-gray-200"
            }`}
          >
            All {tab === "all" && `(${notifications.length})`}
          </button>
          <button
            onClick={() => setTab("unread")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              tab === "unread" ? "bg-primary text-white" : "bg-gray-100 text-secondary hover:bg-gray-200"
            }`}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              disabled={clearing}
              className="px-4 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              {clearing ? "Clearing..." : "Clear All"}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {loading && notifications.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-secondary/40 text-sm font-medium">
            No notifications
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => !n.isRead && markAsRead(n.id)}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${
                  n.isRead
                    ? "bg-white border-gray-100 opacity-60"
                    : "bg-primary/5 border-primary/10"
                }`}
              >
                <div
                  className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                    n.isRead ? "bg-gray-300" : "bg-primary"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-secondary">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1.5">{formatTime(n.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
            >
              Previous
            </button>
            <span className="text-sm text-secondary/60">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MenuIcon, UserImg } from "../../assets/images/images";
import { adminLogoutApi } from "../../api/auth.api";
import { Heading, Text } from "../Typography/Typography";
import { useLanguage } from "../../context/LanguageContext";
import {
  getAdminNotifications,
  clearAllAdminNotifications,
  markAdminNotificationAsRead,
  getAdminUnreadCount,
} from "../../api/notification.api";

function formatNotificationTime(dateStr: string): string {
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

const Topbar = ({ setOpen }: { setOpen: (open: boolean | ((prev: boolean) => boolean)) => void }) => {
  const navigate = useNavigate();
  const [dropdownOpen, setdropdownOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const { language, toggleLanguage } = useLanguage();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await getAdminUnreadCount();
      setUnreadCount(res.data.unreadCount);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminNotifications(1, 10);
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.pagination.total);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUnreadCount();
    }, 0);
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!notifOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  const handleBellClick = () => {
    const willOpen = !notifOpen;
    setNotifOpen(willOpen);
    if (willOpen) {
      fetchNotifications();
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await markAdminNotificationAsRead(id);
    } catch {
      // ignore
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: 1 } : n))
    );
  };

  const clearAll = async () => {
    try {
      await clearAllAdminNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch {
      fetchNotifications();
    }
  };

  const [, setSearchInput] = useState<boolean>(false);

  const clearAdminSession = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminRememberMe");
    localStorage.removeItem("adminRefreshToken");
  };

  const handleLogout = async () => {
    if (isNavigating) return;
    setIsNavigating(true);
    setdropdownOpen(false);
    try {
      await adminLogoutApi();
    } catch (error) {
      console.warn("Admin logout API failed:", error);
    } finally {
      clearAdminSession();
      navigate("/login", { replace: true });
    }
  };

  const adminUser = useMemo(() => {
    try {
      const stored = localStorage.getItem("adminUser");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  }, []);

  const userName = adminUser?.name || "Admin";
  const userImage = adminUser?.image || UserImg;

  return (
    <>
      <header className="sticky top-0 z-50 px-4 2xl:px-6 py-2 flex sm:items-center items-start justify-between 2xl:gap-6 xl:gap-3 gap-2 border-b border-[#E7D2D2] sm:min-h-auto min-h-24">
        <div className="flex sm:flex-row flex-col gap-2">
          <button
            className="lg:hidden transition-colors sm:py-0 py-2 cursor-pointer"
            onClick={() => setOpen((prev: boolean) => !prev)}
          >
            <img src={MenuIcon} alt="menu" className="w-5 h-5 rtl:-scale-x-100" />
          </button>

          <div className="sm:relative absolute sm:top-[unset] top-12">
            <Text variant="textBase" className="text-black font-bold !text-xs">Hi, Good Morning!</Text>
            <Heading variant="h2" className="text-base/tight sm:text-lg/tight xl:text-xl/tight 2xl:text-2xl/tight font-bold">
              <span className="text-primary">My Dashboard</span>{" "}
              <span className="text-black">Insights</span>
            </Heading>
          </div>
        </div>

        {/* Search */}
        <div className="ms-auto hidden md:flex items-center gap-2 bg-white border border-[#364B9B66] rounded-full px-3.5 xl:py-2 py-1.5 w-full max-w-60 xl:max-w-72 2xl:max-w-80">
          <svg className="xl:w-4.5 w-4 xl:h-4.5 h-4" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_7194_77749)">
              <path d="M14.582 14.583L18.332 18.333" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16.668 9.16699C16.668 5.02486 13.3101 1.66699 9.16797 1.66699C5.02584 1.66699 1.66797 5.02486 1.66797 9.16699C1.66797 13.3092 5.02584 16.667 9.16797 16.667C13.3101 16.667 16.668 13.3092 16.668 9.16699Z" stroke="#0A2240" strokeWidth="1.5" strokeLinejoin="round" />
            </g>
          </svg>
          <input
            className="bg-transparent text-[13px] text-secondary/60 placeholder-secondary/60 outline-none w-full"
            placeholder="Search for Events, Participants & more..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center xl:gap-3 sm:gap-2 gap-1">
          <button
            onClick={toggleLanguage}
            className="flex items-center xl:gap-1.5 gap-1 text-sm font-bold text-primary py-1.5 transition-colors cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.02231 16.9777C7.07674 18.6978 7.26397 19.7529 7.90796 20.5376C8.07418 20.7401 8.25989 20.9258 8.46243 21.092C9.56878 22 11.2125 22 14.5 22C17.7875 22 19.4312 22 20.5376 21.092C20.7401 20.9258 20.9258 20.7401 21.092 20.5376C22 19.4312 22 17.7875 22 14.5C22 11.2125 22 9.56878 21.092 8.46243C20.9258 8.25989 20.7401 8.07418 20.5376 7.90796C19.7563 7.26676 18.707 7.07837 17 7.02303M7.02231 16.9777C5.30217 16.9233 4.24713 16.736 3.46243 16.092C3.25989 15.9258 3.07418 15.7401 2.90796 15.5376C2 14.4312 2 12.7875 2 9.5C2 6.21252 2 4.56878 2.90796 3.46243C3.07418 3.25989 3.25989 3.07418 3.46243 2.90796C4.56878 2 6.21252 2 9.5 2C12.7875 2 14.4312 2 15.5376 2.90796C15.7401 3.07418 15.9258 3.25989 16.092 3.46243C16.736 4.24713 16.9233 5.30217 16.9777 7.02231C16.9777 7.02231 16.9777 7.02231 17 7.02303M7.02231 16.9777L17 7.02303"
                stroke="#161616" strokeWidth="1.5" />
            </svg>
            <span className="hidden sm:flex">{language === "ar" ? "عر" : "En"}</span>
          </button>

          <div className="flex items-center xl:gap-2 gap-1">
            {/* Mobile search icon */}
            <button onClick={() => setSearchInput(true)} className="group cursor-pointer xl:w-10 sm:w-9 w-8 xl:h-10 sm:h-9 h-8 md:hidden flex items-center justify-center p-1.5 rounded-full md:border-2 border border-light-blue hover:bg-light-blue transition-colors">
              <svg className="w-4 h-4" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.582 14.583L18.332 18.333" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16.668 9.16699C16.668 5.02486 13.3101 1.66699 9.16797 1.66699C5.02584 1.66699 1.66797 5.02486 1.66797 9.16699C1.66797 13.3092 5.02584 16.667 9.16797 16.667C13.3101 16.667 16.668 13.3092 16.668 9.16699Z" stroke="#0A2240" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Notification */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={handleBellClick}
                className="relative group cursor-pointer xl:w-10 sm:w-9 w-8 xl:h-10 sm:h-9 h-8 flex items-center justify-center p-1.5 rounded-full md:border-2 border border-light-blue hover:bg-light-blue transition-colors"
              >
                <svg className="w-4 h-4" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.10697 11.9953C1.92976 13.1229 2.72203 13.9055 3.69207 14.2955C7.41104 15.7908 12.5864 15.7908 16.3053 14.2955C17.2754 13.9055 18.0676 13.1229 17.8904 11.9953C17.7815 11.3024 17.243 10.7254 16.844 10.162C16.3214 9.41491 16.2695 8.60008 16.2694 7.73317C16.2694 4.38291 13.4619 1.66699 9.9987 1.66699C6.53547 1.66699 3.72797 4.38291 3.72797 7.73317C3.72789 8.60008 3.67597 9.41491 3.15337 10.162C2.7544 10.7254 2.21587 11.3024 2.10697 11.9953Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-white" />
                  <path d="M7.5 17.5C8.16344 18.0183 9.03958 18.3333 10 18.3333C10.9604 18.3333 11.8366 18.0183 12.5 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-white" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -end-0.5 w-4 h-4 flex items-center justify-center text-[8px] font-bold text-white bg-red-500 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notifOpen && (
                <div className="absolute end-0 mt-2 w-72 bg-white border border-[#364B9B66] rounded-xl shadow-lg z-30 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-gray-100">
                    <Text variant="textBase" className="font-bold text-secondary text-sm">Notifications</Text>
                    {notifications.length > 0 && (
                      <button onClick={clearAll} className="text-[11px] font-medium text-red-500 hover:text-red-700 transition-colors cursor-pointer">
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    {loading ? (
                      <p className="text-center text-xs text-gray-400 py-6">Loading...</p>
                    ) : notifications.length === 0 ? (
                      <p className="text-center text-xs text-gray-400 py-6">No notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markAsRead(n.id)}
                          className={`flex items-start gap-2.5 px-3.5 py-2.5 cursor-pointer transition-colors hover:bg-gray-50 ${n.isRead ? "opacity-60" : ""}`}
                        >
                          <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${n.isRead ? "bg-gray-300" : "bg-primary"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-secondary truncate">{n.title}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[9px] text-gray-400 mt-1">{formatNotificationTime(n.createdAt)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="border-t border-gray-100">
                      <Link
                        to="/notifications"
                        onClick={() => setNotifOpen(false)}
                        className="block w-full text-center text-xs font-medium text-primary py-2.5 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        View All
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="relative w-max" ref={dropdownRef}>
            {/* Toggle Button */}
            <button
              type="button"
              onClick={() => setdropdownOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
              className="text-slate-900 text-sm font-semibold flex items-center md:gap-2 gap-1 cursor-pointer transition-colors focus:outline-none"
            >
              <span className="xl:min-w-10 xl:w-10 sm:min-w-9 sm:w-9 min-w-8 w-8 xl:h-10 sm:h-9 h-8 rounded-full bg-primary p-0.5">
                <img src={userImage} className="rounded-full shrink-0 aspect-[1/1]" alt="profile avatar" />
                {/* image */}
              </span>

              <div className="md:flex hidden flex-col">
                <Heading variant="h4" className="truncate max-w-[15ch] !text-sm">{userName}</Heading>
              </div>

              {/* Chevron — rotates when open */}
              <svg
                width="10" height="6" viewBox="0 0 12 7" fill="none"
                className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : "rotate-0"}`}
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.8984 0.900432C10.8984 0.900432 7.21602 5.90039 5.89844 5.90039C4.58077 5.90039 0.898438 0.900391 0.898438 0.900391"
                  stroke="#141B34" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <ul className="absolute end-0 mt-2 p-2 max-w-50 min-w-44 w-full text-slate-800 text-sm font-medium bg-white border border-[#364B9B66] rounded-lg z-20 overflow-hidden">
                {/* My Profile */}
                <li>
                  <Link
                    to="/profile"
                    onClick={() => setdropdownOpen(false)}
                    className="w-full p-2 flex items-center gap-2 rounded-md cursor-pointer transition-colors hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="size-4.5 fill-current overflow-visible" viewBox="0 0 512 512">
                      <path d="M253.414 103.434c48.556 0 87.919 40.52 87.919 90.505s-39.363 90.505-87.919 90.505-87.919-40.521-87.919-90.505 39.363-90.505 87.919-90.505m0 36.202c-28.324 0-51.717 24.081-51.717 54.303s23.393 54.303 51.717 54.303 51.717-24.081 51.717-54.303-23.393-54.303-51.717-54.303" />
                      <path d="M253.414 0c139.957 0 253.414 113.457 253.414 253.414 0 94.285-51.491 176.544-127.886 220.19-35.728 20.575-77.036 32.582-121.104 33.199l-4.423.025C113.457 506.828 0 393.371 0 253.414S113.457 0 253.414 0m-23.676 346.505c-46.331 0-87.479 29.378-102.607 73.008l-2.339 7.571c35.919 27.232 80.165 42.893 126.504 43.522l5.709-.009c38.24-.62 74.079-11.122 105.072-29.064l19.977-13.243-2.237-6.866c-14.371-44.046-55.062-74.052-101.239-74.901zm23.676-310.303c-119.963 0-217.212 97.249-217.212 217.212 0 57.493 22.337 109.77 58.807 148.624 21.668-55.072 74.965-91.735 134.73-91.735h46.831c59.905 0 113.311 36.835 134.885 92.121 36.686-38.892 59.172-91.325 59.172-149.01-.001-119.963-97.25-217.212-217.213-217.212" />
                    </svg>
                    My Profile
                  </Link>
                </li>

                {/* Divider */}
                <div className="my-1 border-t border-gray-100" />

                {/* Logout */}
                <li>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isNavigating}
                    className="w-full p-2 flex items-center gap-2 rounded-md cursor-pointer transition-colors text-red-600 hover:text-red-700 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="size-4.5 fill-current overflow-visible" viewBox="0 0 512 512">
                      <path d="M160 416H96c-17.67 0-32-14.33-32-32V128c0-17.67 14.33-32 32-32h64c17.67 0 32-14.33 32-32S177.7 32 160 32H96C42.98 32 0 74.98 0 128v256c0 53.02 42.98 96 96 96h64c17.67 0 32-14.33 32-32S177.7 416 160 416zM502.6 233.4l-128-128c-12.51-12.51-32.76-12.49-45.25 0c-12.5 12.5-12.5 32.75 0 45.25L402.8 224H192C174.3 224 160 238.3 160 256s14.31 32 32 32h210.8l-73.38 73.38c-12.5 12.5-12.5 32.75 0 45.25s32.75 12.5 45.25 0l128-128C515.1 266.1 515.1 245.9 502.6 233.4z" />
                    </svg>
                    {isNavigating ? "Logging out..." : "Logout"}
                  </button>
                </li>

              </ul>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
export default Topbar;

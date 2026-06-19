import { apiRequest } from "./request";

export async function getAdminNotifications(page = 1, limit = 10, type: 'unread' | 'all' = 'unread') {
  return apiRequest({
    url: "/api/notifications",
    method: "GET",
    body: { page, limit, type },
  });
}

export async function clearAllAdminNotifications() {
  return apiRequest({
    url: "/api/clear-all-notification",
    method: "PUT",
  });
}

export async function markAdminNotificationAsRead(id: number) {
  return apiRequest({
    url: `/api/mark-as-read/${id}`,
    method: "PUT",
  });
}

export async function getAdminUnreadCount() {
  return apiRequest({
    url: "/api/unread-count",
    method: "GET",
  });
}

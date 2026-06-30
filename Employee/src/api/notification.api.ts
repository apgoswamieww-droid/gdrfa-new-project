import { apiRequest } from "./request";

export async function getNotifications(page = 1, limit = 10) {
  return apiRequest({
    url: `/notifications?page=${page}&limit=${limit}`,
    method: "GET",
  });
}

export async function clearNotification(id: number) {
  return apiRequest({
    url: `/clear-notification/${id}`,
    method: "GET",
  });
}

export async function clearAllNotifications() {
  return apiRequest({
    url: "/clear-all-notification",
    method: "PUT",
  });
}

export async function markAsRead(id: number) {
  return apiRequest({
    url: `/mark-as-read/${id}`,
    method: "PUT",
  });
}

export async function getUnreadCount() {
  return apiRequest({
    url: "/unread-count",
    method: "GET",
  });
}

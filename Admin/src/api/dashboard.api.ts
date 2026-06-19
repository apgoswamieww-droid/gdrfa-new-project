import { apiRequest } from "./request";


// ─── API Functions ───────────────────────────────────────────────────────
export function getDashboardStatsApi() {
  return apiRequest({
    url: "/admin/dashboard/stats",
    method: "GET",
  });
}

export function getDashboardEventsApi() {
  return apiRequest({
    url: "/admin/dashboard/events",
    method: "GET",
  });
}

export function getDashboardParticipantsApi() {
  return apiRequest({
    url: "/admin/dashboard/participants",
    method: "GET",
  });
}

export function getDashboardProfileApi() {
  return apiRequest({
    url: "/admin/dashboard/profile",
    method: "GET",
  });
}

export function getDashboardDataApi() {
  return apiRequest({
    url: "/admin/dashboard",
    method: "GET",
  });
}

export function getDashboardLatestEventsApi() {
  return apiRequest({
    url: "/admin/dashboard/latest-events",
    method: "GET",
  });
}

export function getDashboardLatestParticipantsApi() {
  return apiRequest({
    url: "/admin/dashboard/latest-participants",
    method: "GET",
  });
}

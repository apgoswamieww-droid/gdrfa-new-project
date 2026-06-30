import { apiRequest } from "./request";

export function getEventTypesApi(params?: {
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
}) {
  return apiRequest({
    url: "/admin/event-types",
    method: "GET",
    body: params,
  });
}

export function createEventTypeApi(body: any) {
  return apiRequest({
    url: "/admin/event-types",
    method: "POST",
    body,
  });
}

export function updateEventTypeApi(id: number, body: any) {
  return apiRequest({
    url: `/admin/event-types/${id}`,
    method: "PUT",
    body,
  });
}

export function deleteEventTypeApi(id: number) {
  return apiRequest({
    url: `/admin/event-types/${id}`,
    method: "DELETE",
  });
}

export function changeEventTypeStatusApi(id: number, status: "1" | "0") {
  return apiRequest({
    url: `/admin/change-status?id=${id}&model=ActivityType&status=${status}`,
    method: "GET",
  });
}

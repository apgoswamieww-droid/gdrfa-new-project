import { apiRequest } from "./request";

export interface EventActivity {
  id: number;
  name: string;
  activityType: number;
  isTeam: string;
  image?: string;
  status: "1" | "0";
  createdAt: string;
  updatedAt: string;
  activityTypeName?: string;
}

export interface EventActivityPayload {
  name: string;
  activityType: number;
  isTeam?: string;
  status?: "1" | "0";
}

export function getEventActivitiesApi(params?: {
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
}) {
  return apiRequest({
    url: "/admin/event-activities",
    method: "GET",
    body: params,
  });
}

export function getActivityTypesForSelectApi() {
  return apiRequest({
    url: "/admin/event-activities/activity-types",
    method: "GET",
  }).then(res => {
    // res is ApiResponse<{ id: number; name: string }[]>
    // res.data is the array
    return res.data || [];
  });
}

export function createEventActivityApi(body: EventActivityPayload) {
  return apiRequest({
    url: "/admin/event-activities",
    method: "POST",
    body,
  });
}

export function updateEventActivityApi(id: number, body: Partial<EventActivityPayload>) {
  return apiRequest({
    url: `/admin/event-activities/${id}`,
    method: "PUT",
    body,
  });
}

export function deleteEventActivityApi(id: number) {
  return apiRequest({
    url: `/admin/event-activities/${id}`,
    method: "DELETE",
  });
}

export function changeEventActivityStatusApi(id: number, status: "1" | "0") {
  return apiRequest({
    url: `/admin/change-status?id=${id}&model=SportActivity&status=${status}`,
    method: "GET",
  });
}

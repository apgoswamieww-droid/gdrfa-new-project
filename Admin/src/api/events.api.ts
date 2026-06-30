import { apiRequest } from "./request";

export function getEventsApi(params?: {
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
}) {
  return apiRequest({
    url: "/admin/events",
    method: "GET",
    body: params,
  });
}

export function getEventByIdApi(id: number) {
  return apiRequest({
    url: `/admin/events/${id}`,
    method: "GET",
  });
}

export function createEventApi(body: any) {
  return apiRequest({
    url: "/admin/events",
    method: "POST",
    body,
  });
}

export function updateEventApi(id: number, body: any) {
  return apiRequest({
    url: `/admin/events/${id}`,
    method: "PUT",
    body,
  });
}

export function createEventWithImageApi(formData: FormData) {
  return apiRequest({
    url: "/admin/events",
    method: "POST",
    body: formData,
  });
}

export function updateEventWithImageApi(id: number, formData: FormData) {
  return apiRequest({
    url: `/admin/events/${id}`,
    method: "PUT",
    body: formData,
  });
}

export function deleteEventApi(id: number) {
  return apiRequest({
    url: `/admin/events/${id}`,
    method: "DELETE",
  });
}

export function changeEventStatusApi(id: number, status: "1" | "0") {
  return apiRequest({
    url: `/admin/change-status?id=${id}&model=Event&status=${status}`,
    method: "GET",
  });
}

export function getYearsApi() {
  return apiRequest({
    url: "/admin/years",
    method: "GET",
  });
}

export function getEventCoordinatorsApi() {
  return apiRequest({
    url: "/admin/event-coordinators",
    method: "GET",
  });
}

export function getSportActivitiesApi() {
  return apiRequest({
    url: "/admin/sport-activities",
    method: "GET",
  });
}

export function getTeamsApi() {
  return apiRequest({
    url: "/admin/teams-dropdown",
    method: "GET",
  });
}

export function getEventActivitiesApi(eventId: number) {
  return apiRequest({
    url: `/admin/events/${eventId}/activities`,
    method: "GET",
  });
}

export function updateEventActivitiesApi(eventId: number, body: Record<string, any>) {
  return apiRequest({
    url: `/admin/events/${eventId}/activities`,
    method: "PUT",
    body,
  });
}

export function getEventParticipantsApi(eventId: number, activityId: number, eventType: string) {
  return apiRequest({
    url: "/admin/events/get-participants",
    method: "POST",
    body: { eventId, activityId, eventType },
  });
}

export function markActivityCompleteApi(eventId: number, activityId: number) {
  return apiRequest({
    url: "/admin/events/mark-activity-complete",
    method: "POST",
    body: { eventId, activityId },
  });
}

export function markEventAsCompleteApi(
  eventId: number,
  activityId: number,
  payload: { user_ids?: string[]; winner_team?: string }
) {
  return apiRequest({
    url: "/admin/events/mark-complete",
    method: "POST",
    body: { eventId, activityId, ...payload },
  });
}

export function getEventWinnersApi(eventId: number) {
  return apiRequest({
    url: `/admin/events/${eventId}/winners`,
    method: "GET",
  });
}

export function updateEventStatusApi(id: number, eventStatus: "0" | "1" | "2") {
  return apiRequest({
    url: `/admin/events/${id}/event-status`,
    method: "PUT",
    body: { eventStatus },
  });
}

import { apiRequest } from "./request";

export function getContactsApi(params?: { start?: number; length?: number; search?: string }) {
  return apiRequest({
    url: "/admin/contacts",
    method: "GET",
    body: params,
  });
}

export function getContactApi(id: number) {
  return apiRequest({
    url: `/admin/contacts/${id}`,
    method: "GET",
  });
}

export function deleteContactApi(id: number) {
  return apiRequest({
    url: `/admin/contacts/${id}`,
    method: "DELETE",
  });
}

import { apiRequest } from "./request";

export function getSponsorsApi(params?: { start?: number; length?: number; search?: string }) {
  return apiRequest({
    url: "/admin/sponsors",
    method: "GET",
    body: params,
  });
}

export function createSponsorApi(formData: FormData) {
  return apiRequest({
    url: "/admin/sponsors",
    method: "POST",
    body: formData,
  });
}

export function updateSponsorApi(id: number, formData: FormData) {
  return apiRequest({
    url: `/admin/sponsors/${id}`,
    method: "PUT",
    body: formData,
  });
}

export function deleteSponsorApi(id: number) {
  return apiRequest({
    url: `/admin/sponsors/${id}`,
    method: "DELETE",
  });
}

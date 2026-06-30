import { apiRequest } from "./request";


export function getGlimpsesApi(params?: { start?: number; length?: number; search?: string }) {
  return apiRequest({
    url: "/admin/glimpse-of-sports",
    method: "GET",
    body: params,
  });
}

export function createGlimpseApi(formData: FormData) {
  return apiRequest({
    url: "/admin/glimpse-of-sports",
    method: "POST",
    body: formData,
  });
}

export function updateGlimpseApi(id: number, formData: FormData) {
  return apiRequest({
    url: `/admin/glimpse-of-sports/${id}`,
    method: "PUT",
    body: formData,
  });
}

export function deleteGlimpseApi(id: number) {
  return apiRequest({
    url: `/admin/glimpse-of-sports/${id}`,
    method: "DELETE",
  });
}

import { apiRequest } from "./request";
export function getMediaListApi(params?: { start?: number; length?: number; search?: string }) {
  return apiRequest({
    url: "/admin/media",
    method: "GET",
    body: params,
  });
}

export function getMediaApi(id: number) {
  return apiRequest({
    url: `/admin/media/${id}`,
    method: "GET",
  });
}

export function createMediaApi(formData: FormData) {
  return apiRequest({
    url: "/admin/media",
    method: "POST",
    body: formData,
  });
}

export function updateMediaApi(id: number, formData: FormData) {
  return apiRequest({
    url: `/admin/media/${id}`,
    method: "PUT",
    body: formData,
  });
}

export function deleteMediaApi(id: number) {
  return apiRequest({
    url: `/admin/media/${id}`,
    method: "DELETE",
  });
}

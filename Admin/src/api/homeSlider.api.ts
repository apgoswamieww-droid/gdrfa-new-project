import { apiRequest } from "./request";


export function getHomeSlidersApi(params?: { start?: number; length?: number; search?: string }) {
  return apiRequest({
    url: "/admin/home-sliders",
    method: "GET",
    body: params,
  });
}

export function createHomeSliderApi(formData: FormData) {
  return apiRequest({
    url: "/admin/home-sliders",
    method: "POST",
    body: formData,
  });
}

export function updateHomeSliderApi(id: number, formData: FormData) {
  return apiRequest({
    url: `/admin/home-sliders/${id}`,
    method: "PUT",
    body: formData,
  });
}

export function deleteHomeSliderApi(id: number) {
  return apiRequest({
    url: `/admin/home-sliders/${id}`,
    method: "DELETE",
  });
}

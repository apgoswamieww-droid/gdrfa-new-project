import { apiRequest } from "./request";

export function getSocialLinksApi(params?: { start?: number; length?: number; search?: string }) {
  return apiRequest({
    url: "/admin/social-links",
    method: "GET",
    body: params,
  });
}

export function createSocialLinkApi(formData: FormData) {
  return apiRequest({
    url: "/admin/social-links",
    method: "POST",
    body: formData,
  });
}

export function updateSocialLinkApi(id: number, formData: FormData) {
  return apiRequest({
    url: `/admin/social-links/${id}`,
    method: "PUT",
    body: formData,
  });
}

export function deleteSocialLinkApi(id: number) {
  return apiRequest({
    url: `/admin/social-links/${id}`,
    method: "DELETE",
  });
}

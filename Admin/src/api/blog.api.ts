import { apiRequest } from "./request";

export function getBlogsApi(params?: { start?: number; length?: number; search?: string }) {
  return apiRequest({
    url: "/admin/blogs",
    method: "GET",
    body: params,
  });
}

export function getBlogApi(id: number) {
  return apiRequest({
    url: `/admin/blogs/${id}`,
    method: "GET",
  });
}

export function createBlogApi(formData: FormData) {
  return apiRequest({
    url: "/admin/blogs",
    method: "POST",
    body: formData,
  });
}

export function updateBlogApi(id: number, formData: FormData) {
  return apiRequest({
    url: `/admin/blogs/${id}`,
    method: "PUT",
    body: formData,
  });
}

export function deleteBlogApi(id: number) {
  return apiRequest({
    url: `/admin/blogs/${id}`,
    method: "DELETE",
  });
}

export function getTagsListApi() {
  return apiRequest({
    url: "/admin/tags",
    method: "GET",
  });
}

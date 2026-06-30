import { apiRequest } from "./request";
import { useAuthStore } from "../store/store";

export async function getSponsors() {
  return apiRequest({
    url: "/sponsors",
    method: "GET",
  });
}


export async function getHomeSliders() {
  return apiRequest({
    url: "/home-slider",
    method: "GET",
  });
}

export async function getHomeEvents(year?: string) {
  return apiRequest({
    url: `/home-event${year ? `?year=${year}` : ""}`,
    method: "GET",
  });
}

export async function getMyEvents() {
  return apiRequest({
    url: "/user/events",
    method: "GET",
  });
}

export async function getSportEvents(type?: string, category?: string, page = 1, limit = 12) {
  let url = `/sport-events?page=${page}&limit=${limit}`;
  if (type && type !== "all") url += `&type=${type}`;
  if (category && category !== "All") url += `&category=${category}`;

  return apiRequest({
    url: url,
    method: "GET",
  });
}

export async function getEventById(id: string | number) {
  return apiRequest({
    url: `/event/${id}`,
    method: "GET",
  });
}


export async function postParticipant(data: any) {
  return apiRequest({
    url: "/participant",
    method: "POST",
    body: data,
  });
}

export async function getCertificates() {
  return apiRequest({
    url: "/certificates",
    method: "GET",
  });
}

export async function getFacilities() {
  return apiRequest({
    url: "/facilities",
    method: "GET",
  });
}

export async function createFacilityRequest(data: any) {
  return apiRequest({
    url: "/facility-request",
    method: "POST",
    body: data,
  });
}

export async function getBookedTimes(facilityId: number) {
  return apiRequest({
    url: `/facility-requests/${facilityId}`,
    method: "GET",
  });
}

export type MyFacilityRequest = {
  id: number;
  facility_id: number;
  facilityName: string;
  name: string;
  email: string;
  date: string;
  time_slot: string | null;
  description: string;
  status: string;
  createdAt: string;
};

export async function getMyFacilityRequests() {
  return apiRequest({
    url: "/my-facility-requests",
    method: "GET",
  });
}

export type BlogPost = {
  id: number;
  title: string;
  description: string;
  shortDescription: string;
  media: string | null;
  mediaType: "image" | "video";
  isVideo: boolean;
  videoSrc: string | null;
  tags: { id: number; name: string }[];
  readingTime: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export async function getAllBlogs(page = 1, limit = 10) {
  return apiRequest({
    url: `/blog-list?page=${page}&limit=${limit}`,
    method: "GET",
  });
}

export async function getBlogById(id: string | number) {
  return apiRequest({
    url: `/blog/${id}`,
    method: "GET",
  });
}

export async function getAllMedia(page = 1, limit = 10) {
  return apiRequest({
    url: `/media-list?page=${page}&limit=${limit}`,
    method: "GET",
  });
}

export async function getMediaById(id: string | number) {
  return apiRequest({
    url: `/media/${id}`,
    method: "GET",
  });
}

export async function submitContact(data: any) {
  return apiRequest({
    url: "/contact-us",
    method: "POST",
    body: data,
  });
}

export async function getFaqs() {
  return apiRequest({
    url: "/faq",
    method: "GET",
  });
}

export async function getGlimpses() {
  return apiRequest({
    url: "/glimpse-of-sports",
    method: "GET",
  });
}

export async function getPageBySlug(slug: string) {
  return apiRequest({
    url: `/cms/${slug}`,
    method: "GET",
  });
}

export async function getFitnessCategory(filter?: string, month?: string, year?: string) {
  let url = "/fitness-category";
  const params = new URLSearchParams();
  if (filter) params.set("filter", filter);
  if (month) params.set("month", month);
  if (year) params.set("year", year);
  const qs = params.toString();
  if (qs) url += `?${qs}`;

  return apiRequest({
    url,
    method: "GET",
  });
}

export async function uploadProfileImage(formData: FormData) {
  return apiRequest({
    url: "/upload-profile-image",
    method: "POST",
    body: formData,
  });
}

export async function getMyApprovalHistory(participantId: number) {
  return apiRequest({
    url: `/user/participant-approval-history/${participantId}`,
    method: "GET",
  });
}

export async function getMyFitnessEvaluations(page = 1, limit = 50) {
  return apiRequest({
    url: `/evaluation?page=${page}&limit=${limit}`,
    method: "GET",
  });
}

export async function getProfileImage() {
  return apiRequest({
    url: "/profile-image",
    method: "GET",
  });
}

export async function downloadCertificatePdf(certId: number) {
  return downloadCertificate(certId, "pdf");
}

export async function downloadCertificateImage(certId: number) {
  return downloadCertificate(certId, "png");
}

async function downloadCertificate(certId: number, format: "pdf" | "png") {
  const state = useAuthStore.getState();
  const token = state.accessToken || state.token;
  const baseUrl = (import.meta.env.VITE_BASE_URL || "https://localhost:3000/api").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/certificates/${certId}/download?format=${format}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Download failed");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `certificate-${certId}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

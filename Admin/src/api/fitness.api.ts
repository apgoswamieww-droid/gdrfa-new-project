import { apiRequest } from "./request";

// ======================================================================
// FITNESS CATEGORIES
// ======================================================================

export const getFitnessCategoriesApi = async (params?: {
  start?: number;
  length?: number;
  search?: string;
}): Promise<any> => {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        queryParams.append(key, String(value));
      }
    });
  }
  return apiRequest({
    url: `/admin/fitness-categories?${queryParams.toString()}`,
    method: "GET",
  });
};

export const getFitnessCategoryByIdApi = async (id: string | number): Promise<any> => {
  return apiRequest({
    url: `/admin/fitness-categories/${id}`,
    method: "GET",
  });
};

export const createFitnessCategoryApi = async (data: { name: string; slug: string; unit_type: string }): Promise<any> => {
  return apiRequest({
    url: "/admin/fitness-categories",
    method: "POST",
    body: data,
  });
};

export const updateFitnessCategoryApi = async (id: number, data: any): Promise<any> => {
  return apiRequest({
    url: `/admin/fitness-categories/${id}`,
    method: "PUT",
    body: data,
  });
};

export const deleteFitnessCategoryApi = async (id: number): Promise<any> => {
  return apiRequest({
    url: `/admin/fitness-categories/${id}`,
    method: "DELETE",
  });
};

export const toggleFitnessCategoryStatusApi = async (id: number, status: string): Promise<any> => {
  return apiRequest({
    url: `/admin/fitness-categories/${id}/status`,
    method: "PUT",
    body: { status },
  });
};

// ======================================================================
// AGE GROUPS
// ======================================================================

export const getAgeGroupsApi = async (params?: { search?: string }): Promise<any> => {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.set("search", params.search);
  return apiRequest({
    url: `/admin/fitness-age-groups?${queryParams.toString()}`,
    method: "GET",
  });
};

export const getAgeGroupByIdApi = async (id: number): Promise<any> => {
  return apiRequest({
    url: `/admin/fitness-age-groups/${id}`,
    method: "GET",
  });
};

export const createAgeGroupApi = async (data: { age_from: number; age_to: number; group_name?: string }): Promise<any> => {
  return apiRequest({
    url: "/admin/fitness-age-groups",
    method: "POST",
    body: data,
  });
};

export const updateAgeGroupApi = async (id: number, data: any): Promise<any> => {
  return apiRequest({
    url: `/admin/fitness-age-groups/${id}`,
    method: "PUT",
    body: data,
  });
};

export const deleteAgeGroupApi = async (id: number): Promise<any> => {
  return apiRequest({
    url: `/admin/fitness-age-groups/${id}`,
    method: "DELETE",
  });
};

// ======================================================================
// SCORE MATRIX
// ======================================================================

export const getScoreMatrixApi = async (params?: {
  page?: number;
  limit?: number;
  category_id?: number;
  gender?: string;
  age_group_id?: number;
  score?: number;
}): Promise<any> => {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        queryParams.append(key, String(value));
      }
    });
  }
  return apiRequest({
    url: `/admin/fitness-score-matrix?${queryParams.toString()}`,
    method: "GET",
  });
};

export const createScoreMatrixApi = async (data: {
  category_id: number;
  gender: string;
  age_group_id: number;
  score: number;
  min_value: string;
  max_value: string;
}): Promise<any> => {
  return apiRequest({
    url: "/admin/fitness-score-matrix",
    method: "POST",
    body: data,
  });
};

export const updateScoreMatrixApi = async (id: number, data: any): Promise<any> => {
  return apiRequest({
    url: `/admin/fitness-score-matrix/${id}`,
    method: "PUT",
    body: data,
  });
};

export const deleteScoreMatrixApi = async (id: number): Promise<any> => {
  return apiRequest({
    url: `/admin/fitness-score-matrix/${id}`,
    method: "DELETE",
  });
};

export const bulkImportScoreMatrixApi = async (entries: any[]): Promise<any> => {
  return apiRequest({
    url: "/admin/fitness-score-matrix/bulk-import",
    method: "POST",
    body: { entries },
  });
};

// ======================================================================
// FITNESS TEST
// ======================================================================

export const storeFitnessTestApi = async (data: {
  user_id: string;
  pushups?: number;
  situps?: number;
  running_time?: string;
  gender?: string;
  dob?: string;
  comments?: string;
}): Promise<any> => {
  return apiRequest({
    url: "/admin/fitness-test",
    method: "POST",
    body: data,
  });
};

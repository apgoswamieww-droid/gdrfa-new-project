import { apiRequest } from "./request";

export interface FitnessEvaluationResult {
  id: number;
  evaluation_id: number;
  fitness_category_id: number;
  value: string;
  result: number;
  categoryName?: string;
  slug?: string;
  unit_type?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FitnessEvaluation {
  id: number;
  rank: string | null;
  grp: string | null;
  employee_name: string | null;
  sector: string | null;
  fitness_status: string | null;
  year: number | null;
  total_points: number | null;
  comments?: string | null;
  createdAt: string;
  updatedAt: string;
  results?: FitnessEvaluationResult[];
}

export const getFitnessEvaluationsApi = async (params?: {
  start?: number;
  length?: number;
  search?: string;
  year?: string;
}): Promise<any> => {
  return apiRequest({
    url: "/admin/fitness-evaluations",
    method: "GET",
    body: params,
  });
};

export const getFitnessEvaluationApi = async (id: number): Promise<any> => {
  return apiRequest({
    url: `/admin/fitness-evaluations/${id}`,
    method: "GET",
  });
};

export const storeFitnessEvaluationsApi = async (records: any[]): Promise<any> => {
  return apiRequest({
    url: "/admin/fitness-evaluations",
    method: "POST",
    body: { records },
  });
};

export const updateFitnessEvaluationApi = async (id: number, data: {
  rank?: string;
  grp?: string;
  employee_name?: string;
  sector?: string;
  fitness_status?: string;
  year?: number;
}): Promise<any> => {
  return apiRequest({
    url: `/admin/fitness-evaluations/${id}`,
    method: "PUT",
    body: data,
  });
};

export const deleteFitnessEvaluationApi = async (id: number): Promise<any> => {
  return apiRequest({
    url: `/admin/fitness-evaluations/${id}`,
    method: "DELETE",
  });
};

export const getFitnessEvaluationYearsApi = async (): Promise<any> => {
  return apiRequest({
    url: "/admin/fitness-evaluations-years",
    method: "GET",
  });
};

export const lookupUserByGrpApi = async (id: number): Promise<any> => {
  return apiRequest({
    url: `/admin/fitness-evaluations/${id}/user-lookup`,
    method: "GET",
  });
};

export const updateFitnessEvaluationResultsApi = async (id: number, data: {
  categories?: { id: number; value: string; points?: number }[];
  comments?: string;
  gender?: string;
  dob?: string;
  rank?: string;
  grp?: string;
  employee_name?: string;
  sector?: string;
  fitness_status?: string;
  year?: number;
}): Promise<any> => {
  return apiRequest({
    url: `/admin/fitness-evaluations/${id}`,
    method: "PUT",
    body: data,
  });
};

export const updateEvaluationResultApi = async (id: number, data: {
  value?: string;
  result?: number;
}): Promise<any> => {
  return apiRequest({
    url: `/admin/evaluation-results/${id}`,
    method: "PUT",
    body: data,
  });
};

export const deleteEvaluationResultApi = async (id: number): Promise<any> => {
  return apiRequest({
    url: `/admin/evaluation-results/${id}`,
    method: "DELETE",
  });
};

export const deleteEvaluationSessionApi = async (evaluationId: number, resultIds: number[]): Promise<any> => {
  return apiRequest({
    url: `/admin/fitness-evaluations/${evaluationId}/delete-session`,
    method: "POST",
    body: { resultIds },
  });
};

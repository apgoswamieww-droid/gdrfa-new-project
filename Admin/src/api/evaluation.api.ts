import { apiRequest } from "./request";

export interface EvaluationResult {
  id: number;
  evaluation_id: number;
  fitness_category_id: number;
  value: number;
  result: number;
  categoryName?: string;
  slug?: string;
  unit_type?: string;
}

export interface Evaluation {
  id: number;
  user_id: string;
  total_points: number;
  evaluation_points: number;
  evaluator_id: string;
  examiner_name: string;
  comments: string;
  status: string;
  createdAt: string;
  results?: EvaluationResult[];
}

export interface FitnessCategory {
  id: number;
  name: string;
  slug: string;
  unit_type: string;
  unit?: string;
  status: string;
}

export const getFitnessCategoriesApi = async (): Promise<any> => {
  return apiRequest({
    url: "/admin/evaluation/categories",
    method: "GET",
  });
};

export const storeEvaluationApi = async (data: {
  user_id: string;
  categories: { id: number; value: string; points?: number }[];
  comments?: string;
  gender?: string;
  dob?: string;
}): Promise<any> => {
  return apiRequest({
    url: "/admin/evaluation",
    method: "POST",
    body: data,
  });
};

export const getUserEvaluationsApi = async (userId: string): Promise<any> => {
  return apiRequest({
    url: `/admin/evaluation/user/${userId}`,
    method: "GET",
  });
};

export const calculateScoresApi = async (data: {
  gender: string;
  dob: string;
  values: { category_id: number; value: string }[];
}): Promise<any> => {
  return apiRequest({
    url: "/admin/evaluation/calculate-scores",
    method: "POST",
    body: data,
  });
};

export const getEvaluationDetailsApi = async (id: number): Promise<any> => {
  return apiRequest({
    url: `/admin/evaluation/${id}`,
    method: "GET",
  });
};

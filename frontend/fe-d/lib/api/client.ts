const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

interface ApiSuccessResponse<T> { success: true; data: T; message: string | null; }
interface ApiErrorResponse { timestamp: string; status: number; code: string; message: string; path: string; }

export class ApiError extends Error {
  code: string; status: number;
  constructor(errorBody: ApiErrorResponse) {
    super(errorBody.message);
    this.code = errorBody.code;
    this.status = errorBody.status;
  }
}

interface RequestOptions { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown; accessToken?: string; }

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, accessToken } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  const json = await response.json();
  if (!response.ok) throw new ApiError(json as ApiErrorResponse);
  return (json as ApiSuccessResponse<T>).data;
}
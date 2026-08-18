const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL_C ?? "";

export const API_AI_URL = process.env.NEXT_PUBLIC_API_AI_URL ?? "";
export const API_B_URL = process.env.NEXT_PUBLIC_API_B_URL ?? "";

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

interface RequestOptions { 
  method?: "GET" | "POST" | "PATCH" | "DELETE"; 
  body?: unknown; 
  accessToken?: string;
  customBaseUrl?: string; 
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, accessToken, customBaseUrl } = options;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const isFormData = body instanceof FormData;
  
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const baseUrl = customBaseUrl ?? API_BASE_URL;
  const targetUrl = `${baseUrl}${path}`;

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      method, 
      headers, 
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
    });
  } catch (networkError) {
    console.error(`[API 통신 실패] 서버와 연결할 수 없습니다. URL: ${targetUrl}`, networkError);
    throw new ApiError({
      timestamp: new Date().toISOString(),
      status: 503,
      code: "NETWORK_ERROR",
      message: "백엔드 서버와 통신할 수 없습니다. 서버가 켜져 있는지 확인해주세요.",
      path: path,
    });
  }

  const text = await response.text();
  let json: any;

  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    throw new ApiError({
      timestamp: new Date().toISOString(),
      status: response.status,
      code: "NON_JSON_RESPONSE",
      message: `서버에서 올바른 JSON 응답을 반환하지 않았습니다. (상태 코드: ${response.status})`,
      path: path,
    });
  }

  if (!response.ok) {
    throw new ApiError(json as ApiErrorResponse);
  }

  return (json as ApiSuccessResponse<T>).data;
}
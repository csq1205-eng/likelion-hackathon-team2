import { apiRequest } from "./client";

export interface WithdrawalResponse {
  userId: number;
  status: "WITHDRAWN";
  withdrawalStatus: "COMPLETED";
}

export async function withdrawUser(
  userId: number,
  reason: string,
  accessToken: string
) {
  return apiRequest<WithdrawalResponse>(`/api/v1/users/${userId}`, {
    method: "DELETE",
    body: { reason },
    accessToken,
  });
}
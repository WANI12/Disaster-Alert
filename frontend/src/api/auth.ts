import { apiFetch } from "./client";

export type RegisterResponse = {
  token: string;
  user: { id: number; username: string; email: string };
};

export async function registerUser(payload: {
  username: string;
  email?: string;
  password: string;
}): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>("/auth/register/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type LoginResponse = { token: string };

export async function loginUser(payload: {
  username: string;
  password: string;
}): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/login/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


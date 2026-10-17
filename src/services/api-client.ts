import axios, { isAxiosError } from "axios";

import { notifySessionExpired } from "@/lib/session";

const baseURL = `${process.env.EXPO_PUBLIC_URI}/api/v1`;

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(undefined, (error: unknown) => {
  if (isAxiosError(error) && error.response?.status === 401) {
    notifySessionExpired();
  }
  return Promise.reject(error);
});

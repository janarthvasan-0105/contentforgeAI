import axios from "axios";

import { supabase } from "./supabase";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
});

API.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        supabase.auth.signOut().then(() => {
          window.location.href = "/";
        });
      }
    }
    return Promise.reject(error);
  }
);

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  
  return data;
}

export async function register(username: string, email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;

  return data;
}

export async function generateContent(payload: any) {
  const res = await API.post("/generate", payload);
  return res.data;
}

export async function publishContent(payload: FormData) {
  const res = await API.post("/publish", payload);
  return res.data;
}

export async function logout() {
  await supabase.auth.signOut();
  window.location.href = "/";
}

export async function connectTwitter(payload: any) {
  const res = await API.post("/twitter/connect", payload);
  return res.data;
}

export async function getTwitterStatus(userId: string) {
  const res = await API.get(`/twitter/status/${userId}`);
  return res.data;
}

export async function disconnectTwitter(userId: string) {
  const res = await API.post("/twitter/disconnect", { user_id: userId });
  return res.data;
}

export async function liveCheckTwitter(userId: string) {
  const res = await API.post(`/twitter/live-check/${userId}`);
  return res.data;
}

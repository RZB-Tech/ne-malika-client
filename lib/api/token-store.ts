"use client";

import type { AuthUserDto } from "./generated/schemas";

const TOKEN_KEY = "nemalika.accessToken";
const USER_KEY = "nemalika.user";

let accessToken: string | null = null;
let currentUser: AuthUserDto | null = null;

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

function readStorage() {
  if (typeof window === "undefined") return;
  accessToken = window.localStorage.getItem(TOKEN_KEY);
  const rawUser = window.localStorage.getItem(USER_KEY);
  currentUser = rawUser ? (JSON.parse(rawUser) as AuthUserDto) : null;
}

readStorage();

export function getAccessToken(): string | null {
  return accessToken;
}

export function getCurrentUser(): AuthUserDto | null {
  return currentUser;
}

export function setAuth(token: string | null, user: AuthUserDto | null) {
  accessToken = token;
  currentUser = user;
  if (typeof window !== "undefined") {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
    if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    else window.localStorage.removeItem(USER_KEY);
  }
  emit();
}

/** Update only the access token (e.g. after a silent refresh). */
export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window !== "undefined") {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  }
  emit();
}

export function clearAuth() {
  setAuth(null, null);
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

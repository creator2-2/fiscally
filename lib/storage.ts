import { defaultProfile, type Profile, type Subscription } from "./types";

export const STORAGE_KEYS = {
  profile: "fiscally.profile.v1",
  subscription: "fiscally.subscription.v1",
  wizardComplete: "fiscally.wizardComplete.v1",
} as const;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}

export function loadProfile(): Profile {
  return readJson(STORAGE_KEYS.profile, { ...defaultProfile });
}

export function saveProfile(profile: Profile): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
}

export function loadSubscription(): Subscription {
  return readJson<Subscription>(STORAGE_KEYS.subscription, {
    plan: "free",
    upgradedAt: null,
  });
}

export function saveSubscription(sub: Subscription): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEYS.subscription, JSON.stringify(sub));
}

export function loadWizardComplete(): boolean {
  if (!isBrowser()) return false;
  return window.localStorage.getItem(STORAGE_KEYS.wizardComplete) === "1";
}

export function saveWizardComplete(done: boolean): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEYS.wizardComplete, done ? "1" : "0");
}

export function clearAllFiscallyData(): void {
  if (!isBrowser()) return;
  Object.values(STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key));
}

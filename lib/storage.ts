import type { D212Draft } from "./d212-model";
import { clearDeviceKey, decryptAtRest, encryptAtRest } from "./smartbill/crypto";
import type { ImportSummary, SmartBillCredentials } from "./smartbill/types";
import { defaultProfile, type Profile, type Subscription } from "./types";

export const STORAGE_KEYS = {
  profile: "fiscally.profile.v1",
  subscription: "fiscally.subscription.v1",
  wizardComplete: "fiscally.wizardComplete.v1",
  smartbill: "fiscally.smartbill.creds.v1",
  d212: "fiscally.d212.v1",
  import: "fiscally.import.v1",
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

export function loadD212(): D212Draft | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.d212);
    return raw ? (JSON.parse(raw) as D212Draft) : null;
  } catch {
    return null;
  }
}

export function saveD212(draft: D212Draft | null): void {
  if (!isBrowser()) return;
  if (!draft) {
    window.localStorage.removeItem(STORAGE_KEYS.d212);
    return;
  }
  window.localStorage.setItem(STORAGE_KEYS.d212, JSON.stringify(draft));
}

export function loadImportSummary(): ImportSummary | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.import);
    return raw ? (JSON.parse(raw) as ImportSummary) : null;
  } catch {
    return null;
  }
}

export function saveImportSummary(summary: ImportSummary | null): void {
  if (!isBrowser()) return;
  if (!summary) {
    window.localStorage.removeItem(STORAGE_KEYS.import);
    return;
  }
  window.localStorage.setItem(STORAGE_KEYS.import, JSON.stringify(summary));
}

export async function loadSmartbillCreds(): Promise<SmartBillCredentials | null> {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(STORAGE_KEYS.smartbill);
  if (!raw) return null;
  try {
    return await decryptAtRest<SmartBillCredentials>(raw);
  } catch {
    window.localStorage.removeItem(STORAGE_KEYS.smartbill);
    return null;
  }
}

export async function saveSmartbillCreds(creds: SmartBillCredentials | null): Promise<void> {
  if (!isBrowser()) return;
  if (!creds) {
    window.localStorage.removeItem(STORAGE_KEYS.smartbill);
    return;
  }
  const payload = await encryptAtRest(creds);
  window.localStorage.setItem(STORAGE_KEYS.smartbill, payload);
}

export function clearAllFiscallyData(): void {
  if (!isBrowser()) return;
  Object.values(STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key));
  clearDeviceKey();
}

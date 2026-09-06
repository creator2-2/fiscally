"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearAllFiscallyData,
  loadProfile,
  loadSubscription,
  loadWizardComplete,
  saveProfile,
  saveSubscription,
  saveWizardComplete,
} from "./storage";
import { computeEstimate } from "./tax-engine";
import { defaultProfile, type Profile, type Subscription } from "./types";

interface Store {
  ready: boolean;
  profile: Profile;
  subscription: Subscription;
  wizardComplete: boolean;
  subscribed: boolean;
  updateProfile: (patch: Partial<Profile>) => void;
  replaceProfile: (profile: Profile) => void;
  setWizardComplete: (done: boolean) => void;
  upgrade: () => void;
  downgrade: () => void;
  reset: () => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [subscription, setSubscription] = useState<Subscription>({
    plan: "free",
    upgradedAt: null,
  });
  const [wizardComplete, setWizardCompleteState] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    setSubscription(loadSubscription());
    setWizardCompleteState(loadWizardComplete());
    setReady(true);
  }, []);

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      saveProfile(next);
      return next;
    });
  }, []);

  const replaceProfile = useCallback((next: Profile) => {
    setProfile(next);
    saveProfile(next);
  }, []);

  const setWizardComplete = useCallback((done: boolean) => {
    setWizardCompleteState(done);
    saveWizardComplete(done);
  }, []);

  const upgrade = useCallback(() => {
    const next: Subscription = {
      plan: "paid",
      upgradedAt: new Date().toISOString(),
    };
    setSubscription(next);
    saveSubscription(next);
  }, []);

  const downgrade = useCallback(() => {
    const next: Subscription = { plan: "free", upgradedAt: null };
    setSubscription(next);
    saveSubscription(next);
  }, []);

  const reset = useCallback(() => {
    clearAllFiscallyData();
    setProfile({ ...defaultProfile });
    setSubscription({ plan: "free", upgradedAt: null });
    setWizardCompleteState(false);
  }, []);

  const value = useMemo<Store>(
    () => ({
      ready,
      profile,
      subscription,
      wizardComplete,
      subscribed: subscription.plan === "paid",
      updateProfile,
      replaceProfile,
      setWizardComplete,
      upgrade,
      downgrade,
      reset,
    }),
    [
      ready,
      profile,
      subscription,
      wizardComplete,
      updateProfile,
      replaceProfile,
      setWizardComplete,
      upgrade,
      downgrade,
      reset,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function useEstimate() {
  const { profile } = useStore();
  return computeEstimate(profile);
}

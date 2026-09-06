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
import { draftToProfile, type D212Draft } from "./d212-model";
import { defaultDuFlow, type DuFlowState } from "./du-flow";
import type { ImportSummary, SmartBillCredentials } from "./smartbill/types";
import {
  clearAllFiscallyData,
  loadD212,
  loadDuFlow,
  loadImportSummary,
  loadProfile,
  loadSmartbillCreds,
  loadSubscription,
  loadWizardComplete,
  saveD212,
  saveDuFlow,
  saveImportSummary,
  saveProfile,
  saveSmartbillCreds,
  saveSubscription,
  saveWizardComplete,
} from "./storage";
import { computeCombined, estimateFlow } from "./combined-tax";
import { computeEstimate } from "./tax-engine";
import { defaultProfile, type Profile, type Subscription } from "./types";

interface Store {
  ready: boolean;
  profile: Profile;
  subscription: Subscription;
  wizardComplete: boolean;
  subscribed: boolean;
  smartbill: SmartBillCredentials | null;
  d212: D212Draft | null;
  importSummary: ImportSummary | null;
  duFlow: DuFlowState;
  updateProfile: (patch: Partial<Profile>) => void;
  replaceProfile: (profile: Profile) => void;
  setWizardComplete: (done: boolean) => void;
  setSmartbill: (creds: SmartBillCredentials | null) => Promise<void>;
  setD212: (draft: D212Draft | null) => void;
  setImportSummary: (summary: ImportSummary | null) => void;
  applyD212: (draft: D212Draft) => void;
  setDuFlow: (flow: DuFlowState) => void;
  patchDuFlow: (patch: Partial<DuFlowState>) => void;
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
  const [smartbill, setSmartbillState] = useState<SmartBillCredentials | null>(null);
  const [d212, setD212State] = useState<D212Draft | null>(null);
  const [importSummary, setImportSummaryState] = useState<ImportSummary | null>(null);
  const [duFlow, setDuFlowState] = useState<DuFlowState>(defaultDuFlow());

  useEffect(() => {
    setProfile(loadProfile());
    setSubscription(loadSubscription());
    setWizardCompleteState(loadWizardComplete());
    setD212State(loadD212());
    setImportSummaryState(loadImportSummary());
    setDuFlowState(loadDuFlow());
    void loadSmartbillCreds()
      .then(setSmartbillState)
      .finally(() => setReady(true));
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

  const setSmartbill = useCallback(async (creds: SmartBillCredentials | null) => {
    setSmartbillState(creds);
    await saveSmartbillCreds(creds);
  }, []);

  const setD212 = useCallback((draft: D212Draft | null) => {
    setD212State(draft);
    saveD212(draft);
  }, []);

  const setImportSummary = useCallback((summary: ImportSummary | null) => {
    setImportSummaryState(summary);
    saveImportSummary(summary);
  }, []);

  const setDuFlow = useCallback((flow: DuFlowState) => {
    setDuFlowState(flow);
    saveDuFlow(flow);
  }, []);

  const patchDuFlow = useCallback((patch: Partial<DuFlowState>) => {
    setDuFlowState((prev) => {
      const next = { ...prev, ...patch };
      saveDuFlow(next);
      return next;
    });
  }, []);

  const applyD212 = useCallback((draft: D212Draft) => {
    const saved: D212Draft = { ...draft, savedAt: new Date().toISOString() };
    setD212State(saved);
    saveD212(saved);
    if (draft.importSummary) {
      setImportSummaryState(draft.importSummary);
      saveImportSummary(draft.importSummary);
    }
    setProfile((prev) => {
      const next = draftToProfile(prev, saved);
      saveProfile(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    clearAllFiscallyData();
    setProfile({ ...defaultProfile });
    setSubscription({ plan: "free", upgradedAt: null });
    setWizardCompleteState(false);
    setSmartbillState(null);
    setD212State(null);
    setImportSummaryState(null);
    setDuFlowState(defaultDuFlow());
  }, []);

  const value = useMemo<Store>(
    () => ({
      ready,
      profile,
      subscription,
      wizardComplete,
      subscribed: subscription.plan === "paid",
      smartbill,
      d212,
      importSummary,
      duFlow,
      updateProfile,
      replaceProfile,
      setWizardComplete,
      setSmartbill,
      setD212,
      setImportSummary,
      applyD212,
      setDuFlow,
      patchDuFlow,
      upgrade,
      downgrade,
      reset,
    }),
    [
      ready,
      profile,
      subscription,
      wizardComplete,
      smartbill,
      d212,
      importSummary,
      duFlow,
      updateProfile,
      replaceProfile,
      setWizardComplete,
      setSmartbill,
      setD212,
      setImportSummary,
      applyD212,
      setDuFlow,
      patchDuFlow,
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

export function useCombinedEstimate() {
  const { profile, duFlow } = useStore();
  return computeCombined(profile, estimateFlow(profile, duFlow));
}

"use client";

import { StoreProvider, useStore } from "@/lib/store";
import { UpgradeProvider } from "./UpgradeModal";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <UpgradeProvider>
        <ReadyGate>{children}</ReadyGate>
      </UpgradeProvider>
    </StoreProvider>
  );
}

function ReadyGate({ children }: { children: React.ReactNode }) {
  const { ready } = useStore();
  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center bg-paper text-ink-soft">
        <p className="font-display text-2xl text-ink">Fiscally</p>
      </div>
    );
  }
  return children;
}

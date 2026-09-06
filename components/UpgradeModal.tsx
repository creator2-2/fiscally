"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { PRICE_LEI } from "@/lib/types";
import { useStore } from "@/lib/store";

interface UpgradeCtx {
  openUpgrade: (reason?: string) => void;
}

const Ctx = createContext<UpgradeCtx>({ openUpgrade: () => undefined });

export function useUpgrade() {
  return useContext(Ctx);
}

export function UpgradeProvider({ children }: { children: ReactNode }) {
  const { upgrade, subscribed } = useStore();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(
    "Exporturile PDF și pachetele complete sunt incluse în planul plătit.",
  );

  const openUpgrade = useCallback(
    (nextReason?: string) => {
      if (subscribed) return;
      if (nextReason) setReason(nextReason);
      setOpen(true);
    },
    [subscribed],
  );

  return (
    <Ctx.Provider value={{ openUpgrade }}>
      {children}
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            aria-label="Închide"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-labelledby="upgrade-title"
            className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl shadow-sage-deep/20"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sage">
              Plan Fiscally
            </p>
            <h2 id="upgrade-title" className="mt-2 font-display text-3xl text-ink">
              {PRICE_LEI} lei / lună
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{reason}</p>
            <ul className="mt-5 space-y-2 text-sm text-ink">
              {[
                "PDF situație fiscală",
                "Pachet Declarația unică",
                "Pachet lunar pentru contabil",
                "Contract + factură / proformă",
                "Dosar e-Factura / SPV",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sage" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-2xl bg-mint-soft px-3 py-2 text-xs text-ink-soft">
              Plățile sunt simulate în MVP. Nu se face nicio încasare reală
              (Netopia / Stripe vor veni mai târziu).
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  upgrade();
                  setOpen(false);
                }}
                className="flex-1 rounded-full bg-sage px-4 py-3 text-sm font-semibold text-white hover:bg-sage-deep"
              >
                Activează planul (demo)
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full border border-line px-4 py-3 text-sm font-semibold text-ink hover:bg-paper"
              >
                Mai târziu
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Ctx.Provider>
  );
}

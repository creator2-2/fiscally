import { DU_STEPS, type DuStep } from "@/lib/du-flow";

export function DuProgress({ step, onJump }: { step: DuStep; onJump?: (s: DuStep) => void }) {
  return (
    <ol className="mb-6 grid grid-cols-6 gap-1.5">
      {DU_STEPS.map((item) => {
        const done = item.id < step;
        const active = item.id === step;
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onJump?.(item.id)}
              className="w-full text-left"
            >
              <span
                className={`block h-1.5 rounded-full ${
                  done || active ? "bg-sage" : "bg-line"
                }`}
              />
              <span
                className={`mt-1.5 hidden text-[11px] font-medium sm:block ${
                  active ? "text-sage-deep" : "text-ink-soft"
                }`}
              >
                {item.id}. {item.short}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

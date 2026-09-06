export function Disclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-xs leading-relaxed text-ink-soft">
        Instrument de lucru, nu sfat fiscal sau juridic. Estimările sunt
        orientative. Fiscally nu depune declarații la ANAF.
      </p>
    );
  }

  return (
    <aside className="rounded-2xl border border-line bg-mint-soft/70 px-4 py-3 text-sm leading-relaxed text-ink-soft">
      <strong className="font-semibold text-ink">Notă.</strong> Fiscally este un
      instrument de organizare și estimare. Nu înlocuiește un contabil autorizat
      și nu constituie sfat juridic sau fiscal. Cifrele sunt orientative, pe
      baza unor ipoteze 2026. Aplicația nu se conectează la SPV și nu depune
      nimic la ANAF.
    </aside>
  );
}

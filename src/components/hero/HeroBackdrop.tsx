/** Static, low-opacity light and line work behind the hero. Purely decorative. */
function Rings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden fill="none">
      {[60, 95, 130, 165, 200].map((r, i) => (
        <circle key={r} cx="200" cy="200" r={r} stroke="rgb(var(--ink))" strokeOpacity={0.07 - i * 0.008} strokeWidth="1" />
      ))}
      <circle cx="200" cy="200" r="130" stroke="rgb(var(--brand-mark))" strokeOpacity="0.22" strokeWidth="1.25" strokeDasharray="2 10" />
    </svg>
  );
}

export function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* base wash */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#F7F9FC_0%,#F5F8F7_55%,rgb(var(--paper))_100%)]" />
      {/* blue ambience, top corners */}
      <div className="absolute -left-40 -top-40 h-[520px] w-[620px] rounded-full bg-[radial-gradient(closest-side,rgb(37_99_235/0.10),transparent)]" />
      <div className="absolute -right-48 top-10 h-[460px] w-[560px] rounded-full bg-[radial-gradient(closest-side,rgb(37_99_235/0.07),transparent)]" />
      {/* green glow behind the phone */}
      <div className="absolute left-1/2 top-[48%] h-[620px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(74_222_128/0.32),rgb(74_222_128/0.10)_55%,transparent)] max-sm:top-[58%] max-sm:h-[440px] max-sm:w-[440px]" />
      {/* illuminated floor beneath the device */}
      <div className="absolute bottom-[4%] left-1/2 h-24 w-[520px] -translate-x-1/2 rounded-[100%] bg-[radial-gradient(closest-side,rgb(2_190_98/0.20),transparent)] blur-md max-sm:hidden" />
      {/* concentric line patterns at the edges */}
      <Rings className="absolute -left-48 top-[38%] hidden h-[560px] w-[560px] md:block" />
      <Rings className="absolute -right-48 top-[30%] hidden h-[560px] w-[560px] md:block" />
      {/* fine grid fading out */}
      <div className="absolute inset-x-0 top-0 hidden h-[70%] bg-[linear-gradient(rgb(20_32_51/0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(20_32_51/0.035)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_50%_0%,black,transparent_70%)] lg:block" />
      {/* hand-off into the next section */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-paper" />
    </div>
  );
}

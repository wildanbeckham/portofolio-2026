import { skills } from "@/data/content";
import { Reveal } from "@/components/Reveal";

export function Skills() {
  const loop = [...skills, ...skills];

  return (
    <section id="skills" className="overflow-hidden border-b border-border py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-5 md:px-8">
        <Reveal>
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
            Keahlian &amp; Teknologi
          </h2>
          <p className="mt-4 max-w-[48ch] text-base text-ink-soft">
            Sekumpulan teknologi dan framework modern yang saya pakai.
          </p>
        </Reveal>
      </div>

      <Reveal className="mt-12 hidden md:block" delay={0.1}>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-page to-transparent md:w-28" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-page to-transparent md:w-28" />
          <div className="marquee-track flex w-max gap-3">
            {loop.map((skill, index) => (
              <span
                key={`${skill.name}-${index}`}
                className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-border bg-surface px-4 py-3 text-sm font-medium text-ink shadow-[var(--shadow)]"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
                  {skill.category}
                </span>
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal className="mx-auto mt-10 grid max-w-[1400px] grid-cols-2 gap-3 px-5 sm:grid-cols-3 md:hidden md:px-8">
        {skills.map((skill) => (
          <div
            key={skill.name}
            className="rounded-[var(--radius)] border border-border bg-surface px-3 py-3 text-sm font-medium text-ink"
          >
            {skill.name}
          </div>
        ))}
      </Reveal>
    </section>
  );
}

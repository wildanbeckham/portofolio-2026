import { profile } from "@/data/content";
import { Reveal } from "@/components/Reveal";

export function About() {
  return (
    <section id="about" className="border-b border-border py-20 md:py-28">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 px-5 md:grid-cols-12 md:gap-8 md:px-8">
        <Reveal className="md:col-span-4">
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
            Tentang Saya
          </h2>
        </Reveal>

        <div className="space-y-6 md:col-span-7 md:col-start-6">
          {profile.about.map((paragraph, index) => (
            <Reveal key={paragraph.slice(0, 24)} delay={index * 0.08}>
              <p className="max-w-[62ch] text-base leading-relaxed text-ink-soft md:text-lg">
                {paragraph}
              </p>
            </Reveal>
          ))}

          <Reveal delay={0.18}>
            <a
              href={profile.cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border-b border-accent pb-0.5 text-sm font-semibold text-accent transition-colors hover:text-accent-hover"
            >
              Lihat CV
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

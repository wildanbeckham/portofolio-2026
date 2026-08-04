"use client";

import { ArrowDownRight, FileText } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { BackgroundPaths } from "@/components/BackgroundPaths";
import { profile } from "@/data/content";

function AnimatedTitle({ text }: { text: string }) {
  const reduce = useReducedMotion();
  const words = text.split(" ");

  return (
    <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl">
      {words.map((word, wordIndex) => (
        <span
          key={`${word}-${wordIndex}`}
          className="mr-[0.28em] inline-block whitespace-nowrap"
        >
          {word.split("").map((char, charIndex) => (
            <motion.span
              key={`${word}-${charIndex}`}
              className="inline-block"
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                ease: [0.22, 1, 0.36, 1],
                delay: wordIndex * 0.08 + charIndex * 0.02,
              }}
            >
              {char}
            </motion.span>
          ))}
        </span>
      ))}
    </h1>
  );
}

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section
      id="top"
      className="relative z-10 min-h-[100dvh] overflow-hidden border-b border-border"
    >
      <BackgroundPaths />

      <div className="relative z-10 mx-auto grid min-h-[100dvh] max-w-[1400px] grid-cols-1 items-center gap-10 px-5 pb-16 pt-28 md:grid-cols-12 md:px-8 md:pb-20 md:pt-24">
        <div className="md:col-span-7">
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-5 font-mono text-xs font-medium uppercase tracking-[0.18em] text-accent"
          >
            {profile.role}
          </motion.p>

          <AnimatedTitle text={profile.name} />

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="mt-5 max-w-[36ch] text-base leading-relaxed text-ink-soft md:text-lg"
          >
            {profile.tagline}
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <a
              href="#work"
              className="inline-flex h-12 items-center gap-2 rounded-[var(--radius)] bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover active:scale-[0.98]"
            >
              Lihat Proyek
              <ArrowDownRight size={18} weight="bold" />
            </a>
            <a
              href={profile.cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-[var(--radius)] border border-border bg-surface px-5 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent active:scale-[0.98]"
            >
              Lihat CV
              <FileText size={18} weight="bold" />
            </a>
          </motion.div>
        </div>

        <motion.aside
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="hidden md:col-span-5 md:block"
        >
          <div className="rounded-[var(--radius)] border border-border bg-surface p-6 shadow-[var(--shadow)] md:p-8">
            <dl className="grid grid-cols-2 gap-6">
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                  Pengalaman
                </dt>
                <dd className="mt-2 font-display text-3xl font-bold text-ink">
                  {profile.experienceYears}+
                  <span className="ml-1 text-base font-medium text-muted">thn</span>
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                  Fokus
                </dt>
                <dd className="mt-2 text-base font-medium leading-snug text-ink">
                  Web &amp; mobile UI
                </dd>
              </div>
            </dl>
          </div>
        </motion.aside>
      </div>
    </section>
  );
}

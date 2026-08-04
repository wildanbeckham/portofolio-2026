"use client";

import { ArrowDownRight, FileText } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
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

function TypewriterLines({ lines }: { lines: string[] }) {
  const reduce = useReducedMotion();
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (reduce || !mounted) return;

    const current = lines[lineIndex] ?? "";
    const isComplete = charIndex === current.length;
    const isEmpty = charIndex === 0 && deleting;

    let delay = deleting ? 32 : 55;
    if (isComplete && !deleting) delay = 1600;
    if (isEmpty) delay = 320;

    const timer = window.setTimeout(() => {
      if (isComplete && !deleting) {
        setDeleting(true);
        return;
      }

      if (deleting) {
        if (charIndex > 0) {
          setCharIndex((value) => value - 1);
          return;
        }
        setDeleting(false);
        setLineIndex((value) => (value + 1) % lines.length);
        return;
      }

      setCharIndex((value) => value + 1);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [charIndex, deleting, lineIndex, lines, mounted, reduce]);

  if (reduce) {
    return (
      <p className="mt-5 font-mono text-sm text-ink-soft md:text-base">
        {lines[0]}
      </p>
    );
  }

  const text = (lines[lineIndex] ?? "").slice(0, charIndex);

  return (
    <p className="mt-5 min-h-[1.6em] font-mono text-sm text-ink-soft md:text-base">
      <AnimatePresence mode="wait">
        <motion.span
          key={`${lineIndex}-${deleting ? "d" : "t"}`}
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 1 }}
          className="inline"
        >
          {text}
        </motion.span>
      </AnimatePresence>
      <span className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.15em] animate-pulse bg-accent align-baseline" />
    </p>
  );
}

export function Hero() {
  const reduce = useReducedMotion();
  const typedLines = [
    `${profile.experienceYears}+ tahun pengalaman`,
    "Fokus: Web & mobile UI",
  ];

  return (
    <section
      id="top"
      className="relative z-10 min-h-[100dvh] overflow-hidden border-b border-border"
    >
      <BackgroundPaths />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-[1400px] flex-col items-center justify-center px-5 pb-16 pt-28 text-center md:px-8 md:pb-20 md:pt-24">
        <div className="mx-auto w-full max-w-3xl">
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-5 font-mono text-xs font-medium uppercase tracking-[0.18em] text-accent"
          >
            {profile.role}
          </motion.p>

          <AnimatedTitle text={profile.name} />

          <TypewriterLines lines={typedLines} />

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.25 }}
            className="mx-auto mt-5 max-w-[40ch] text-base leading-relaxed text-ink-soft md:text-lg"
          >
            {profile.tagline}
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.35 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
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
      </div>
    </section>
  );
}

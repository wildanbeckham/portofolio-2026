"use client";

import {
  EnvelopeSimple,
  MapPin,
  PaperPlaneTilt,
  WhatsappLogo,
} from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";
import { profile } from "@/data/content";
import { Reveal } from "@/components/Reveal";

export function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = [
      `Halo Wildan, saya ${name || "(nama)"}`,
      email ? `Email: ${email}` : null,
      "",
      message || "(pesan)",
    ]
      .filter((line) => line !== null)
      .join("\n");

    const url = `https://wa.me/${profile.whatsapp}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <section id="contact" className="py-20 md:py-28">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 px-5 md:grid-cols-12 md:gap-10 md:px-8">
        <Reveal className="md:col-span-5">
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
            Kontak Aku Yuk!
          </h2>
          <p className="mt-4 max-w-[36ch] text-base text-ink-soft">
            Punya ide seru atau mau ngobrol soal project?
          </p>

          <div className="mt-10 space-y-5">
            <a
              href={`mailto:${profile.email}`}
              className="flex items-start gap-3 text-ink-soft transition-colors hover:text-accent"
            >
              <EnvelopeSimple size={22} className="mt-0.5 shrink-0 text-accent" />
              <span>
                <span className="block text-xs font-medium uppercase tracking-[0.12em] text-muted">
                  Email
                </span>
                <span className="mt-1 block text-base font-medium text-ink">
                  {profile.email}
                </span>
              </span>
            </a>
            <a
              href={`https://wa.me/${profile.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 text-ink-soft transition-colors hover:text-accent"
            >
              <WhatsappLogo size={22} className="mt-0.5 shrink-0 text-accent" weight="fill" />
              <span>
                <span className="block text-xs font-medium uppercase tracking-[0.12em] text-muted">
                  WhatsApp
                </span>
                <span className="mt-1 block text-base font-medium text-ink">
                  {profile.whatsappDisplay}
                </span>
              </span>
            </a>
            <div className="flex items-start gap-3 text-ink-soft">
              <MapPin size={22} className="mt-0.5 shrink-0 text-accent" />
              <span>
                <span className="block text-xs font-medium uppercase tracking-[0.12em] text-muted">
                  Lokasi
                </span>
                <span className="mt-1 block max-w-[34ch] text-base font-medium leading-snug text-ink">
                  {profile.location}
                </span>
              </span>
            </div>
          </div>
        </Reveal>

        <Reveal className="md:col-span-7" delay={0.08}>
          <form
            onSubmit={handleSubmit}
            className="rounded-[var(--radius)] border border-border bg-surface p-6 shadow-[var(--shadow)] md:p-8"
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-ink">Nama</span>
                <input
                  required
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama lengkap"
                  className="h-12 rounded-[var(--radius)] border border-border bg-page-elevated px-4 text-sm text-ink outline-none transition-shadow placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-ink">Email</span>
                <input
                  required
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="h-12 rounded-[var(--radius)] border border-border bg-page-elevated px-4 text-sm text-ink outline-none transition-shadow placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </label>
            </div>

            <label className="mt-5 flex flex-col gap-2">
              <span className="text-sm font-medium text-ink">Pesan</span>
              <textarea
                required
                name="message"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ceritakan ide atau kebutuhan project kamu"
                className="resize-y rounded-[var(--radius)] border border-border bg-page-elevated px-4 py-3 text-sm text-ink outline-none transition-shadow placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <button
              type="submit"
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-accent text-sm font-semibold text-white transition-colors hover:bg-accent-hover active:scale-[0.99] sm:w-auto sm:px-6"
            >
              Kirim ke WhatsApp
              <PaperPlaneTilt size={18} weight="fill" />
            </button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

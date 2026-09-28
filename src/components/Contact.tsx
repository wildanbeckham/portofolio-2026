"use client";

import { EnvelopeSimple, MapPin, PaperPlaneTilt, WhatsappLogo } from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";
import { profile } from "@/data/content";
import { Reveal } from "@/components/Reveal";

export function Contact() {
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = `Halo Wildan, saya ${String(data.get("name")).trim()}\nEmail: ${String(data.get("email")).trim()}\n\n${String(data.get("message")).trim()}`;
    window.open(`https://wa.me/${profile.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    setSent(true);
  }

  return (
    <section id="contact" className="section contact-section">
      <div className="page-container">
        <Reveal><h2 className="section-heading">Ide bagus layak<br />jadi <span className="text-accent">karya nyata.</span></h2><p className="section-description">Punya proyek atau ingin berkolaborasi? Ceritakan idemu, kita mulai dari percakapan.</p></Reveal>
        <div className="contact-grid">
          <Reveal className="contact-details">
            <a href={`mailto:${profile.email}`}><EnvelopeSimple size={23} /><div><span>Email</span><p>{profile.email}</p></div></a>
            <a href={`https://wa.me/${profile.whatsapp}`} target="_blank" rel="noopener noreferrer"><WhatsappLogo size={23} /><div><span>WhatsApp</span><p>{profile.whatsappDisplay}</p></div></a>
            <div><MapPin size={23} /><div><span>Lokasi</span><p>{profile.location}</p></div></div>
          </Reveal>
          <Reveal>
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <label>Nama<input name="name" autoComplete="name" placeholder="Nama lengkap" required maxLength={100} pattern=".*\S.*" /></label>
                <label>Email<input type="email" name="email" autoComplete="email" placeholder="nama@email.com" required maxLength={200} /></label>
              </div>
              <label>Pesan<textarea name="message" placeholder="Ceritakan ide atau kebutuhan proyek kamu" required rows={4} maxLength={2000} aria-describedby="contact-note" /></label>
              <button type="submit" className="button button-primary">Kirim ke WhatsApp <PaperPlaneTilt size={19} /></button>
              <p className="form-note" id="contact-note">WhatsApp akan terbuka dengan draf pesan. Kamu bisa memeriksanya sebelum mengirim.</p>
              {sent && <p role="status" className="form-feedback">Lanjutkan pengiriman di WhatsApp. Jika tab tidak terbuka, izinkan pop-up lalu coba lagi.</p>}
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

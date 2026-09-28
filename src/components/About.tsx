import { profile, projects } from "@/data/content";
import { Reveal } from "@/components/Reveal";

export function About() {
  return (
    <section id="about" className="section about-section">
      <div className="page-container">
        <Reveal><h2 className="section-heading">Bukan sekadar tampilan.<br /><span className="text-ink-soft">Pengalaman yang bekerja.</span></h2></Reveal>
        <div className="about-grid">
          <Reveal className="about-statement"><span className="mono-label">Tentang saya</span><p>Saya Wildan,<br />developer dengan<br /><span>perhatian pada detail.</span></p></Reveal>
          <div className="about-details">
            <Reveal>{profile.about.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</Reveal>
            <Reveal className="about-numbers"><div><strong>{profile.experienceYears}+</strong><span>Tahun pengalaman</span></div><div><strong>{projects.length}</strong><span>Proyek dalam portofolio</span></div><a href={profile.cvUrl} target="_blank" rel="noopener noreferrer" className="text-link">Lihat CV ↗</a></Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

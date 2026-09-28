"use client";

import { useState } from "react";
import { Code, Devices, Stack, Wrench } from "@phosphor-icons/react";
import { skills } from "@/data/content";
import { Reveal } from "@/components/Reveal";

const groups = [
  { name: "Frontend", icon: Code, categories: ["Markup", "Language", "Framework"] },
  { name: "Styling", icon: Stack, categories: ["Style"] },
  { name: "Mobile & CMS", icon: Devices, categories: ["Mobile", "CMS", "Practice"] },
  { name: "Tools", icon: Wrench, categories: ["Tool"] },
];

export function Skills() {
  const [active, setActive] = useState(0);
  return (
    <section id="skills" className="section skills-section">
      <div className="page-container">
        <Reveal><h2 className="section-heading">Di balik setiap interaksi.</h2><p className="section-description">Teknologi yang saya gunakan untuk mengubah ide menjadi pengalaman digital.</p></Reveal>
        <Reveal className="skills-workbench">
          <div className="skill-categories" aria-label="Kategori keahlian">
            {groups.map((group, index) => <button type="button" key={group.name} aria-pressed={active === index} aria-controls="skill-results" onClick={() => setActive(index)}><group.icon size={22} /><span>{group.name}</span><span className="category-arrow">↗</span></button>)}
          </div>
          <div id="skill-results" className="skill-results" aria-live="polite">
            <p className="mono-label">{groups[active].name}</p>
            <div className="skill-cloud">{skills.filter((skill) => groups[active].categories.includes(skill.category)).map((skill, index) => <span className="skill-token" key={skill.name} style={{ animationDelay: `${index * 45}ms` }}>{skill.name}</span>)}</div>
            <p className="skill-note">Dipilih sesuai kebutuhan produk, bukan sekadar tren.</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

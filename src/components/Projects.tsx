"use client";

import { ArrowLeft, ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import Image from "next/image";
import { useState, type PointerEvent } from "react";
import { Reveal } from "@/components/Reveal";
import { projects } from "@/data/content";

export function Projects() {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(x, { stiffness: 150, damping: 22 });
  const rotateY = useSpring(y, { stiffness: 150, damping: 22 });
  const project = projects[active];

  function tilt(event: PointerEvent<HTMLAnchorElement>) {
    if (reduce || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((0.5 - (event.clientY - rect.top) / rect.height) * 8);
    y.set(((event.clientX - rect.left) / rect.width - 0.5) * 8);
  }

  return (
    <section id="work" className="section projects-section">
      <div className="page-container">
        <Reveal><p className="eyebrow">Dari ide menjadi nyata</p><h2 className="section-heading">Karya yang berbicara.</h2><p className="section-description">Eksplorasi {projects.length} proyek untuk produk, brand, dan layanan digital.</p></Reveal>
        <Reveal className="project-showcase">
          <div className="project-image-stage">
            <motion.a href={project.linkUrl} target="_blank" rel="noopener noreferrer" className="project-preview" style={{ rotateX: reduce ? 0 : rotateX, rotateY: reduce ? 0 : rotateY }} onPointerMove={tilt} onPointerLeave={() => { x.set(0); y.set(0); }} aria-label={`Buka website ${project.title}`}>
              <Image key={project.id} src={project.coverImage} alt={`Screenshot website ${project.title}`} fill sizes="(max-width: 767px) 92vw, 65vw" className="project-cover" />
            </motion.a>
          </div>
          <div className="project-info" aria-live="polite">
            <span className="project-count">{String(active + 1).padStart(2, "0")} <span>/ {projects.length}</span></span>
            <h3>{project.title}</h3><p>{project.description}</p>
            <div className="project-tags">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            <a href={project.linkUrl} target="_blank" rel="noopener noreferrer" className="text-link">Kunjungi Website <ArrowUpRight size={18} /></a>
            <div className="project-controls"><button type="button" className="icon-button" aria-label="Proyek sebelumnya" onClick={() => setActive((active + projects.length - 1) % projects.length)}><ArrowLeft size={21} /></button><button type="button" className="icon-button" aria-label="Proyek berikutnya" onClick={() => setActive((active + 1) % projects.length)}><ArrowRight size={21} /></button></div>
          </div>
        </Reveal>
        <div className="project-index" aria-label="Pilih proyek">
          {projects.map((item, index) => <button type="button" key={item.id} onClick={() => setActive(index)} aria-pressed={active === index}><span>{String(index + 1).padStart(2, "0")}</span>{item.title}<ArrowUpRight size={16} /></button>)}
        </div>
      </div>
    </section>
  );
}

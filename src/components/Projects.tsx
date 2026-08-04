"use client";

import { ArrowUpRight } from "@phosphor-icons/react";
import Image from "next/image";
import { ContainerScroll } from "@/components/ContainerScroll";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";
import { projects } from "@/data/content";

export function Projects() {
  const featured = projects[0];
  const rest = projects.slice(1);

  return (
    <section id="work" className="border-b border-border py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-5 md:px-8">
        <Reveal>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
                Proyek &amp; Portofolio
              </h2>
              <p className="mt-4 max-w-[42ch] text-base text-ink-soft">
                Karya terpilih dari kolaborasi produk, brand, dan layanan digital.
              </p>
            </div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">
              {projects.length} proyek
            </p>
          </div>
        </Reveal>

        {featured ? (
          <ContainerScroll
            titleComponent={
              <div className="mb-2 mt-10 md:mt-14">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">
                  {featured.subtitle}
                </p>
                <h3 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink md:text-5xl">
                  {featured.title}
                </h3>
                <p className="mt-4 max-w-[48ch] text-sm leading-relaxed text-ink-soft md:text-base">
                  {featured.description}
                </p>
              </div>
            }
          >
            <a
              href={featured.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block overflow-hidden rounded-[var(--radius)] border border-border bg-surface shadow-[var(--shadow)]"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-page md:aspect-[16/9]">
                <Image
                  src={featured.coverImage}
                  alt={`Preview ${featured.title}`}
                  fill
                  priority
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  sizes="(max-width: 1024px) 100vw, 900px"
                />
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-border px-5 py-4 md:px-6">
                <div className="flex flex-wrap gap-2">
                  {featured.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-page-elevated px-3 py-1 text-xs font-medium text-ink-soft"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
                  Live Demo
                  <ArrowUpRight size={16} weight="bold" />
                </span>
              </div>
            </a>
          </ContainerScroll>
        ) : null}

        <Stagger className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((project) => (
            <StaggerItem key={project.id}>
              <a
                href={project.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-surface transition-colors hover:border-accent"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-page">
                  <Image
                    src={project.coverImage}
                    alt={`Preview ${project.title}`}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                      {project.subtitle}
                    </p>
                    <h3 className="mt-2 font-display text-xl font-bold tracking-tight text-ink">
                      {project.title}
                    </h3>
                  </div>
                  <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-ink-soft">
                    {project.description}
                  </p>
                  <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                    <div className="flex flex-wrap gap-1.5">
                      {project.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-page-elevated px-2.5 py-1 text-[11px] font-medium text-ink-soft"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-accent">Live</span>
                  </div>
                </div>
              </a>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

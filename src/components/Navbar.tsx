"use client";

import { List, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { navLinks, profile } from "@/data/content";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(event: KeyboardEvent) {
      if (event.key === "Escape") { setOpen(false); toggle.current?.focus(); }
    }
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    window.addEventListener("keydown", close);
    desktop.addEventListener("change", closeOnDesktop);
    return () => { window.removeEventListener("keydown", close); desktop.removeEventListener("change", closeOnDesktop); };
  }, [open]);

  return (
    <header className="site-header">
      <nav className="page-container navigation" aria-label="Navigasi utama">
        <a href="#top" className="wordmark" onClick={() => setOpen(false)}>{profile.shortName}<span>.</span></a>
        <ul className="desktop-nav">{navLinks.map((link) => <li key={link.href}><a href={link.href}>{link.label}</a></li>)}</ul>
        <div className="nav-actions">
          <ThemeToggle />
          <button ref={toggle} type="button" className="icon-button mobile-menu-toggle" aria-label={open ? "Tutup menu" : "Buka menu"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>{open ? <X size={21} /> : <List size={21} />}</button>
        </div>
        {open && <ul id="mobile-navigation" className="mobile-nav">{navLinks.map((link) => <li key={link.href}><a href={link.href} onClick={() => setOpen(false)}>{link.label}</a></li>)}</ul>}
      </nav>
    </header>
  );
}

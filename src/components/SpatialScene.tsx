"use client";

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowsClockwise, Compass, Pause, Play, X } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { navLinks, profile } from "@/data/content";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { GameWorld } from "@/components/game-world";

const directions = [
  { key: "arrowup", label: "Gerak maju", icon: ArrowUp },
  { key: "arrowleft", label: "Gerak kiri", icon: ArrowLeft },
  { key: "arrowdown", label: "Gerak mundur", icon: ArrowDown },
  { key: "arrowright", label: "Gerak kanan", icon: ArrowRight },
];

const portraits = [
  { name: "Altar Wildan", description: "Cerita di balik pembuat dunia ini.", kind: "altar" },
  { name: "Gerbang Keahlian", description: "Teknologi yang menjadi bekal setiap proyek.", kind: "portal" },
  { name: "Gerbang Proyek", description: "Jelajahi karya yang sudah dibangun.", kind: "portal" },
  { name: "Pemandu Proyek", description: "Ada ide? Mari cari cara mewujudkannya.", kind: "npc" },
];

function InteractionPortrait({ index, world, ready }: { index: number; world: RefObject<GameWorld | null>; ready: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const portrait = portraits[index];
  useEffect(() => {
    if (!host.current || !world.current || !ready) return;
    const element = host.current;
    try { return world.current.preview(element, index); }
    catch { element.dataset.preview = "error"; }
  }, [index, world, ready]);
  return <aside className="interaction-portrait" aria-label={`Aset interaksi: ${portrait.name}`} data-asset={portrait.kind}>
    <div ref={host} className="interaction-portrait-stage" data-preview={ready ? "loading" : "error"}>
      <p className="portrait-loading">Menyiapkan aset...</p>
      <p className="portrait-fallback">Pratinjau 3D tidak tersedia.</p>
    </div>
    <div className="interaction-portrait-caption"><h3>{portrait.name}</h3><p>{portrait.description}</p></div>
  </aside>;
}

export function SpatialScene({ children }: { children: ReactNode[] }) {
  const viewport = useRef<HTMLDivElement>(null);
  const labels = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLParagraphElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const game = useRef<GameWorld | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);

  const openPortal = useCallback((index: number) => {
    game.current?.pause(true);
    if (window.location.hash !== navLinks[index].href) window.history.pushState(null, "", navLinks[index].href);
    setActive(index);
  }, []);

  useEffect(() => {
    function syncHash() {
      const index = navLinks.findIndex((link) => link.href === window.location.hash);
      setActive(index < 0 ? null : index);
    }
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    let disposed = false;
    let world: GameWorld | undefined;
    import("@/components/game-world").then(({ createGameWorld }) => {
      if (disposed || !viewport.current || !hint.current || !labels.current) return;
      world = createGameWorld(viewport.current, hint.current, labels.current, openPortal, () => setStatus("error"));
      game.current = world;
      world.pause(!!dialog.current?.open);
      setStatus("ready");
    }).catch(() => { if (!disposed) setStatus("error"); });
    return () => { disposed = true; world?.dispose(); game.current = null; };
  }, [attempt, openPortal]);

  useEffect(() => {
    if (active !== null) {
      if (!dialog.current?.open) dialog.current?.showModal();
    } else if (dialog.current?.open) dialog.current.close();
    game.current?.pause(paused || active !== null);
  }, [active, paused]);

  useEffect(() => {
    function keyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || status !== "ready" || paused || active !== null || dialog.current?.open) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest('input, textarea, select, dialog, [role="textbox"]'))) return;
      // Space/Enter keep their native activation behavior on focused UI controls.
      if (event.key === " " && target instanceof HTMLElement && target.closest('button, a[href], [role="button"]')) return;
      if (event.key === "Escape") { game.current?.clearInput(); setPaused(true); return; }
      if (event.key.toLowerCase() === "e") {
        event.preventDefault();
        const nearby = game.current?.nearby() ?? -1;
        if (!event.repeat && nearby >= 0) openPortal(nearby);
      } else if (game.current?.setKey(event.key.toLowerCase(), true)) event.preventDefault();
    }
    function keyUp(event: KeyboardEvent) { game.current?.setKey(event.key.toLowerCase(), false); }
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      game.current?.clearInput();
    };
  }, [active, paused, status, openPortal]);

  function returnToGame() {
    game.current?.leavePortal();
    if (navLinks.some((link) => link.href === window.location.hash)) window.history.replaceState(null, "", window.location.pathname + window.location.search);
    setActive(null);
    game.current?.pause(paused);
    viewport.current?.focus({ preventScroll: true });
  }

  function interact() {
    const nearby = game.current?.nearby() ?? -1;
    if (nearby >= 0) openPortal(nearby);
  }

  return (
    <div className="game-exhibit game-fullscreen" data-status={status} data-paused={paused || active !== null}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) game.current?.clearInput(); }}>
      <div ref={viewport} className="game-viewport" tabIndex={status === "ready" ? 0 : -1} role="group" aria-label="Dunia 3D, kendalikan robot" aria-describedby="game-instructions"
        onPointerDown={() => viewport.current?.focus({ preventScroll: true })}
        onBlur={() => game.current?.clearInput()} />

      <header className="world-header">
        <div><h1 className="wordmark">{profile.shortName}<span>.</span></h1><p>Portfolio world</p></div>
        <div className="world-tools">
          <ThemeToggle />
          <button type="button" className="icon-button" disabled={status !== "ready"} aria-label={paused ? "Lanjutkan game" : "Jeda game"} onClick={() => setPaused(!paused)}>{paused ? <Play size={18} /> : <Pause size={18} />}</button>
          <button type="button" className="icon-button" disabled={status !== "ready"} aria-label="Reset posisi robot" onClick={() => game.current?.reset()}><ArrowsClockwise size={18} /></button>
        </div>
      </header>

      <div ref={labels} className="world-portal-labels" aria-label="Tempat interaksi di dunia">
        {navLinks.map((link, index) => <button type="button" key={link.href} aria-label={index === 0 ? "Interaksi patung Tentang Saya" : index === 3 ? "Bicara dengan NPC Kontak" : `Masuk portal ${link.label}`} onClick={() => { game.current?.visit(index); openPortal(index); }}><span>{index === 0 ? "ALTAR" : index === 3 ? "NPC" : "PORTAL"}</span>{link.label}<span aria-hidden="true">↗</span></button>)}
      </div>

      {status !== "ready" && <div className="world-loading" role="status">
        {status === "loading" ? <><div className="game-loading-island" /><p>Menyiapkan dunia Wildan...</p></> : <><p>Dunia 3D belum bisa dimuat.<br />Buka konten lewat menu di bawah.</p><button type="button" className="button button-quiet" onClick={() => { setStatus("loading"); setPaused(false); setAttempt(attempt + 1); }}>Coba lagi</button></>}
      </div>}
      {paused && active === null && <div className="game-pause-label">Game dijeda</div>}

      <aside className="world-objective"><Compass size={20} /><div><strong>Temui penghuni dunia Wildan.</strong><p>Patung di tengah menyimpan cerita. NPC Kontak siap membantumu memulai proyek.</p></div></aside>
      <div className="world-bottom">
        <p ref={hint} className="game-hint" role="status">Dekati patung, temui NPC kontak, atau jelajahi gerbang.</p>
        <div className="game-control-bar">
          <div className="game-dpad" aria-label="Kontrol gerakan">
            {directions.map(({ key, label, icon: Icon }) => <button type="button" key={key} aria-label={label} disabled={status !== "ready" || paused}
              onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); game.current?.setKey(key, true); }}
              onPointerUp={(event) => { game.current?.setKey(key, false); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
              onPointerCancel={() => game.current?.setKey(key, false)} onLostPointerCapture={() => game.current?.setKey(key, false)}
              onKeyDown={(event) => { if (event.key === " " || event.key === "Enter") { event.preventDefault(); game.current?.setKey(key, true); } }}
              onKeyUp={() => game.current?.setKey(key, false)} onBlur={() => game.current?.setKey(key, false)}><Icon size={18} /></button>)}
          </div>
          <p id="game-instructions" className="game-instructions">Langsung gunakan keyboard untuk bermain<br /><kbd>WASD / ↑↓←→</kbd> berjalan · <kbd>Space</kbd> lompat<br /><kbd>E</kbd> interaksi · <kbd>Esc</kbd> jeda</p>
          <div className="game-action-buttons">
            <button type="button" disabled={status !== "ready" || paused} onClick={() => game.current?.jump()}>Lompat <kbd>Space</kbd></button>
            <button type="button" disabled={status !== "ready" || paused} onClick={interact}>Interaksi <kbd>E</kbd></button>
          </div>
        </div>
        <nav className="world-shortcuts" aria-label="Akses cepat portfolio">
          {navLinks.map((link, index) => <button type="button" key={link.href} onClick={() => { game.current?.visit(index); openPortal(index); }}>{link.label}</button>)}
        </nav>
      </div>

      <dialog ref={dialog} className="portal-modal" aria-labelledby="portal-title" onClose={returnToGame}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [tabindex="0"]')).filter((item) => item.getClientRects().length > 0);
          const first = items[0];
          const last = items[items.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }}
        onClick={(event) => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.current?.close(); } }}>
        <div className="portal-modal-header"><div><span className="mono-label">{active === 0 ? "Altar Wildan" : active === 3 ? "NPC pemandu proyek" : "Portal portfolio"}</span><h2 id="portal-title">{active === null ? "Portfolio" : navLinks[active].label}</h2></div><button type="button" className="icon-button" aria-label="Tutup modal dan kembali bermain" onClick={() => dialog.current?.close()} autoFocus><X size={22} /></button></div>
        <div className="portal-modal-body">
          <div className="portal-modal-content" key={`content-${active}`}>{active !== null && children[active]}</div>
          {active !== null && <InteractionPortrait key={active} index={active} world={game} ready={status === "ready"} />}
        </div>
        <div className="portal-modal-footer"><span>Game dijeda selama kamu menjelajah.</span><button type="button" className="text-link" onClick={() => dialog.current?.close()}>Kembali bermain <kbd>Esc</kbd></button></div>
      </dialog>
    </div>
  );
}

import { profile } from "@/data/content";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="page-container footer-inner">
        <a href="#top" className="wordmark">{profile.shortName}<span>.</span></a>
        <p>© {new Date().getFullYear()} {profile.name}</p>
        <a href="#top" className="text-link">Kembali ke atas ↑</a>
      </div>
    </footer>
  );
}

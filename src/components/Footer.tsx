import { profile } from "@/data/content";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-[#10141a] text-[#eef2f6]">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between md:px-8">
        <div>
          <p className="font-display text-xl font-bold">
            {profile.shortName}
            <span className="text-teal-400">.</span>
          </p>
          <p className="mt-2 text-sm text-white/65">{profile.role}</p>
        </div>
        <p className="text-sm text-white/55">
          © {year} {profile.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export const profile = {
  name: "Wildan Beckham S",
  shortName: "Wildan",
  role: "Web Developer",
  tagline:
    "Membangun antarmuka web yang cepat, responsif, dan siap production.",
  about: [
    "Web Developer dengan pengalaman lebih dari 2 tahun dalam mengembangkan antarmuka pengguna web. Terbiasa dengan berbagai framework modern seperti ReactJS, React Native, Svelte, dan Next.js.",
    "Memiliki pemahaman mendalam dalam menerapkan desain responsif dan pengujian fitur aplikasi. Mampu bekerja secara individu maupun dalam tim, terbiasa dengan ritme kerja cepat, dan berorientasi pada detail.",
  ],
  experienceYears: 2,
  location: "Pondok Kacang Barat, Pondok Aren, Tangerang Selatan, Banten",
  email: "wildanbeckham5@gmail.com",
  whatsapp: "085157283329",
  whatsappDisplay: "0851-5728-3329",
  cvUrl: "/wildan-CV-2026.pdf",
  socials: {
    github: "https://github.com/",
    linkedin: "https://linkedin.com/",
  },
};

export const skills = [
  { name: "HTML5", category: "Markup" },
  { name: "CSS3", category: "Style" },
  { name: "JavaScript", category: "Language" },
  { name: "TypeScript", category: "Language" },
  { name: "React JS", category: "Framework" },
  { name: "Next JS", category: "Framework" },
  { name: "React Native", category: "Mobile" },
  { name: "Svelte", category: "Framework" },
  { name: "Tailwind", category: "Style" },
  { name: "Bootstrap", category: "Style" },
  { name: "Sass", category: "Style" },
  { name: "WordPress", category: "CMS" },
  { name: "GitHub", category: "Tool" },
  { name: "GitLab", category: "Tool" },
  { name: "Responsive", category: "Practice" },
  { name: "Microsoft Office", category: "Tool" },
] as const;

export type Project = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  slug: string;
  coverImage: string;
  linkUrl: string;
  tags: string[];
};

export const projects: Project[] = [
  {
    id: "1",
    title: "BANGMAT",
    subtitle: "bangmat",
    description:
      "Platform frontend untuk layanan perbankan digital dengan fokus pada alur transaksi yang jelas dan antarmuka yang mudah digunakan.",
    slug: "bangmat",
    coverImage: "/projects/bangmat.webp",
    linkUrl: "https://bank-mat-fe-morfotech.netlify.app/",
    tags: ["Next.js", "TypeScript", "Tailwind"],
  },
  {
    id: "2",
    title: "JOIN KOPI INDONESIA",
    subtitle: "JOIN (Jelajah Kopi Indonesia)",
    description:
      "JOIN Kopi melestarikan biji kopi Nusantara. Menyuguhkan pengalaman digital yang menceritakan perjalanan petani, pedagang, dan racikan hingga tersaji.",
    slug: "joinkopiindonesia",
    coverImage: "/projects/joinkopiindonesia.webp",
    linkUrl: "https://www.vpn.morfotech.id/",
    tags: ["React", "UI", "Branding"],
  },
  {
    id: "3",
    title: "LIQUID SILVA",
    subtitle: "@liquidsilva",
    description:
      "Website brand Liquid Silva dengan fokus pada presentasi produk dan pengalaman visual yang bersih.",
    slug: "liquidsilva",
    coverImage: "/projects/liquidsilva.webp",
    linkUrl: "https://www.liquidsilva.id/",
    tags: ["React", "Tailwind", "Swiper"],
  },
  {
    id: "4",
    title: "DITRESKRIMUM POLDA METRO JAYA",
    subtitle: "DITRESKRIMUM",
    description:
      "Portal resmi Ditreskrimum Polda Metro Jaya dengan antarmuka informatif dan akses cepat ke layanan publik.",
    slug: "ditreskrimum",
    coverImage: "/projects/ditreskrimum.webp",
    linkUrl: "https://reskrimum.metro.polri.go.id/",
    tags: ["Next.js", "TypeScript", "GSAP"],
  },
  {
    id: "5",
    title: "NOVAGEN",
    subtitle: "@novagen",
    description: "Membangun masa depan pengalaman digital untuk brand Novagen.",
    slug: "novagen",
    coverImage: "/projects/novagen.webp",
    linkUrl: "https://www.novagen.id/",
    tags: ["Next.js", "UI", "Motion"],
  },
  {
    id: "6",
    title: "JAGA SERIBU",
    subtitle: "jagaseribu",
    description:
      "Website komunitas dan inisiatif Jaga Seribu dengan fokus pada konten yang mudah dijelajahi.",
    slug: "jagaseribu",
    coverImage: "/projects/jagaseribu.webp",
    linkUrl: "https://jagaseribu.my.id/",
    tags: ["Frontend", "Responsive"],
  },
  {
    id: "7",
    title: "BSP",
    subtitle: "Bhakti Satria Perkasa",
    description:
      "Website perusahaan PT Bhakti Satria Perkasa untuk layanan keamanan swasta, penempatan kerja, dan debt collection.",
    slug: "bsp",
    coverImage: "/projects/bsp.webp",
    linkUrl: "https://bhakti-satria-perkasa.netlify.app/",
    tags: ["Corporate", "Landing"],
  },
  {
    id: "8",
    title: "RUMAH KECE",
    subtitle: "@kece.entertainment",
    description:
      "Landing page brand entertainment dengan pesan growth-focused dan visual yang kuat.",
    slug: "rumahkece",
    coverImage: "/projects/rumahkece.webp",
    linkUrl: "https://golden-torrone-06010c.netlify.app/",
    tags: ["Landing", "Branding"],
  },
  {
    id: "9",
    title: "IFANI SHOP",
    subtitle: "@ifanishop",
    description:
      "Toko online Ifani Shop dengan katalog produk dan alur belanja yang ringkas.",
    slug: "ifani-shop",
    coverImage: "/projects/ifani-shop.webp",
    linkUrl: "https://hilarious-travesseiro-68a01b.netlify.app/",
    tags: ["E-commerce", "UI"],
  },
  {
    id: "10",
    title: "A3MALL",
    subtitle: "a3mall",
    description:
      "Website mall digital A3MALL untuk menampilkan tenant, promo, dan informasi pusat belanja.",
    slug: "a3mall",
    coverImage: "/projects/a3mall.webp",
    linkUrl: "https://sleepy-engelbart-fcdf49.netlify.app/",
    tags: ["Frontend", "Catalog"],
  },
  {
    id: "11",
    title: "BELI AYAM",
    subtitle: "beliayam.com",
    description:
      "Platform pemesanan ayam online dengan fokus pada kemudahan order dan informasi produk.",
    slug: "beliayam",
    coverImage: "/projects/beliayam.webp",
    linkUrl: "https://elated-hypatia-60d9d9.netlify.app/",
    tags: ["E-commerce", "Landing"],
  },
  {
    id: "12",
    title: "RAJA LACAK",
    subtitle: "Mitra Lacak",
    description:
      "Kontrol armada dengan perangkat teknologi dan laporan perjalanan untuk digitalisasi manajemen transportasi.",
    slug: "rajalacak",
    coverImage: "/projects/rajalacak.webp",
    linkUrl: "https://rajalacak.id/",
    tags: ["Svelte", "TypeScript", "Dashboard"],
  },
];

export const navLinks = [
  { href: "#about", label: "Tentang" },
  { href: "#skills", label: "Keahlian" },
  { href: "#work", label: "Proyek" },
  { href: "#contact", label: "Kontak" },
] as const;

export const profile = {
  name: "Christian Grise",
  role: "iOS Engineer",
  tagline:
    "Senior Mobile Developer with 14+ years engineering healthcare and telehealth mobile applications in Swift and Objective-C.",
  // No location provided yet — leave unset; Contact section hides the
  // Location row automatically when this is empty.
  location: "",
  email: "christian.grise@gmail.com",
  resumeUrl: "/resume.pdf",
  avatarInitials: "CG",
  // Used by src/lib/github.ts to pull live repos into the Projects section.
  githubUsername: "Haberdashery1234",
};

// Contact form submissions POST here (see src/components/Contact.tsx).
// Manage/view submissions at https://formspree.io/forms.
export const formspreeEndpoint = "https://formspree.io/f/xoearqov";

export const socials = [
  { label: "GitHub", href: `https://github.com/${profile.githubUsername}`, icon: "github" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/christiangrise/", icon: "linkedin" },
  { label: "Email", href: `mailto:${profile.email}`, icon: "mail" },
  { label: "Resume", href: profile.resumeUrl, icon: "file-text" },
] as const;

export const about = {
  heading: "About",
  // TODO(christian): replace with real bio copy — placeholder for now, per
  // your request to hold off on this section.
  paragraphs: [
    "I'm a software engineer who enjoys turning ambiguous problems into clean, reliable products. My background spans full-stack web development, with a focus on building interfaces that feel fast and code that's easy to maintain.",
    "Outside of work I like exploring new tools, contributing to side projects, and learning how things work under the hood. I'm currently open to new opportunities — feel free to reach out.",
  ],
  stats: [
    { label: "Years Experience", value: "14+" },
    { label: "Apps Shipped Professionally", value: "10+" },
  ],
  // Companies/apps you've shipped iOS work for — shown as a "worked with"
  // strip under the bio, and as clickable app icons in the hero's phone
  // mockup. `logo` is optional — omit it for a company without an icon yet
  // and it falls back to a colored initials tile automatically. `url`
  // defaults to "#" — TODO(christian): swap in each app's real App Store
  // (or website) link.
  clients: [
    { name: "Amwell", logo: "/logos/amwell-patient.png", url: "#" },
    { name: "Amwell for Clinicians", logo: "/logos/amwell-clinicians.png", url: "#" },
    { name: "The Boston Globe", logo: "/logos/boston-globe.png", url: "#" },
    { name: "Blue Cross Blue Shield", logo: "/logos/blue-cross-medavie.png", url: "#" },
    { name: "Wawa", logo: "/logos/wawa.png", url: "#" },
  ],
};

export type Project = {
  name: string;
  category: string;
  description: string;
  // Full set — the card only shows the first few, the detail modal shows
  // all of them.
  tags: string[];
  href?: string;
  repo?: string;
  year: string;
  stars?: number;
  // Everything below is only ever shown in the detail modal, not the card
  // — it's what makes "view details" actually show more than a bigger
  // version of the same card.
  createdAt?: string;
  updatedAt?: string;
  forks?: number;
  license?: string;
};

// Fallback content, used only if the live GitHub fetch in src/lib/github.ts
// fails (offline, rate-limited, etc.) or the account has no public,
// non-fork repos yet. Edit freely, or ignore it — real repos take priority.
export const placeholderProjects: Project[] = [
  {
    name: "Project One",
    category: "Web App",
    description:
      "A short placeholder description of what this project does and the problem it solves for its users.",
    tags: ["Next.js", "TypeScript", "PostgreSQL"],
    href: "#",
    repo: "#",
    year: "2026",
    createdAt: "Jan 2026",
    updatedAt: "Aug 2026",
    forks: 3,
    license: "MIT",
  },
  {
    name: "Project Two",
    category: "Mobile App",
    description:
      "A short placeholder description of what this project does and the problem it solves for its users.",
    tags: ["React Native", "Node.js"],
    href: "#",
    repo: "#",
    year: "2025",
    createdAt: "Feb 2025",
    updatedAt: "Nov 2025",
    forks: 1,
    license: "MIT",
  },
  {
    name: "Project Three",
    category: "Open Source",
    description:
      "A short placeholder description of what this project does and the problem it solves for its users.",
    tags: ["TypeScript", "CLI"],
    href: "#",
    repo: "#",
    year: "2025",
    createdAt: "May 2024",
    updatedAt: "Mar 2025",
    forks: 8,
    license: "Apache-2.0",
  },
  {
    name: "Project Four",
    category: "API / Backend",
    description:
      "A short placeholder description of what this project does and the problem it solves for its users.",
    tags: ["Python", "FastAPI", "Docker"],
    href: "#",
    repo: "#",
    year: "2024",
    createdAt: "Sep 2023",
    updatedAt: "Jun 2024",
    forks: 2,
    license: "MIT",
  },
  {
    name: "Project Five",
    category: "Design",
    description:
      "A short placeholder description of what this project does and the problem it solves for its users.",
    tags: ["Figma", "Design System"],
    href: "#",
    repo: "#",
    year: "2024",
    createdAt: "Jan 2024",
    updatedAt: "Apr 2024",
    forks: 0,
  },
  {
    name: "Project Six",
    category: "Web App",
    description:
      "A short placeholder description of what this project does and the problem it solves for its users.",
    tags: ["React", "GraphQL"],
    href: "#",
    repo: "#",
    year: "2023",
    createdAt: "Jun 2022",
    updatedAt: "Dec 2023",
    forks: 5,
    license: "MIT",
  },
];

// Pulled from Christian's resume (SKILLS section).
export const skills = {
  heading: "Skills & Tools",
  groups: [
    {
      label: "Languages & Frameworks",
      items: [
        "Swift",
        "Objective-C",
        "Flutter",
        "Core Animation",
        "Core Data",
        "Auto Layout",
        "GCD",
        "SQLite",
        "RESTful APIs",
        "Firebase",
        "Combine",
      ],
    },
    {
      label: "Architecture",
      items: ["MVVM", "MVC", "SDK Development", "Server-Driven UI"],
    },
    {
      label: "UI / UX",
      items: ["SwiftUI", "UIKit", "Storyboard", "Sketch", "Figma"],
    },
    {
      label: "Testing & Debugging",
      items: ["Unit Testing", "UI Testing", "Instruments", "XCTest"],
    },
    {
      label: "Tools & Workflow",
      items: [
        "Xcode",
        "Android Studio",
        "IntelliJ",
        "CocoaPods",
        "Git",
        "GitHub",
        "Jenkins",
        "CI/CD",
        "JIRA",
        "GitHub Copilot",
        "Claude Code",
      ],
    },
    {
      label: "General",
      items: [
        "Concurrency",
        "Legacy Refactoring",
        "Accessibility",
        "Leadership",
        "Technical Translation",
      ],
    },
  ],
};

export const nav = [
  { label: "About", href: "#about" },
  { label: "Projects", href: "#projects" },
  { label: "Skills", href: "#skills" },
  { label: "Contact", href: "#contact" },
];

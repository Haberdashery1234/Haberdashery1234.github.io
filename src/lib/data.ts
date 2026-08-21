export const profile = {
  name: "Christian Grise",
  role: "iOS Engineer",
  tagline:
    "Senior Mobile Developer with 10+ years engineering healthcare and telehealth mobile applications in Swift and Objective-C.",
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
    { label: "Years Experience", value: "10+" },
    { label: "Apps Shipped Professionally", value: "10+" },
  ],
  // Companies/apps you've shipped iOS work for — shown as a "worked with"
  // strip under the bio, and as clickable app icons in the hero's phone
  // mockup. `logo` is optional — omit it for a company without an icon yet
  // and it falls back to a colored initials tile automatically. `url`
  // defaults to "#" — TODO(christian): swap in each app's real App Store
  // (or website) link.
  clients: [
    { name: "Amwell", logo: "/logos/amwell-patient.png", url: "https://apps.apple.com/us/app/amwell-doctor-visits-24-7/id655783752" },
    { name: "Amwell for Clinicians", logo: "/logos/amwell-clinicians.png", url: "https://apps.apple.com/us/app/american-well-for-clinicians/id982388638" },
    { name: "The Boston Globe", logo: "/logos/boston-globe.png", url: "https://apps.apple.com/ca/app/the-boston-globe-epaper/id511127322" },
    { name: "Blue Cross Medavie", logo: "/logos/blue-cross-medavie.png", url: "https://apps.apple.com/ca/app/blue-cross-mobile/id674013263" },
    { name: "Wawa", logo: "/logos/wawa.png", url: "https://apps.apple.com/ca/app/wawa/id938319774" },
  ],
};

export type Project = {
  name: string;
  category: string;
  description: string;
  tags: string[];
  href?: string;
  repo?: string;
  year: string;
  stars?: number;
};

// Fallback content, used only if the live GitHub fetch in src/lib/github.ts
// fails (offline, rate-limited, etc.) or the account has no public,
// non-fork repos yet. Edit freely, or ignore it — real repos take priority.
export const placeholderProjects: Project[] = [
  {
    name: "Clarity",
    category: "Mobile App",
    description:
      "A UIKit portfolio app that turns pasted text, a shared link/PDF, or a scanned document into a plain-language summary — entirely on-device via ClearDoc. MVVM + Repository + Coordinator architecture.",
    tags: ["UIKit", "SwiftData", "VisionKit", "MVVM"],
    href: "https://github.com/Haberdashery1234/Clarity",
    repo: "https://github.com/Haberdashery1234/Clarity",
    year: "2026",
  },
  {
    name: "ClearDoc",
    category: "Framework",
    description:
      "An on-device text-clarification framework for iOS 26+, built on Apple's Foundation Models. Give it free text and get back a structured summary — no network call, no data leaves the device.",
    tags: ["Swift", "Foundation Models", "On-device AI"],
    href: "https://github.com/Haberdashery1234/ClearDoc",
    repo: "https://github.com/Haberdashery1234/ClearDoc",
    year: "2026",
  },
  {
    name: "HABDesignSystem",
    category: "Design System",
    description:
      "A reusable iOS design system — tokens, a runtime-swappable theming layer, and a UIKit component library — shared across projects instead of rebuilding the same buttons and cards per app.",
    tags: ["Swift Package", "UIKit", "Design Tokens"],
    href: "https://github.com/Haberdashery1234/HABDesignSystem",
    repo: "https://github.com/Haberdashery1234/HABDesignSystem",
    year: "2026",
  },
  {
    name: "MeterReaderKeeper",
    category: "Mobile App",
    description:
      "A UIKit app for tracking utility meter readings across buildings and floors — scan a meter's QR code, log a reading, and export or email the full history.",
    tags: ["UIKit", "Core Data", "AVFoundation"],
    href: "https://github.com/Haberdashery1234/MeterReaderKeeper",
    repo: "https://github.com/Haberdashery1234/MeterReaderKeeper",
    year: "2021",
  },
  {
    name: "RogueFantasy",
    category: "Game",
    description:
      "A Godot-based roguelike/RPG prototype with tactical turn-based combat, a file-driven encounter system, full equipment/job restrictions, and auto-saving mid-battle.",
    tags: ["Godot", "GDScript", "Game Dev"],
    href: "https://github.com/Haberdashery1234/RogueFantasy",
    repo: "https://github.com/Haberdashery1234/RogueFantasy",
    year: "2024",
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

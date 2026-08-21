import type { ReactNode } from "react";
import Image from "next/image";
import { SignalHigh, Wifi, BatteryFull, Folder } from "lucide-react";
import { about, socials } from "@/lib/data";
import { iconMap } from "@/components/icons";

// Home-screen-style tile colors, one per client — purely decorative, no
// real logos used (just initials on a color swatch, like an iOS icon).
const TILE_COLORS = ["#5b6cff", "#0f766e", "#c026d3", "#ea580c", "#0891b2", "#dc2626"];

function initials(name: string) {
  return name
    .replace(/^The\s+/i, "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function AppIcon({
  label,
  href,
  logo,
  color,
  children,
}: {
  label: string;
  href?: string;
  logo?: string;
  color?: string;
  children?: ReactNode;
}) {
  const content = (
    <>
      {logo ? (
        <div className="relative h-12 w-12 shadow-lg">
          <Image src={logo} alt={label} fill sizes="48px" className="object-contain" />
        </div>
      ) : (
        <div
          className="h-12 w-12 rounded-[13px] flex items-center justify-center text-white text-sm font-semibold shadow-lg"
          style={{ backgroundColor: color }}
        >
          {children}
        </div>
      )}
      <span className="text-[10px] leading-tight text-center text-white/80">{label}</span>
    </>
  );

  if (href) {
    const external = href.startsWith("http");
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        aria-label={label}
        className="flex flex-col items-center gap-1.5 w-14 transition-opacity hover:opacity-80"
      >
        {content}
      </a>
    );
  }

  return <div className="flex flex-col items-center gap-1.5 w-14">{content}</div>;
}

type IconComponent = (typeof iconMap)[keyof typeof iconMap];

// "tile" = a glyph icon (Mail, FileText) drawn centered on a colored square
// we provide. "badge" = GitHub/LinkedIn's own SVGs already draw their own
// rounded-square/circle backdrop as part of the path, so they're rendered
// at full size with no extra background behind them (adding one would just
// nest a second shape inside the icon's own shape).
type DockItem =
  | { label: string; href: string; external: boolean; variant: "tile"; bg: string; icon: IconComponent }
  | { label: string; href: string; external: boolean; variant: "badge"; color: string; icon: IconComponent }
  | { label: string; href: string; external: boolean; variant: "image"; src: string };

export default function PhoneMockup() {
  const github = socials.find((s) => s.icon === "github");
  const linkedin = socials.find((s) => s.icon === "linkedin");
  const resume = socials.find((s) => s.icon === "file-text");

  const dock: DockItem[] = [
    { label: "Contact", href: "#contact", external: false, variant: "image", src: "/messages-icon.png" },
    ...(github
      ? [{ label: "GitHub", href: github.href, external: true, variant: "badge" as const, color: "#ffffff", icon: iconMap.github }]
      : []),
    ...(linkedin
      ? [{ label: "LinkedIn", href: linkedin.href, external: true, variant: "badge" as const, color: "#0a66c2", icon: iconMap.linkedin }]
      : []),
    ...(resume
      ? [{ label: "Resume", href: resume.href, external: false, variant: "tile" as const, bg: "#ffffff", icon: iconMap["file-text"] }]
      : []),
  ];

  return (
    <div className="relative mx-auto w-[240px] sm:w-[270px] select-none">
      {/* ambient glow */}
      <div className="absolute -inset-10 bg-accent/25 blur-[70px] rounded-full pointer-events-none" />

      {/* phone body */}
      <div className="relative aspect-[9/19.5] rounded-[2.75rem] border-[6px] border-[#1c1c1f] bg-[#0b0b0d] shadow-2xl shadow-black/60">
        {/* side buttons */}
        <div className="absolute -left-[6px] top-[86px] h-6 w-[3px] rounded-l bg-[#1c1c1f]" />
        <div className="absolute -left-[6px] top-[118px] h-10 w-[3px] rounded-l bg-[#1c1c1f]" />
        <div className="absolute -left-[6px] top-[152px] h-10 w-[3px] rounded-l bg-[#1c1c1f]" />
        <div className="absolute -right-[6px] top-[130px] h-14 w-[3px] rounded-r bg-[#1c1c1f]" />

        {/* screen */}
        <div className="absolute inset-0 rounded-[2.1rem] overflow-hidden bg-gradient-to-b from-[#131316] to-[#08080a]">
          {/* dynamic island */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 h-[18px] w-[76px] rounded-full bg-black z-20" />

          {/* status bar */}
          <div className="flex items-center justify-between px-5 pt-3 text-white/90">
            <span className="text-[11px] font-medium tabular-nums">9:41</span>
            <div className="flex items-center gap-1">
              <SignalHigh size={12} />
              <Wifi size={12} />
              <BatteryFull size={14} />
            </div>
          </div>

          {/* app grid: companies/apps Christian has shipped iOS work for */}
          <div className="grid grid-cols-4 gap-x-2 gap-y-3 px-4 pt-8">
            {about.clients?.map((client, i) =>
              client.logo ? (
                <AppIcon key={client.name} label={client.name} href={client.url} logo={client.logo} />
              ) : (
                <AppIcon
                  key={client.name}
                  label={client.name}
                  href={client.url}
                  color={TILE_COLORS[i % TILE_COLORS.length]}
                >
                  {initials(client.name)}
                </AppIcon>
              )
            )}
            <AppIcon label="Personal Projects" href="#projects" color="#3f3f46">
              <Folder size={20} />
            </AppIcon>
          </div>

          {/* dock */}
          <div className="absolute bottom-4 left-3 right-3 rounded-[24px] bg-white/10 backdrop-blur px-3 py-2.5 flex items-center justify-around">
            {dock.map((item) => {
              if (item.variant === "image") {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    className="relative h-10 w-10 block transition-opacity hover:opacity-90"
                  >
                    <Image src={item.src} alt={item.label} fill sizes="40px" className="object-contain" />
                  </a>
                );
              }
              const Icon = item.icon;
              if (item.variant === "badge") {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    className="h-10 w-10 flex items-center justify-center transition-opacity hover:opacity-90"
                  >
                    {Icon ? (
                      <Icon size={40} className="w-10 h-10" style={{ color: item.color }} />
                    ) : null}
                  </a>
                );
              }
              const isWhiteBg = item.bg === "#ffffff";
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  className="h-10 w-10 rounded-[11px] flex items-center justify-center transition-opacity hover:opacity-90"
                  style={{ backgroundColor: item.bg }}
                >
                  {Icon ? (
                    <Icon size={18} className={isWhiteBg ? "text-[#0b0b0d]" : "text-white"} />
                  ) : null}
                </a>
              );
            })}
          </div>

          {/* home indicator */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-24 rounded-full bg-white/40" />
        </div>
      </div>
    </div>
  );
}

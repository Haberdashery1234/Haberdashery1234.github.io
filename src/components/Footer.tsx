import { profile, socials, nav } from "@/lib/data";
import { iconMap } from "@/components/icons";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border mt-10">
      <div className="section-shell py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <p className="font-semibold">{profile.name}</p>
          <p className="text-sm text-muted">{profile.role}</p>
        </div>

        <ul className="flex items-center gap-6 text-sm text-muted">
          {nav.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="hover:text-foreground transition-colors">
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4">
          {socials.map((social) => {
            const Icon = iconMap[social.icon];
            return (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                target={social.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="text-muted hover:text-accent transition-colors"
              >
                {Icon ? <Icon size={18} /> : social.label}
              </a>
            );
          })}
        </div>
      </div>
      <div className="section-shell pb-8 text-xs text-muted">
        © {year} {profile.name}. All rights reserved.
      </div>
    </footer>
  );
}

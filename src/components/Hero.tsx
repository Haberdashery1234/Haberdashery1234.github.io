import { profile, socials } from "@/lib/data";
import { iconMap } from "@/components/icons";
import PhoneMockup from "@/components/PhoneMockup";

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="absolute inset-0 hero-glow pointer-events-none" />
      <div className="section-shell relative pt-28 pb-24 sm:pt-36 sm:pb-32">
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-16 items-center">
          <div>
            <p className="text-sm font-mono text-accent mb-4">
              Hi, I&apos;m {profile.name.split(" ")[0]} 👋
            </p>
            <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight max-w-3xl">
              <span className="glow-text">{profile.role}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted">{profile.tagline}</p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="#contact"
                className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                Let&apos;s Connect
              </a>
              <a
                href="#projects"
                className="rounded-full border border-border px-6 py-3 text-sm font-medium hover:border-accent hover:text-accent transition-colors"
              >
                View Projects
              </a>
            </div>

            <div className="mt-12 flex items-center gap-5">
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
                    {Icon ? <Icon size={20} /> : social.label}
                  </a>
                );
              })}
            </div>
          </div>

          <div className="order-first lg:order-last">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

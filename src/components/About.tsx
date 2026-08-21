import { about } from "@/lib/data";

export default function About() {
  return (
    <section id="about" className="section-shell py-20 sm:py-28">
      <p className="text-sm font-mono text-accent mb-3">{about.heading}</p>
      <div className="grid md:grid-cols-3 gap-12">
        <div className="md:col-span-2 space-y-5 text-muted text-base sm:text-lg leading-relaxed">
          {about.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}

          {about.clients && about.clients.length > 0 && (
            <div className="pt-4">
              <p className="text-xs uppercase tracking-wide text-muted mb-3">
                Worked with
              </p>
              <div className="flex flex-wrap gap-2">
                {about.clients.map((client) => (
                  <span
                    key={client.name}
                    className="text-sm rounded-full border border-border px-3 py-1.5 text-foreground/90"
                  >
                    {client.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <dl className="grid grid-cols-2 md:grid-cols-1 gap-6">
          {about.stats.map((stat) => (
            <div key={stat.label} className="card p-5">
              <dt className="text-xs uppercase tracking-wide text-muted">{stat.label}</dt>
              <dd className="text-2xl font-semibold mt-1">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

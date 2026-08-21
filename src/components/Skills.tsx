import { skills } from "@/lib/data";

export default function Skills() {
  return (
    <section id="skills" className="section-shell py-20 sm:py-28">
      <p className="text-sm font-mono text-accent mb-3">Skills</p>
      <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-12">
        {skills.heading}
      </h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {skills.groups.map((group) => (
          <div key={group.label} className="card p-6">
            <h3 className="text-sm font-mono text-muted mb-4">{group.label}</h3>
            <ul className="space-y-2">
              {group.items.map((item) => (
                <li key={item} className="text-sm text-foreground/90 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

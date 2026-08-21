import { Suspense } from "react";
import ProjectsGrid from "@/components/ProjectsGrid";

// The actual GitHub fetch happens client-side inside ProjectsGrid (this is
// a static-exported site with no server to fetch from at request time) —
// this component just provides the section shell.
export default function Projects() {
  return (
    <section id="projects" className="section-shell py-20 sm:py-28">
      <Suspense fallback={null}>
        <ProjectsGrid />
      </Suspense>
    </section>
  );
}

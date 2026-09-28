import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { SpatialScene } from "@/components/SpatialScene";
import { Projects } from "@/components/Projects";
import { Skills } from "@/components/Skills";

export default function Home() {
  return (
    <main id="main">
      <SpatialScene>
        <About />
        <Skills />
        <Projects />
        <Contact />
      </SpatialScene>
    </main>
  );
}

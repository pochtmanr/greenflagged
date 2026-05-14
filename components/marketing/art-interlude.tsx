import Image from "next/image";
import { LANDING_ART } from "@/lib/landing/images";
import { Reveal } from "./reveal";

/**
 * Full-bleed painted band between Sample Verdict and Pricing. Acts as a
 * narrative breath — picks up the painterly aesthetic, no decoration overload.
 */
export function ArtInterlude() {
  const art = LANDING_ART.intermission;
  return (
    <Reveal as="section" className="art-interlude" cssIndex={0}>
      <div className="art-interlude__image">
        <Image
          src={art.src}
          alt={art.alt}
          fill
          sizes="100vw"
          priority={false}
          quality={85}
        />
      </div>
      <div className="art-interlude__overlay">
        <div className="container art-interlude__inner">
          <div className="art-interlude__panel">
            <span className="gf-label art-interlude__eyebrow">
              // INTERMISSION · ON THE WEIGHT OF SMALL PRINT
            </span>
            <p className="art-interlude__pull">
              Every contract is someone standing in the rain, hoping the words
              above them mean what they think they mean. We just turn the lights
              on.
            </p>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

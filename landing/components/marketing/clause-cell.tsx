import Image from "next/image";
import { LANDING_ART, type LandingArtKey } from "@/lib/landing/images";
import { Reveal } from "./reveal";

type Props = {
  n: string;
  id: string;
  title: string;
  example: string;
  art: LandingArtKey;
  index: number;
};

export function ClauseCell({ n, id, title, example, art, index }: Props) {
  const image = LANDING_ART[art];
  return (
    <Reveal
      as="article"
      className="clause-cell clause-cell--art"
      delayMs={index * 60}
    >
      <Image
        src={image.src}
        alt=""
        fill
        sizes="(max-width: 540px) 100vw, (max-width: 980px) 50vw, 280px"
        quality={75}
        className="clause-cell__bg"
      />
      <span className="clause-cell__thumb-tag gf-mono-sm">
        // {id.toUpperCase()}
      </span>
      <div className="clause-cell__panel">
        <span className="gf-label clause-cell__n">
          {n} / {id.toUpperCase()}
        </span>
        <h4 className="gf-h4 clause-cell__title">{title}</h4>
        <p className="gf-body-sm clause-cell__body">{example}</p>
      </div>
    </Reveal>
  );
}

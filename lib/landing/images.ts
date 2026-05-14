export type LandingArtKey =
  | "gateway"
  | "tower"
  | "figureRed"
  | "path"
  | "reflection"
  | "deerForest"
  | "deerClearing"
  | "viewpoint"
  | "intermission";

export type LandingArt = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export const LANDING_ART: Record<LandingArtKey, LandingArt> = {
  gateway: {
    src: "/landing/art/art-gateway.avif",
    alt: "Lone figure facing a luminous garden gateway in falling rain",
    width: 928,
    height: 1232,
  },
  tower: {
    src: "/landing/art/art-tower.avif",
    alt: "Beam of light descending onto a tower in a green plaza",
    width: 928,
    height: 1232,
  },
  figureRed: {
    src: "/landing/art/art-figure-red.avif",
    alt: "Woman in a red dress walking away through evergreen forest",
    width: 928,
    height: 1232,
  },
  path: {
    src: "/landing/art/art-path.avif",
    alt: "A solitary figure on a stone path beside still water",
    width: 928,
    height: 1232,
  },
  reflection: {
    src: "/landing/art/art-reflection.avif",
    alt: "Man in suit standing before a city reflected in flooded ground",
    width: 928,
    height: 1232,
  },
  deerForest: {
    src: "/landing/art/art-deer-forest.avif",
    alt: "Deer at the edge of a deep evergreen forest in rain",
    width: 928,
    height: 1232,
  },
  deerClearing: {
    src: "/landing/art/art-deer-clearing.avif",
    alt: "Deer entering a narrow clearing between tall green trees",
    width: 928,
    height: 1232,
  },
  viewpoint: {
    src: "/landing/art/art-viewpoint.avif",
    alt: "Figure looking out over a distant ridge through pixelated rain",
    width: 928,
    height: 1232,
  },
  intermission: {
    src: "/landing/art/art-intermission.avif",
    alt: "Suited figure facing a deep blue inlet ringed by rain-veiled buildings",
    width: 2944,
    height: 1648,
  },
};

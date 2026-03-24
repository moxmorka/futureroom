import type { ModuleEngine } from "./engines/base";

import { createClockEngine } from "./engines/Clock";
import { createOutputEngine } from "./engines/Output";
import { createScopeTapEngine } from "./engines/ScopeTap";

import { createDigitoneEngine } from "./engines/Digitone";
import { createDigitaktEngine } from "./engines/Digitakt";
import { createMonomachineEngine } from "./engines/Monomachine";

import { createSamplerEngine } from "./engines/Sampler";
import { createPixelSeqEngine } from "./engines/PixelSeq";
import { createEuclideanSeqEngine } from "./engines/Euclidean";

import { createMixerEngine } from "./engines/Mixer";
import { createMixer8Engine } from "./engines/Mixer8";

export function createEngine(moduleType: string, params?: Record<string, any>): ModuleEngine {
  switch (moduleType) {
    case "clock":
      return createClockEngine(params);
    case "output":
      return createOutputEngine();
    case "scopeTap":
      return createScopeTapEngine();
    case "digitone":
      return createDigitoneEngine(params);
    case "digitakt":
      return createDigitaktEngine(params);
    case "monomachine":
      return createMonomachineEngine(params);
    case "sampler":
      return createSamplerEngine(params);
    case "pixelseq":
      return createPixelSeqEngine(params);
    case "euclidseq":
      return createEuclideanSeqEngine(params);
    case "mixer":
      return createMixerEngine(params);
    case "mixer8":
      return createMixer8Engine(params);
    default:
      throw new Error(`Unknown moduleType: ${moduleType}`);
  }
}

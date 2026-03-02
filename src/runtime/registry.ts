import type { ModuleEngine } from "./engines/base";
import { createFMVoiceEngine } from "./engines/FMVoice";
import { createSamplerEngine } from "./engines/Sampler";
import { createOutputEngine } from "./engines/Output";
import { createScopeTapEngine } from "./engines/ScopeTap";
import { createClockEngine } from "./engines/Clock";
import { createSequencerEngine } from "./engines/Sequencer";

export function createEngine(moduleType: string, params?: Record<string, any>): ModuleEngine {
  switch (moduleType) {
    case "fmVoice": return createFMVoiceEngine(params);
    case "sampler": return createSamplerEngine(params);
    case "output": return createOutputEngine();
    case "scopeTap": return createScopeTapEngine();
    case "clock": return createClockEngine(params);
    case "sequencer": return createSequencerEngine(params);
    default: throw new Error(`Unknown moduleType: ${moduleType}`);
  }
}

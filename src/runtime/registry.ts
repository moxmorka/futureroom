import type { ModuleEngine } from "./engines/base";
import { createClockEngine } from "./engines/Clock";
import { createOutputEngine } from "./engines/Output";
import { createScopeTapEngine } from "./engines/ScopeTap";
import { createDigitoneEngine } from "./engines/Digitone";
import { createDigitaktEngine } from "./engines/Digitakt";
import { createMonomachineEngine } from "./engines/Monomachine";

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
    default:
      throw new Error(`Unknown moduleType: ${moduleType}`);
  }
}

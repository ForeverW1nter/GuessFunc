import { GameEngineRegistry } from "@/core/GameEngineRegistry";
import { GuessFuncEngine } from "./GuessFuncEngine";

export const initGuessFuncModule = async () => {
  // Register the engine protocol for Universal Terminal and other host modules (e.g. Archive, Network)
  // GuessFunc is a foundational engine, NOT a top-level standalone app module.
  GameEngineRegistry.registerEngine("guessfunc", () => new GuessFuncEngine());
};

import { ModuleRegistry, type GameModule } from "@/core/ModuleRegistry";
import { GameEngineRegistry } from "@/core/GameEngineRegistry";
import { GuessFuncPage } from "@/modules/guessfunc/GuessFuncPage";
import { GuessFuncEngine } from "./GuessFuncEngine";
import { Terminal } from "lucide-react";

export const initGuessFuncModule = async () => {
  const mod: GameModule = {
    id: "guessfunc",
    name: "GUESS FUNC",
    description: "A math guessing game",
    version: "1.0.0",
    coreApiVersion: "^1.0.0",
    entryRoute: "/guessfunc",
    routes: [{ path: "guessfunc", element: <GuessFuncPage /> }],
    icon: Terminal,
    color: "var(--accent-guessfunc)",
    titleKey: "hub.guessFunc.title",
    subtitleKey: "hub.guessFunc.subtitle",
    descKey: "hub.guessFunc.desc",
    init: () => {
      console.log("[GuessFunc] Engine initialized. Awaiting level payload...");
    },
  };

  // Register the module routing
  await ModuleRegistry.register(mod);

  // Register the engine protocol for Universal Terminal
  GameEngineRegistry.registerEngine("guessfunc", () => new GuessFuncEngine());
};

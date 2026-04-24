import { ModuleRegistry, type GameModule } from "@/core/ModuleRegistry";
import { GuessFuncPage } from "@/modules/guessfunc/GuessFuncPage";

export const initGuessFuncModule = async () => {
  const mod: GameModule = {
    id: "guessfunc",
    name: "GUESS FUNC",
    description: "A math guessing game",
    version: "1.0.0",
    coreApiVersion: "^1.0.0",
    entryRoute: "/guessfunc",
    routes: [{ path: "guessfunc", element: <GuessFuncPage /> }],
    init: () => {
      console.log("[GuessFunc] Engine initialized. Awaiting level payload...");
    },
  };

  await ModuleRegistry.register(mod);
};

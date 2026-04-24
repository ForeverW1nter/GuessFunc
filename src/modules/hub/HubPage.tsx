import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Database, Globe2, Terminal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";

const HOVER_DELAY_MULTIPLIER = 0.1;
const ANIMATION_DURATION_HEADER = 0.8;
const ANIMATION_DURATION_CARD = 0.8;
const ANIMATION_EASE_CARD = [0.22, 1, 0.36, 1] as const;
const ANIMATION_OFFSET_Y = 20;

export const HubPage = () => {
  const { t } = useTranslation();

  const MODES = [
    {
      id: "guessfunc",
      title: t('hub.guessFunc.title', 'GUESS FUNC'),
      subtitle: t('hub.guessFunc.subtitle', 'Math Engine / Sandbox'),
      desc: t('hub.guessFunc.desc', 'A fully featured mathematical sandbox. Analyze signal patterns and reconstruct unknown functions.'),
      path: "/guessfunc",
      icon: Terminal,
      color: "group-hover:text-[var(--accent-guessfunc)]",
      bgHover: "var(--accent-guessfunc)",
    },
    {
      id: "archive",
      title: t('hub.archive.title', 'THE ARCHIVE'),
      subtitle: t('hub.archive.subtitle', 'Story Mode / Secure Files'),
      desc: t('hub.archive.desc', 'Access decrypted logs, emails, and story nodes. Solve integrated logic puzzles to unlock the truth.'),
      path: "/archive",
      icon: Database,
      color: "group-hover:text-[var(--accent-archive)]",
      bgHover: "var(--accent-archive)",
    },
    {
      id: "network",
      title: t('hub.network.title', 'GLOBAL NETWORK'),
      subtitle: t('hub.network.subtitle', 'Workshop / Community'),
      desc: t('hub.network.desc', 'Connect to the global network. Download and play raw logic gates and math puzzles created by other operators.'),
      path: "/workshop",
      icon: Globe2,
      color: "group-hover:text-[var(--accent-network)]",
      bgHover: "var(--accent-network)",
    },
    {
      id: "creator",
      title: t('hub.studio.title', 'CREATOR TERMINAL'),
      subtitle: t('hub.studio.subtitle', 'Studio / Level Builder'),
      desc: t('hub.studio.desc', 'Design, test, and upload your own logic challenges to the network. Support for both Math Engine and Gate Engine.'),
      path: "/creator",
      icon: Terminal,
      color: "group-hover:text-[var(--accent-studio)]",
      bgHover: "var(--accent-studio)",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] flex flex-col items-center justify-center p-8 relative overflow-x-hidden">
      {/* Decorative background elements */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-[var(--accent-hub)] blur-[100px] pointer-events-none transition-opacity duration-500"
        style={{ opacity: "var(--glow-opacity)" }}
      />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] rounded-full bg-[var(--accent-archive)] blur-[100px] pointer-events-none transition-opacity duration-500"
        style={{ opacity: "var(--glow-opacity)" }}
      />

      <motion.header
        initial={{ opacity: 0, y: -ANIMATION_OFFSET_Y }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: ANIMATION_DURATION_HEADER, ease: "easeOut" }}
        className="absolute top-8 w-full px-12 flex justify-between items-start z-10"
      >
        <div>
          <h1 className="text-sm font-mono tracking-[0.3em] opacity-50 uppercase">
            SYSTEM.CORE_v2.0
          </h1>
          <p className="text-xs font-mono opacity-30 mt-1">STATUS: ONLINE</p>
        </div>
      </motion.header>

      <div className="w-full max-w-5xl flex flex-col gap-2 mt-20">
        {MODES.map((mode, index) => (
          <motion.div
            key={mode.id}
            initial={{ opacity: 0, y: ANIMATION_OFFSET_Y }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: ANIMATION_DURATION_CARD,
              delay: HOVER_DELAY_MULTIPLIER * index,
              ease: ANIMATION_EASE_CARD,
            }}
          >
            <Link
              to={mode.path}
              className="group relative block w-full outline-none"
            >
              <motion.div
                layoutId={`card-container-${mode.id}`}
                className="relative py-8 md:py-10 px-6 md:px-8 rounded-3xl border border-[var(--color-border)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-8 transition-all duration-500 hover:bg-[var(--card-hover-bg)] hover:border-[var(--card-hover-border)] hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
              >
              {/* Subtle background glow linked to accent color */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-700 pointer-events-none"
                style={{ backgroundColor: mode.bgHover }}
              />
              {/* Left Side: Index & Title */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 z-10 w-full md:w-auto">
                <span
                  className={cn(
                    "text-2xl font-mono opacity-20 group-hover:opacity-100 transition-all duration-500",
                    mode.color
                  )}
                >
                  0{index + 1}
                </span>
                <div className="w-full">
                  <motion.h2
                    layoutId={`card-title-${mode.id}`}
                    className={cn(
                      "text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter transition-colors duration-500",
                      mode.color
                    )}
                  >
                    {mode.title}
                  </motion.h2>
                  <p className="text-xs md:text-sm font-mono tracking-[0.2em] mt-2 md:mt-4 opacity-50 uppercase group-hover:opacity-80 transition-opacity duration-500">
                    {mode.subtitle}
                  </p>
                </div>
              </div>

              {/* Right Side: Description & Icon (Responsive: visible on mobile, hover-revealed on desktop) */}
              <div className="w-full md:w-1/3 flex items-start md:items-end justify-start md:justify-end text-left md:text-right z-10 md:opacity-0 md:translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 mt-4 md:mt-0 overflow-hidden">
                <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                  {mode.desc}
                </p>
              </div>

              {/* Dynamic Gradient Sweep */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none"
                style={{
                  background: `linear-gradient(to right, transparent, ${mode.bgHover}, transparent)`,
                }}
              />
            </motion.div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

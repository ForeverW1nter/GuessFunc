import { Component, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./foundation/i18n";
import i18n from "./foundation/i18n";
import App from "@/App";

interface State {
  hasError: boolean;
  error: unknown;
}

class GlobalErrorBoundary extends Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null as unknown };
  }
  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, error };
  }
  componentDidCatch(error: unknown): void {
    console.error("[Global Error Boundary Caught]:", error);
  }
  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--color-background)] text-red-500 flex items-center justify-center p-8 font-mono">
          <div className="max-w-2xl border border-red-500/20 p-8 rounded-xl bg-red-500/5">
            <h1 className="text-2xl font-bold mb-4 uppercase">{i18n.t('common.systemPanic', 'System Panic')}</h1>
            <pre className="text-sm opacity-80 whitespace-pre-wrap">
              {String(this.state.error)}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-8 px-6 py-2 border border-red-500/50 hover:bg-red-500/20 transition-colors uppercase text-sm tracking-widest touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
            >
              {i18n.t('common.reboot', 'Reboot System')}
            </button>
          </div>
        </div>
      );
    }
    return <>{this.props.children}</>;
  }
}

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <GlobalErrorBoundary>
        <App />
      </GlobalErrorBoundary>
    </StrictMode>,
  );
}

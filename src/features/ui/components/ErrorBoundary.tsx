import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    // Clear state and reload page to completely reset
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-app-bg text-app-text p-6">
          <div className="max-w-md w-full bg-modal-bg border border-card-border rounded-xl shadow-2xl p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-xl font-bold mb-4">Oops! Something went wrong</h1>
            <p className="text-[#A0A0A5] text-sm mb-8 whitespace-pre-wrap text-left w-full bg-[#0A0A0B] p-4 rounded border border-card-border overflow-auto max-h-48 font-mono">
              {this.state.error?.message || 'Unknown error occurred'}
            </p>
            <button
              onClick={this.handleReset}
              className="flex items-center justify-center gap-2 w-full py-3 bg-app-primary text-white rounded-lg hover:brightness-110 transition-all font-medium tracking-wide"
            >
              <RefreshCcw size={18} />
              Return to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

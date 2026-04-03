import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
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

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-6 flex flex-col items-center justify-center">
          <div className="bg-slate-800 p-6 rounded-xl border border-red-500/50 max-w-lg w-full shadow-2xl">
            <h2 className="text-xl font-bold text-red-400 mb-4">Oops, algo correu mal!</h2>
            <p className="text-slate-300 mb-4 text-sm">
              Encontrámos um erro inesperado. O problema foi registado.
            </p>
            <pre className="bg-slate-900 p-4 rounded-lg text-xs text-slate-400 overflow-auto whitespace-pre-wrap max-h-48 border border-slate-700">
              {this.state.error?.message}
            </pre>
            <button
              className="mt-6 bg-teal-500 hover:bg-teal-400 text-slate-900 px-6 py-3 rounded-xl font-semibold transition-colors w-full"
              onClick={() => window.location.reload()}
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

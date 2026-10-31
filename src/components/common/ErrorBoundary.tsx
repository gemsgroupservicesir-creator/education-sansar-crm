import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-3xl border border-rose-200 shadow-xl space-y-4">
          <div className="flex items-center gap-3 text-rose-600">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center font-bold shrink-0">
              <AlertCircle className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {this.props.fallbackTitle || 'Unable to render this module'}
              </h2>
              <p className="text-xs text-rose-600 font-medium">{this.state.error?.message}</p>
            </div>
          </div>
          {this.state.error?.stack && (
            <pre className="p-3 bg-slate-50 text-[10px] text-slate-600 font-mono rounded-xl overflow-x-auto max-h-40 border border-slate-200">
              {this.state.error.stack}
            </pre>
          )}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={this.handleReload}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload Page</span>
            </button>
            <a
              href="/"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Go to Dashboard</span>
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

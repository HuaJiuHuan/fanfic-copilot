'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-academia-bg text-academia-parchment font-sans flex items-center justify-center">
          <div className="text-center space-y-6 p-8 bg-academia-surface border border-academia-border rounded-xl max-w-md">
            <h2 className="text-xl font-serif text-academia-crimson">页面发生异常</h2>
            <p className="text-sm text-academia-muted">
              {this.state.error?.message || '发生了未知错误，请尝试刷新页面。'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="bg-academia-gold text-academia-bg px-6 py-2 rounded-md text-sm font-bold hover:opacity-90 transition-all"
              >
                重试
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="text-xs text-academia-muted hover:text-academia-parchment px-4 py-2 transition-colors border border-academia-border rounded-md"
              >
                返回首页
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-academia-muted cursor-pointer">错误详情</summary>
                <pre className="mt-2 p-3 bg-academia-bg rounded text-xs text-academia-crimson overflow-auto max-h-40">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020617] text-slate-100 flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="text-6xl mb-6">💥</div>
            <h1 className="text-2xl font-bold text-white mb-4">出了点问题</h1>
            <p className="text-slate-400 mb-6 text-sm leading-relaxed">
              {this.state.error?.message || '应用遇到了一个意外错误'}
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={this.handleReset}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95"
              >
                重试
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-full text-sm transition-all"
              >
                刷新页面
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

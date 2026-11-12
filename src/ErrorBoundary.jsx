import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled render error', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-2 text-2xl font-black text-nari-navy">Something went wrong</h1>
        <p className="mb-6 max-w-md text-gray-600">The page hit an unexpected error. Reloading usually fixes it. Emergency numbers still work from your phone dialer.</p>
        <button onClick={() => window.location.reload()} className="rounded-xl bg-nari-navy px-6 py-3 font-semibold text-white hover:bg-[#132846]">
          Reload
        </button>
      </div>
    );
  }
}

import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorInfo: error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-red-800 px-4">
          <h2 className="text-2xl font-bold mb-2">Something went wrong.</h2>
          <p className="text-sm text-center">Please try refreshing the page or come back later.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-full p-12 text-center border-2 border-dashed border-danilo-error/20 rounded-2xl bg-red-50/50 m-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-danilo-error/20 mb-4">
            <AlertTriangle className="w-8 h-8 text-danilo-error" />
          </div>
          <h3 className="text-xl font-bold text-danilo-text mb-2">Something went wrong</h3>
          <p className="text-sm text-danilo-text-secondary max-w-md mb-6 leading-relaxed">
            The application encountered an unexpected error while trying to display this section. This has been logged.
          </p>
          <div className="bg-white p-4 rounded-lg border border-danilo-border text-left w-full max-w-md overflow-auto mb-6">
            <code className="text-xs text-danilo-error whitespace-pre-wrap font-mono">
              {this.state.error?.toString()}
            </code>
          </div>
          <button 
            onClick={this.handleReload}
            className="flex items-center gap-2 px-6 py-2.5 bg-danilo-primary hover:bg-danilo-primary-hover text-white rounded-xl transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

import React from "react";
import { WifiOff, RefreshCw } from "lucide-react";

export default class OfflineErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, isOnline: true };
  }

  static getDerivedStateFromError() {
    return { hasError: true, isOnline: navigator.onLine };
  }

  render() {
    if (this.state.hasError) {
      const isOnline = this.state.isOnline;
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
            <WifiOff className="w-7 h-7 text-amber-600" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground mb-1">
            {isOnline ? "Something went wrong" : "You're Offline"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            {isOnline
              ? "An unexpected error occurred. Please try again."
              : "Check your internet connection and try again."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="h-11 px-6 rounded-xl bg-[#2D7A3E] hover:bg-[#246332] text-white font-semibold flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
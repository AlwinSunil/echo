import React from "react";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface NetworkStatusProps {
  status: string;
}

export function NetworkStatus({ status }: NetworkStatusProps) {
  const getStatusColor = () => {
    switch (status) {
      case "Setting up stream":
      case "Waiting to be started":
        return "bg-yellow-400";
      case "Going live":
      case "Live":
        return "bg-green-500";
      case "Live ended":
      case "Live disconnected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "Setting up stream":
      case "Waiting to be started":
      case "Going live":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "Live":
        return <CheckCircle2 className="h-4 w-4" />;
      case "Live ended":
      case "Live disconnected":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex items-center justify-center py-1 text-white ${getStatusColor()}`}
    >
      {getStatusIcon()}
      <span className="ml-2 text-sm font-medium">{status}</span>
    </div>
  );
}

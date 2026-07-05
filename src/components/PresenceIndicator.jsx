import React from "react";

function formatLastSeen(dateStr) {
  if (!dateStr) return "Offline";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const SIZE_MAP = {
  xs: { dot: "w-2 h-2", text: "text-[10px]" },
  sm: { dot: "w-2.5 h-2.5", text: "text-xs" },
  md: { dot: "w-3 h-3", text: "text-sm" },
  lg: { dot: "w-3.5 h-3.5", text: "text-sm" },
};

export function PresenceDot({ presence, size = "sm" }) {
  if (!presence) {
    return <span className={`${SIZE_MAP[size].dot} rounded-full bg-muted-foreground/30`} />;
  }

  const isOnline = presence.is_online;
  const status = presence.provider_status || "online";

  let dotColor;
  if (!isOnline) {
    dotColor = "bg-muted-foreground/40";
  } else if (status === "busy") {
    dotColor = "bg-amber-500";
  } else if (status === "available" || status === "online") {
    dotColor = "bg-green-500";
  } else {
    dotColor = "bg-muted-foreground/40";
  }

  return (
    <span className={`relative inline-flex ${SIZE_MAP[size].dot} rounded-full ${dotColor} ${isOnline ? "ring-2 ring-card" : ""}`}>
      {isOnline && (
        <span className={`absolute inset-0 rounded-full ${dotColor} animate-ping opacity-60`} />
      )}
    </span>
  );
}

export default function PresenceIndicator({ presence, size = "sm", showLabel = true, isProvider = false }) {
  if (!presence) {
    return showLabel ? (
      <div className="flex items-center gap-1.5">
        <span className={`${SIZE_MAP[size].dot} rounded-full bg-muted-foreground/30`} />
        <span className={`${SIZE_MAP[size].text} text-muted-foreground`}>Offline</span>
      </div>
    ) : <PresenceDot presence={presence} size={size} />;
  }

  const isOnline = presence.is_online;
  const status = presence.provider_status || "online";

  let dotColor, label, labelClass;
  if (!isOnline) {
    dotColor = "bg-muted-foreground/40";
    label = `Last seen ${formatLastSeen(presence.last_active)}`;
    labelClass = "text-muted-foreground";
  } else if (status === "busy") {
    dotColor = "bg-amber-500";
    label = "Busy";
    labelClass = "text-amber-600 dark:text-amber-400";
  } else if (status === "available") {
    dotColor = "bg-green-500";
    label = isProvider ? "Available Now" : "Online";
    labelClass = "text-green-600 dark:text-green-400";
  } else {
    dotColor = "bg-green-500";
    label = "Online";
    labelClass = "text-green-600 dark:text-green-400";
  }

  if (!showLabel) {
    return <PresenceDot presence={presence} size={size} />;
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className={`relative inline-flex ${SIZE_MAP[size].dot} rounded-full ${dotColor}`}>
        {isOnline && (
          <span className={`absolute inset-0 rounded-full ${dotColor} animate-ping opacity-60`} />
        )}
      </span>
      <span className={`${SIZE_MAP[size].text} font-medium ${labelClass}`}>{label}</span>
    </div>
  );
}
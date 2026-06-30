"use client";

import React from "react";
import { useDocument } from "@/lib/crdt/document-provider";
import { Wifi, WifiOff, Loader2, Cloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ConnectionStatus() {
  const { connectionStatus, connectedUsers, pendingSyncCount, isOnline } =
    useDocument();

  const statusConfig = {
    connected: {
      icon: <Wifi className="w-3.5 h-3.5" />,
      label: "Connected",
      color: "text-success",
      dotClass: "connected",
    },
    connecting: {
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
      label: "Connecting...",
      color: "text-warning",
      dotClass: "connecting",
    },
    syncing: {
      icon: <Cloud className="w-3.5 h-3.5 animate-pulse" />,
      label: "Syncing...",
      color: "text-info",
      dotClass: "connecting",
    },
    disconnected: {
      icon: <WifiOff className="w-3.5 h-3.5" />,
      label: isOnline ? "Disconnected" : "Offline — Changes saved locally",
      color: "text-destructive",
      dotClass: "disconnected",
    },
  };

  const status = statusConfig[connectionStatus];
  // Filter out the local user from connected users
  const otherUsers = connectedUsers.filter(
    (u, i) => i > 0 // The first user is typically the local user
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border bg-card/50 text-xs">
        {/* Connection Status */}
        <div className={cn("flex items-center gap-1.5", status.color)}>
          <div className={cn("status-dot", status.dotClass)} />
          <span className="font-medium">{status.label}</span>
          {pendingSyncCount > 0 && connectionStatus === "disconnected" && (
            <span className="text-muted-foreground ml-1">
              ({pendingSyncCount} pending)
            </span>
          )}
        </div>

        {/* Connected Users */}
        <div className="flex items-center gap-1">
          {otherUsers.slice(0, 5).map((user) => (
            <Tooltip key={user.clientId}>
              <TooltipTrigger>
                <Avatar className="w-6 h-6 ring-2 ring-background">
                  <AvatarFallback
                    className="text-[10px]"
                    style={{ backgroundColor: user.user.color + "30", color: user.user.color }}
                  >
                    {getInitials(user.user.name || "?")}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>{user.user.name}</TooltipContent>
            </Tooltip>
          ))}
          {otherUsers.length > 5 && (
            <span className="text-muted-foreground ml-1">
              +{otherUsers.length - 5} more
            </span>
          )}
          {otherUsers.length > 0 && (
            <span className="text-muted-foreground ml-2">
              {otherUsers.length + 1} online
            </span>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

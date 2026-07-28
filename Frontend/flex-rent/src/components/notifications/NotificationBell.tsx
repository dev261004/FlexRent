"use client";

import { useState, useCallback } from "react";
import { Bell } from "lucide-react";
import { NotificationBadge } from "./NotificationBadge";
import { NotificationDropdown } from "./NotificationDropdown";
import { useNotificationContext } from "@/contexts/NotificationContext";

interface NotificationBellProps {
  basePath: string;
}

export function NotificationBell({ basePath }: NotificationBellProps) {
  const { unreadCount } = useNotificationContext();
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleDropdown}
        aria-label="View notifications"
        className="relative rounded-xl border border-border bg-surface-raised p-2.5 text-chalk transition hover:border-accent/40 hover:text-text"
      >
        <Bell size={18} />
        <NotificationBadge count={unreadCount} />
      </button>

      <NotificationDropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        basePath={basePath}
      />
    </div>
  );
}

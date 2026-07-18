"use client";

import { PageHeader } from "@/components/admin/PageHeader";
import { Panel } from "@/components/admin/Panel";
import { ThemeToggle } from "@/components/admin/ThemeToggle";

export default function AdminAccountPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Customize your admin dashboard appearance."
      />

      <Panel className="max-w-md p-5">
        <h2 className="mb-4 font-display text-lg font-semibold text-text">
          Appearance
        </h2>
        <ThemeToggle />
      </Panel>
    </div>
  );
}

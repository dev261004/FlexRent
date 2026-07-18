"use client";

import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Panel } from "@/components/admin/Panel";
import { Button } from "@/components/ui/Button";
import { MOCK_OPERATIONS } from "@/features/admin/data/mockOperations";
import type { AdminOperation, OperationStatus } from "@/features/admin/types";

const statusLabel: Record<OperationStatus, string> = {
  scheduled_pickup: "Scheduled pickup",
  picked_up: "Picked up",
  due_return: "Due return",
  returned: "Returned",
  overdue: "Overdue",
};

const statusStyle: Record<OperationStatus, string> = {
  scheduled_pickup: "bg-blue-500/15 text-blue-300",
  picked_up: "bg-accent/15 text-accent",
  due_return: "bg-yellow-500/15 text-yellow-300",
  returned: "bg-green-500/15 text-green-300",
  overdue: "bg-danger/15 text-red-300",
};

export default function AdminOperationsPage() {
  const [operations, setOperations] =
    useState<AdminOperation[]>(MOCK_OPERATIONS);

  const updateStatus = (id: string, status: OperationStatus) => {
    setOperations((prev) =>
      prev.map((op) => (op.id === id ? { ...op, status } : op))
    );
  };

  return (
    <div>
      <PageHeader
        title="Pickup & Return"
        description="Track and update pickup and return of rental products."
      />

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-chalk">
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Scheduled</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {operations.map((op) => (
                <tr key={op.id} className="border-t border-white/5">
                  <td className="px-5 py-3 font-mono text-xs text-text">
                    {op.orderId}
                  </td>
                  <td className="px-5 py-3 text-text">{op.customer}</td>
                  <td className="px-5 py-3 text-text">{op.product}</td>
                  <td className="px-5 py-3 text-chalk">{op.scheduledAt}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${statusStyle[op.status]}`}
                    >
                      {statusLabel[op.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex min-w-[10rem] flex-col gap-2">
                      {(op.status === "scheduled_pickup" ||
                        op.status === "overdue") && (
                        <Button
                          type="button"
                          className="!py-2 text-xs"
                          onClick={() => updateStatus(op.id, "picked_up")}
                        >
                          Mark Picked Up
                        </Button>
                      )}
                      {(op.status === "picked_up" ||
                        op.status === "due_return" ||
                        op.status === "overdue") && (
                        <Button
                          type="button"
                          variant="secondary"
                          className="!py-2 text-xs"
                          onClick={() => updateStatus(op.id, "returned")}
                        >
                          Mark Returned
                        </Button>
                      )}
                      {op.status === "returned" && (
                        <span className="text-xs text-chalk">Complete</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

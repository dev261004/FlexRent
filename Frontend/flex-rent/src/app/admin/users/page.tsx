"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/admin/PageHeader";
import { Panel } from "@/components/admin/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Combobox } from "@/components/ui/Combobox";
import { MOCK_USERS } from "@/features/admin/data/mockUsers";
import type { AdminUser, UserRole, UserStatus } from "@/features/admin/types";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  role: z.enum(["customer", "vendor", "admin"]),
  status: z.enum(["active", "inactive"]),
});

type FormValues = z.infer<typeof schema>;

const roleOptions = [
  { value: "customer", label: "Customer" },
  { value: "vendor", label: "Vendor" },
  { value: "admin", label: "Admin" },
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(MOCK_USERS);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      role: "customer",
      status: "active",
    },
  });

  const role = watch("role");
  const status = watch("status");

  const openCreate = () => {
    setEditingId(null);
    reset({ name: "", email: "", role: "customer", status: "active" });
    setShowForm(true);
  };

  const openEdit = (user: AdminUser) => {
    setEditingId(user.id);
    reset({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setShowForm(true);
  };

  const onSubmit = (data: FormValues) => {
    if (editingId) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingId
            ? {
                ...u,
                name: data.name,
                email: data.email,
                role: data.role as UserRole,
                status: data.status as UserStatus,
              }
            : u
        )
      );
    } else {
      const next: AdminUser = {
        id: `u${Date.now()}`,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        status: data.status as UserStatus,
      };
      setUsers((prev) => [next, ...prev]);
    }
    setShowForm(false);
    setEditingId(null);
    reset();
  };

  const toggleStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, status: u.status === "active" ? "inactive" : "active" }
          : u
      )
    );
  };

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage customer and vendor user records."
        action={
          <div className="w-full sm:w-40">
            <Button
              type="button"
              onClick={() => (showForm ? setShowForm(false) : openCreate())}
            >
              {showForm ? "Cancel" : "+ Add User"}
            </Button>
          </div>
        }
      />

      {showForm && (
        <Panel className="mb-6 p-5">
          <h2 className="mb-4 font-display text-lg font-semibold text-text">
            {editingId ? "Edit user" : "New user"}
          </h2>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-4 sm:grid-cols-2"
          >
            <Input
              id="user-name"
              label="Full name"
              error={errors.name?.message}
              {...register("name")}
            />
            <Input
              id="user-email"
              type="email"
              label="Email"
              error={errors.email?.message}
              {...register("email")}
            />
            <Combobox
              label="Role"
              options={roleOptions}
              value={role}
              onChange={(v) =>
                setValue("role", v as UserRole, { shouldValidate: true })
              }
              error={errors.role?.message}
            />
            <Combobox
              label="Status"
              options={statusOptions}
              value={status}
              onChange={(v) =>
                setValue("status", v as UserStatus, { shouldValidate: true })
              }
              error={errors.status?.message}
            />
            <div className="sm:col-span-2">
              <div className="w-full sm:w-48">
                <Button type="submit">
                  {editingId ? "Update user" : "Save user"}
                </Button>
              </div>
            </div>
          </form>
        </Panel>
      )}

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-chalk">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-white/5">
                  <td className="px-5 py-3 font-medium text-text">{u.name}</td>
                  <td className="px-5 py-3 text-chalk">{u.email}</td>
                  <td className="px-5 py-3 capitalize text-text">{u.role}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium capitalize ${
                        u.status === "active"
                          ? "bg-green-500/15 text-green-300"
                          : "bg-white/10 text-chalk"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        className="text-xs font-medium text-accent hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleStatus(u.id)}
                        className="text-xs font-medium text-chalk hover:text-text"
                      >
                        {u.status === "active" ? "Deactivate" : "Activate"}
                      </button>
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

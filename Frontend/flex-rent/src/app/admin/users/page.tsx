"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Edit3,
  Shield,
  UserCheck,
  UserX,
  Building,
  Mail,
  Phone,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Panel } from "@/components/admin/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Combobox } from "@/components/ui/Combobox";
import {
  getUsers,
  createUser,
  updateUser,
} from "@/features/admin/api";
import type { AdminUser, UserRole, UserStatus } from "@/features/admin/types";

const schema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().optional(),
  email: z.string().trim().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  role: z.enum(["CUSTOMER", "VENDOR", "ADMIN"]),
  status: z.enum(["ACTIVE", "DISABLED"]),
  phone: z.string().optional(),
  companyName: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const roleOptions = [
  { value: "CUSTOMER", label: "Customer" },
  { value: "VENDOR", label: "Vendor" },
  { value: "ADMIN", label: "Admin" },
];

const statusOptions = [
  { value: "ACTIVE", label: "Active" },
  { value: "DISABLED", label: "Disabled" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

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
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "CUSTOMER",
      status: "ACTIVE",
      phone: "",
      companyName: "",
    },
  });

  const roleValue = watch("role");
  const statusValue = watch("status");

  const fetchUsersList = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getUsers({
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        limit: 50,
      });
      if (res?.users) {
        setUsers(res.users);
      }
    } catch {
      toast.error("Failed to load users list");
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsersList();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchUsersList]);

  const openCreate = () => {
    setEditingId(null);
    reset({
      firstName: "",
      lastName: "",
      email: "",
      password: "Password123!",
      role: "CUSTOMER",
      status: "ACTIVE",
      phone: "",
      companyName: "",
    });
    setShowForm(true);
  };

  const openEdit = (user: AdminUser) => {
    setEditingId(user.id);
    reset({
      firstName: user.firstName || user.name.split(" ")[0] || "",
      lastName: user.lastName || user.name.split(" ").slice(1).join(" ") || "",
      email: user.email,
      password: "",
      role: (user.role.toUpperCase() as "CUSTOMER" | "VENDOR" | "ADMIN") || "CUSTOMER",
      status: (user.status.toUpperCase() as "ACTIVE" | "DISABLED") || "ACTIVE",
      phone: user.phone || "",
      companyName: user.companyName || "",
    });
    setShowForm(true);
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      if (editingId) {
        const updated = await updateUser(editingId, {
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          status: data.status,
          phone: data.phone,
          companyName: data.companyName,
          password: data.password ? data.password : undefined,
        });

        toast.success(`User "${updated.name || updated.email}" updated successfully!`);
        setUsers((prev) =>
          prev.map((u) => (u.id === editingId ? { ...u, ...updated } : u))
        );
      } else {
        const created = await createUser({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password || "Password123!",
          role: data.role,
          status: data.status,
          phone: data.phone,
          companyName: data.companyName,
        });

        toast.success(`User "${created.email}" created successfully!`);
        setUsers((prev) => [created, ...prev]);
      }

      setShowForm(false);
      setEditingId(null);
      reset();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to save user";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: AdminUser) => {
    const nextStatus: UserStatus =
      user.status.toUpperCase() === "ACTIVE" ? "DISABLED" : "ACTIVE";

    try {
      setTogglingId(user.id);
      const updated = await updateUser(user.id, {
        status: nextStatus,
      });

      toast.success(
        `User status set to ${nextStatus === "ACTIVE" ? "Active" : "Disabled"}`
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u))
      );
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to update status";
      toast.error(errorMsg);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage customer, vendor, and administrator accounts across FlexRent."
        action={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchUsersList}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-chalk hover:text-text hover:bg-white/5 transition"
              title="Refresh users"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin text-accent" : ""} />
              <span>Refresh</span>
            </button>
            <div className="w-full sm:w-40">
              <Button
                type="button"
                onClick={() => (showForm ? setShowForm(false) : openCreate())}
              >
                {showForm ? "Cancel" : "+ Add User"}
              </Button>
            </div>
          </div>
        }
      />

      {/* Create / Edit User Drawer / Panel */}
      {showForm && (
        <Panel className="mb-6 p-6 border-accent/30 shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-accent" />
              <h2 className="font-display text-lg font-semibold text-text">
                {editingId ? "Edit User Account" : "Create New User"}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs text-chalk hover:text-text"
            >
              ✕ Close
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="user-firstName"
                label="First Name"
                placeholder="e.g. John"
                error={errors.firstName?.message}
                {...register("firstName")}
              />

              <Input
                id="user-lastName"
                label="Last Name"
                placeholder="e.g. Doe"
                {...register("lastName")}
              />

              <Input
                id="user-email"
                type="email"
                label="Email Address"
                placeholder="user@example.com"
                disabled={Boolean(editingId)}
                error={errors.email?.message}
                {...register("email")}
              />

              <Input
                id="user-password"
                type="password"
                label={editingId ? "Reset Password (Leave blank to keep)" : "Password"}
                placeholder={editingId ? "••••••••" : "Min 6 characters"}
                error={errors.password?.message}
                {...register("password")}
              />

              <Combobox
                label="Platform Role"
                options={roleOptions}
                value={roleValue}
                onChange={(v) =>
                  setValue("role", v as "CUSTOMER" | "VENDOR" | "ADMIN", {
                    shouldValidate: true,
                  })
                }
                error={errors.role?.message}
              />

              <Combobox
                label="Account Status"
                options={statusOptions}
                value={statusValue}
                onChange={(v) =>
                  setValue("status", v as "ACTIVE" | "DISABLED", {
                    shouldValidate: true,
                  })
                }
                error={errors.status?.message}
              />

              <Input
                id="user-phone"
                label="Phone Number (Optional)"
                placeholder="e.g. +91 98765 43210"
                {...register("phone")}
              />

              <Input
                id="user-company"
                label="Company / Agency Name (Optional)"
                placeholder="e.g. Apex Productions"
                {...register("companyName")}
              />
            </div>

            <div className="flex items-center gap-3 pt-3">
              <div className="w-48">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Saving..."
                    : editingId
                    ? "Update User"
                    : "Create User"}
                </Button>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Panel>
      )}

      {/* Filter & Search Bar */}
      <Panel>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border p-4 sm:px-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-chalk" size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or company..."
              className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-4 text-xs text-text placeholder-chalk/70 focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-chalk">Role:</span>
            {["", "CUSTOMER", "VENDOR", "ADMIN"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  roleFilter === r
                    ? "bg-accent text-black shadow-sm"
                    : "bg-surface text-chalk hover:text-text border border-border"
                }`}
              >
                {r || "All"}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-black/[0.02] text-left text-xs uppercase tracking-wider text-chalk dark:bg-white/[0.02]">
                <th className="px-5 py-3.5 font-semibold sm:px-6">User</th>
                <th className="px-5 py-3.5 font-semibold">Contact</th>
                <th className="px-5 py-3.5 font-semibold text-center">Role</th>
                <th className="px-5 py-3.5 font-semibold text-center">Status</th>
                <th className="px-5 py-3.5 font-semibold text-right sm:px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-chalk">
                    <RefreshCw size={20} className="mx-auto mb-2 animate-spin text-accent" />
                    Loading registered users...
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((u) => {
                  const isActive = u.status.toUpperCase() === "ACTIVE";
                  const roleNormalized = u.role.toUpperCase();

                  return (
                    <tr
                      key={u.id}
                      className="transition hover:bg-accent/[0.035]"
                    >
                      <td className="px-5 py-4 font-medium text-text sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/20 font-bold text-accent">
                            {u.name?.[0]?.toUpperCase() || u.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-text">{u.name}</p>
                            {u.companyName && (
                              <p className="text-[11px] text-chalk flex items-center gap-1">
                                <Building size={11} /> {u.companyName}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-chalk">
                        <div className="space-y-0.5">
                          <p className="flex items-center gap-1.5 text-text">
                            <Mail size={12} className="text-chalk" />
                            {u.email}
                          </p>
                          {u.phone && (
                            <p className="flex items-center gap-1.5 text-chalk">
                              <Phone size={12} />
                              {u.phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-block rounded-md px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                            roleNormalized === "ADMIN"
                              ? "bg-purple-500/15 text-purple-400 border border-purple-500/20"
                              : roleNormalized === "VENDOR"
                              ? "bg-accent/15 text-yellow-800 dark:text-accent border border-accent/20"
                              : "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {roleNormalized}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isActive
                              ? "bg-green-500/15 text-green-700 dark:text-green-300"
                              : "bg-black/5 text-chalk dark:bg-white/10"
                          }`}
                        >
                          {isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right sm:px-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(u)}
                            className="rounded-lg p-1.5 text-chalk hover:text-text hover:bg-white/5 transition"
                            title="Edit user"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            disabled={togglingId === u.id}
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition border ${
                              isActive
                                ? "border-danger/30 text-danger hover:bg-danger/10"
                                : "border-green-500/30 text-green-400 hover:bg-green-500/10"
                            }`}
                          >
                            {isActive ? "Disable" : "Enable"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-chalk">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

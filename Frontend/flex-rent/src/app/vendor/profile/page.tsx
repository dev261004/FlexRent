"use client";

import { Camera, Check, Briefcase, UserRound } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile } from "@/features/customer/api";
import { Panel } from "@/components/admin/Panel";
import { Combobox } from "@/components/ui/Combobox";
import { PRODUCT_CATEGORIES } from "@/features/auth/data/productCategories";

export default function VendorProfilePage() {
  const { user, login, token } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [image, setImage] = useState(user?.profileImage ?? "");
  const [companyName, setCompanyName] = useState(user?.companyName ?? "");
  const [gstNumber, setGstNumber] = useState(user?.gstNumber ?? "");
  const [category, setCategory] = useState(user?.productCategory ?? "");

  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  if (!user) return null;

  const allFilled = !!(
    firstName.trim() &&
    lastName.trim() &&
    phone.trim() &&
    phone.length === 10 &&
    companyName.trim() &&
    gstNumber.trim() &&
    gstNumber.length === 15 &&
    category
  );

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allFilled) return;
    setPending(true);
    try {
      const updated = await updateProfile({
        firstName,
        lastName,
        phone,
        companyName,
        gstNumber,
        productCategory: category,
        profileImage: image || null,
      });
      if (token) {
        login(token, {
          ...user,
          ...updated,
          fullName: `${firstName} ${lastName}`.trim(),
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-accent">Vendor Settings</p>
        <h1 className="font-display text-3xl font-bold text-text sm:text-4xl">Business Profile</h1>
        <p className="mt-2 text-sm text-chalk">Manage your personal details and business registrations here.</p>
      </div>

      <form onSubmit={save} className="grid max-w-4xl gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <Panel className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-accent/15 text-accent">
                {image ? (
                  <img src={image} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <UserRound size={40} />
                )}
              </div>
              <Camera className="absolute bottom-0 right-0 rounded-full bg-accent p-1.5 text-[#1a1817]" size={28} />
            </div>
            <h2 className="mt-4 font-display text-xl font-bold text-text">{companyName || user.fullName}</h2>
            <p className="mt-1 text-sm text-chalk">{user.email}</p>
            <label className="mt-6 w-full text-left text-sm font-semibold text-text">
              Profile photo URL
              <input
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://…"
                className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-normal text-text outline-none focus:border-accent"
              />
            </label>
            <p className="mt-2 text-left text-xs leading-5 text-chalk">Paste an image URL to update your business logo or photo.</p>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel className="p-6">
            <h2 className="font-display text-lg font-bold text-text">Personal information</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field
                label="First name"
                value={firstName}
                onChange={(val) => setFirstName(val.replace(/[^a-zA-Z]/g, ""))}
              />
              <Field
                label="Last name"
                value={lastName}
                onChange={(val) => setLastName(val.replace(/[^a-zA-Z]/g, ""))}
              />
            </div>
            <div className="mt-4">
              <Field
                label="Phone number"
                value={phone}
                onChange={(val) => setPhone(val.replace(/\D/g, "").slice(0, 10))}
              />
            </div>
          </Panel>

          <Panel className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <Briefcase className="text-accent" size={19} />
              <h2 className="font-display text-lg font-bold text-text">Business information</h2>
            </div>
            <div className="space-y-4">
              <Field
                label="Company name"
                value={companyName}
                onChange={setCompanyName}
              />
              <Field
                label="GST number"
                value={gstNumber}
                onChange={(val) => setGstNumber(val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15))}
              />
              <div className="mt-2">
                <Combobox
                  label="Product Category"
                  options={[...PRODUCT_CATEGORIES]}
                  value={category ?? ""}
                  onChange={setCategory}
                  placeholder="Select category..."
                />
              </div>
            </div>
          </Panel>

          <button
            disabled={pending || !allFilled}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 font-bold text-[#1a1817] disabled:opacity-60 transition"
          >
            {saved ? (
              <>
                <Check size={18} />
                Saved
              </>
            ) : pending ? (
              "Saving…"
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-text">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 font-normal text-text outline-none focus:border-accent"
      />
    </label>
  );
}

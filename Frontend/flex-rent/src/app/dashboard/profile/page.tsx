"use client";

import { Camera, Check, MapPin, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile } from "@/features/customer/api";
import { Panel } from "@/components/admin/Panel";
export default function ProfilePage() {
  const { user, login, token, isLoading } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [image, setImage] = useState(user?.profileImage ?? "");
  const [addresses, setAddresses] = useState<string[]>([]);
  const [newAddress, setNewAddress] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    try {
      const prefs = JSON.parse(localStorage.getItem("flexrent_preferences") ?? "{}");
      if (prefs.addresses && Array.isArray(prefs.addresses)) {
        setAddresses(prefs.addresses);
      } else if (prefs.address) {
        setAddresses([prefs.address]);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setPhone(user.phone ?? "");
    setImage(user.profileImage ?? "");
  }, [user]);

  if (isLoading) {
    return <div className="text-sm text-chalk">Loading profile...</div>;
  }

  if (!user) return null;

  const allFilled = !!(
    firstName.trim() &&
    lastName.trim() &&
    phone.trim() &&
    phone.length === 10
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
        profileImage: image || null,
      });
      if (token) {
        login(token, {
          ...user,
          ...updated,
          fullName: `${firstName} ${lastName}`.trim(),
        });
      }
      const p = JSON.parse(localStorage.getItem("flexrent_preferences") ?? "{}");
      localStorage.setItem("flexrent_preferences", JSON.stringify({ ...p, addresses }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-accent">Account settings</p>
        <h1 className="font-display text-3xl font-bold text-text sm:text-4xl">Profile & address</h1>
        <p className="mt-2 text-sm text-chalk">Keep your contact and delivery details ready for faster checkout.</p>
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
            <h2 className="mt-4 font-display text-xl font-bold text-text">{user.fullName}</h2>
            <p className="mt-1 text-sm text-chalk">{user.email}</p>
            <label className="mt-6 w-full text-left text-sm font-semibold text-text">
              Profile photo URL
              <input
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://…"
                className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-normal text-text"
              />
            </label>
            <p className="mt-2 text-left text-xs leading-5 text-chalk">Paste an image URL to update your profile photo.</p>
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
            <div className="flex items-center gap-2">
              <MapPin className="text-accent" size={19} />
              <h2 className="font-display text-lg font-bold text-text">Delivery addresses</h2>
            </div>
            
            <div className="mt-5 space-y-3">
              {addresses.map((addr, idx) => (
                <div key={idx} className="flex items-start justify-between gap-4 rounded-xl border border-border bg-surface px-3 py-3">
                  <p className="text-sm text-text whitespace-pre-wrap">{addr}</p>
                  <button 
                    type="button"
                    onClick={() => setAddresses(addresses.filter((_, i) => i !== idx))}
                    className="text-xs font-bold text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-border pt-4">
              <textarea
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                rows={2}
                placeholder="Add a new address (House, street, area, city, PIN code)"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text"
              />
              <button
                type="button"
                onClick={() => {
                  if (newAddress.trim()) {
                    setAddresses([...addresses, newAddress.trim()]);
                    setNewAddress("");
                  }
                }}
                disabled={!newAddress.trim()}
                className="mt-2 rounded-xl bg-accent/20 px-3 py-1.5 text-xs font-bold text-accent disabled:opacity-50"
              >
                Add Address
              </button>
            </div>
            <p className="mt-4 text-xs text-chalk">Used to prefill delivery bookings on this device.</p>
          </Panel>
          <button
            disabled={pending || !allFilled}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 font-bold text-[#1a1817] disabled:opacity-60"
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
    <label className="text-sm font-semibold text-text">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 font-normal text-text"
      />
    </label>
  );
}

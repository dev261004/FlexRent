"use client";

import { Camera, Check, Briefcase, UserRound, Store, Plus, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile, updatePickupSettings } from "@/features/customer/api";
import { Panel } from "@/components/admin/Panel";
import { Combobox } from "@/components/ui/Combobox";
import { PRODUCT_CATEGORIES } from "@/features/auth/data/productCategories";

export default function VendorProfilePage() {
  const { user, login, token, isLoading } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [image, setImage] = useState(user?.profileImage ?? "");
  const [companyName, setCompanyName] = useState(user?.companyName ?? "");
  const [gstNumber, setGstNumber] = useState(user?.gstNumber ?? "");
  const [category, setCategory] = useState(user?.productCategory ?? "");
  const [upiId, setUpiId] = useState(user?.upiId ?? "");

  // Vendor Pickup Settings
  const [wantsPickup, setWantsPickup] = useState(user?.supportsStorePickup ?? false);
  const [pickupAddresses, setPickupAddresses] = useState<any[]>(user?.pickupAddresses ?? []);
  const [storeTimings, setStoreTimings] = useState<any>(user?.storeTimings ?? {
    monday: { open: "09:00", close: "18:00", closed: false },
    tuesday: { open: "09:00", close: "18:00", closed: false },
    wednesday: { open: "09:00", close: "18:00", closed: false },
    thursday: { open: "09:00", close: "18:00", closed: false },
    friday: { open: "09:00", close: "18:00", closed: false },
    saturday: { open: "10:00", close: "16:00", closed: false },
    sunday: { open: "00:00", close: "00:00", closed: true },
  });

  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setPhone(user.phone ?? "");
    setImage(user.profileImage ?? "");
    setCompanyName(user.companyName ?? "");
    setGstNumber(user.gstNumber ?? "");
    setCategory(user.productCategory ?? "");
    setUpiId(user.upiId ?? "");

    setWantsPickup(user.supportsStorePickup ?? false);
    setPickupAddresses(user.pickupAddresses ?? []);
    if (user.storeTimings) {
      setStoreTimings(user.storeTimings);
    }
  }, [user]);

  if (isLoading) {
    return <div className="text-sm text-chalk">Loading profile...</div>;
  }

  if (!user) return null;

  const allFilled = !!(
    firstName.trim() &&
    lastName.trim() &&
    phone.trim() &&
    phone.length === 10 &&
    companyName.trim() &&
    gstNumber.trim() &&
    gstNumber.length === 15 &&
    category &&
    upiId.trim()
  );
  
  const pickupValid = !wantsPickup || (
    pickupAddresses.length > 0 && pickupAddresses.every(addr => 
      addr.addressLine1?.trim() && 
      addr.city?.trim() && 
      addr.state?.trim() && 
      addr.postalCode?.trim() && 
      addr.country?.trim()
    )
  );

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allFilled || !pickupValid) return;
    setPending(true);
    try {
      const updated = await updateProfile({
        firstName,
        lastName,
        phone,
        companyName,
        gstNumber,
        productCategory: category,
        upiId,
        profileImage: image || null,
      });
      
      const pickupUpdatedRes = await updatePickupSettings(
        wantsPickup, 
        wantsPickup ? pickupAddresses : undefined,
        wantsPickup ? storeTimings : undefined
      );
      const pickupUpdated = pickupUpdatedRes.pickupSettings;

      if (token) {
        login(token, {
          ...user,
          ...updated,
          supportsStorePickup: pickupUpdated.supportsStorePickup,
          pickupAddresses: pickupUpdated.pickupAddresses,
          storeTimings: pickupUpdated.storeTimings,
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
              <Field
                label="UPI ID"
                value={upiId}
                onChange={(val) => setUpiId(val.trim())}
                placeholder="vendor@upi"
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

          <Panel className="p-6 border border-accent/20">
            <div className="flex items-center gap-2 mb-4">
              <Store className="text-accent" size={19} />
              <h2 className="font-display text-lg font-bold text-text">Store Pickup Settings</h2>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={wantsPickup}
                onChange={(e) => setWantsPickup(e.target.checked)}
                className="mt-1 accent-accent"
              />
              <div>
                <p className="text-sm font-semibold text-text">Offer Store Pickup</p>
                <p className="text-xs text-chalk">Allow customers to collect their orders from your physical store</p>
              </div>
            </label>

            {wantsPickup && (
              <div className="mt-6 flex flex-col gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-text text-sm">Pickup Addresses</h3>
                    <button 
                      type="button" 
                      onClick={() => setPickupAddresses([...pickupAddresses, { addressLine1: "", addressLine2: "", city: "", state: "", postalCode: "", country: "" }])}
                      className="flex items-center gap-1 text-xs text-accent font-bold hover:underline"
                    >
                      <Plus size={14} /> Add Address
                    </button>
                  </div>
                  {pickupAddresses.length === 0 && (
                    <p className="text-xs text-chalk mb-2">No addresses added. Please add at least one pickup address.</p>
                  )}
                  {pickupAddresses.map((addr, idx) => (
                    <div key={idx} className="mb-4 p-4 border border-border rounded-xl bg-surface relative">
                      <button 
                        type="button" 
                        onClick={() => setPickupAddresses(pickupAddresses.filter((_, i) => i !== idx))}
                        className="absolute top-4 right-4 text-chalk hover:text-red-500"
                      >
                        <Trash size={16} />
                      </button>
                      <h4 className="text-xs font-bold text-chalk mb-3 uppercase tracking-wider">Address {idx + 1}</h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input required value={addr.addressLine1} onChange={e=>{const n=[...pickupAddresses]; n[idx]={...n[idx], addressLine1: e.target.value}; setPickupAddresses(n);}} placeholder="Address Line 1" className="col-span-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text" />
                        <input value={addr.addressLine2} onChange={e=>{const n=[...pickupAddresses]; n[idx]={...n[idx], addressLine2: e.target.value}; setPickupAddresses(n);}} placeholder="Address Line 2 (Optional)" className="col-span-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text" />
                        <input required value={addr.city} onChange={e=>{const n=[...pickupAddresses]; n[idx]={...n[idx], city: e.target.value}; setPickupAddresses(n);}} placeholder="City" className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text" />
                        <input required value={addr.state} onChange={e=>{const n=[...pickupAddresses]; n[idx]={...n[idx], state: e.target.value}; setPickupAddresses(n);}} placeholder="State" className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text" />
                        <input required value={addr.postalCode} onChange={e=>{const n=[...pickupAddresses]; n[idx]={...n[idx], postalCode: e.target.value}; setPickupAddresses(n);}} placeholder="Postal Code" className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text" />
                        <input required value={addr.country} onChange={e=>{const n=[...pickupAddresses]; n[idx]={...n[idx], country: e.target.value}; setPickupAddresses(n);}} placeholder="Country" className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="font-semibold text-text text-sm mb-3">Store Timings</h3>
                  <div className="grid gap-3">
                    {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(day => (
                      <div key={day} className="flex items-center gap-3">
                        <label className="flex items-center gap-2 w-28 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={!storeTimings[day]?.closed}
                            onChange={(e) => setStoreTimings({...storeTimings, [day]: { ...storeTimings[day], closed: !e.target.checked }})}
                            className="accent-accent"
                          />
                          <span className="text-sm font-medium capitalize text-text">{day}</span>
                        </label>
                        {!storeTimings[day]?.closed ? (
                          <div className="flex items-center gap-2">
                            <input 
                              type="time" 
                              required 
                              value={storeTimings[day]?.open || "09:00"}
                              onChange={e => setStoreTimings({...storeTimings, [day]: { ...storeTimings[day], open: e.target.value }})}
                              className="rounded-lg border border-border bg-surface px-2 py-1 text-sm text-text"
                            />
                            <span className="text-sm text-chalk">to</span>
                            <input 
                              type="time" 
                              required 
                              value={storeTimings[day]?.close || "18:00"}
                              onChange={e => setStoreTimings({...storeTimings, [day]: { ...storeTimings[day], close: e.target.value }})}
                              className="rounded-lg border border-border bg-surface px-2 py-1 text-sm text-text"
                            />
                          </div>
                        ) : (
                          <span className="text-sm text-chalk italic">Closed</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Panel>

          <button
            disabled={pending || !allFilled || !pickupValid}
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-text">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 font-normal text-text outline-none focus:border-accent"
      />
    </label>
  );
}

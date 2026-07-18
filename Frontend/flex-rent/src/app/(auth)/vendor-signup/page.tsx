import { VendorSignupForm } from "@/features/auth/components/VendorSignupForm";

export default function VendorSignupPage() {
  return (
    <div className="w-full max-w-sm">
      <h1 className="mb-8 text-center font-display text-3xl font-semibold text-text">
        Vendor Registration
      </h1>
      <VendorSignupForm />
      <p className="mt-6 text-center text-sm text-chalk">
        Already have an account?{" "}
        <a
          href="/login"
          className="text-text underline underline-offset-2 hover:text-chalk"
        >
          Sign in
        </a>
      </p>
    </div>
  );
}

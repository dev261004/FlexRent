import { SignupForm } from "@/features/auth/components/SignupForm";

export default function SignupPage() {
  return (
    <div className="w-full max-w-sm">
      <h1 className="mb-8 text-center font-display text-3xl font-semibold text-text">
        Create Account
      </h1>
      <SignupForm />
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

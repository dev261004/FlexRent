import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-sm">
      <h1 className="mb-2 text-center font-display text-3xl font-semibold text-text">
        Reset Password
      </h1>
      <p className="mb-8 text-center text-sm text-chalk">
        Enter your email and we&apos;ll send you a reset link.
      </p>
      <ResetPasswordForm />
      <p className="mt-6 text-center text-sm text-chalk">
        Remember your password?{" "}
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

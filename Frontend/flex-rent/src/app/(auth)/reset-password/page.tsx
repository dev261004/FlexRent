import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import { UpdatePasswordForm } from "@/features/auth/components/UpdatePasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (token) {
    return (
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center font-display text-3xl font-semibold text-text">
          Set New Password
        </h1>
        <p className="mb-8 text-center text-sm text-chalk">
          Enter your new password below.
        </p>
        <UpdatePasswordForm token={token} />
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

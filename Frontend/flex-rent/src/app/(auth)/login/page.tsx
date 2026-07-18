import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <h1 className="mb-8 text-center font-display text-3xl font-semibold text-text">
        Sign In
      </h1>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-chalk">
        Don&apos;t have an account?{" "}
        <a
          href="/signup"
          className="text-text underline underline-offset-2 hover:text-chalk"
        >
          Sign up
        </a>
      </p>
    </div>
  );
}

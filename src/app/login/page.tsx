import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { getCurrentUser } from "@/lib/auth";
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmation?: string }>;
}) {
  const [user, query] = await Promise.all([getCurrentUser(), searchParams]);
  if (user) redirect("/dashboard");
  return (
    <AuthLayout>
      <AuthForm
        mode="login"
        confirmationFailed={query.confirmation === "failed"}
      />
    </AuthLayout>
  );
}

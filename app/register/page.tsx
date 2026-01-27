import { RegisterForm } from "@/components/register-form";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { validateSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export default async function RegisterPage() {
  // If already logged in, redirect to home
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken && validateSessionToken(sessionToken)) {
    redirect("/");
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <RegisterForm />
    </div>
  );
}

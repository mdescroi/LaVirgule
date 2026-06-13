import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Connexion admin",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const userId = await getSessionUserId();
  if (userId) redirect("/admin");

  return (
    <div className="flex min-h-svh items-center justify-center bg-stone-100 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-center font-serif text-2xl font-bold text-stone-900">
          La Virgule<span className="text-amber-500">,</span>
        </p>
        <p className="mt-1 text-center text-sm text-stone-500">
          Espace administration
        </p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

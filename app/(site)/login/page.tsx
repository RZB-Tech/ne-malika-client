import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Вход" };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}

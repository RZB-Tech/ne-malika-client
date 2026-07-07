import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Регистрация" };

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}

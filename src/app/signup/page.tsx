import { redirect } from "next/navigation";

// Sign-up lives as a tab on the login page; this keeps /signup as a clean URL
export default function SignupPage() {
  redirect("/login?tab=signup");
}

import type { Metadata } from "next";
import { ChangePasswordForm, ProfileForm } from "@/components/account/profile-forms";

export const metadata: Metadata = { title: "Meus dados" };

export default function AccountPage() {
  return (
    <div className="space-y-6">
      <ProfileForm />
      <ChangePasswordForm />
    </div>
  );
}

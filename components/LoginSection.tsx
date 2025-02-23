"use client";
import { SignIn } from "@clerk/nextjs";

export default function LoginSection() {
  return (
    <div className="border-r">
      <SignIn routing="hash" forceRedirectUrl="/main" />
    </div>
  );
}

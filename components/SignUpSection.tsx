"use client";
import { SignUp } from "@clerk/nextjs";

export default function SignUpSection() {
  return (
    <div className="border-r">
      <SignUp routing="hash" forceRedirectUrl="/main" signInUrl="/" />
    </div>
  );
}

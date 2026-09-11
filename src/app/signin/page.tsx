import { Suspense } from "react";
import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SignInForm } from "@/components/SignInForm";

export const metadata: Metadata = {
  title: "Sign in",
  // Nothing here is useful in a search result, and the team page behind it is
  // already excluded. Keep the whole sign-in surface out of the index.
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <>
      <SiteNav />
      <main id="main" className="bg-cream">
        <div className="mx-auto max-w-[520px] px-6 py-20 sm:py-28">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink">
            Sign in
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            No password to remember. Put in your email and we send you a link
            that signs you in.
          </p>

          <Suspense fallback={<div className="mt-10 h-44" aria-hidden />}>
            <SignInForm />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

import type { Metadata } from "next";
import { CompletedIllustration } from "@/components/illustrations/CompletedIllustration";

export const metadata: Metadata = {
  title: "ULES FYW PAY - Payment Closed",
  description: "Payment for Final Year Week is currently closed.",
};

export default function PaymentClosedPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-[#F9FAFB] via-[#F4F8F4] to-[#E7F1E7] px-4 py-12">
      {/* Dotted grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #1B5E20 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 45%, #000 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 45%, #000 30%, transparent 75%)",
        }}
      />
      {/* Decorative blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#43A047]/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-[#1B5E20]/15 blur-3xl"
      />

      <section className="animate-fyw-fade-up relative w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/60 bg-white/85 shadow-2xl shadow-[#1B5E20]/10 ring-1 ring-black/5 backdrop-blur-xl">
        {/* Top accent strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#1B5E20] via-[#43A047] to-[#1B5E20]" />

        <div className="grid items-stretch gap-0 md:grid-cols-2">
          {/* Illustration panel */}
          <div className="order-1 flex items-center justify-center bg-gradient-to-br from-[#1B5E20]/[0.06] to-[#43A047]/[0.1] p-8 sm:p-10 md:order-2 md:p-12">
            <CompletedIllustration className="animate-fyw-float h-52 w-auto drop-shadow-xl sm:h-60 md:h-72" />
          </div>

          {/* Content */}
          <div className="order-2 flex flex-col justify-center p-8 text-center sm:p-10 md:order-1 md:p-12 md:text-left">
            {/* Brand */}
            <div className="mb-6 flex items-center justify-center gap-2 md:justify-start">
              <span className="material-symbols-outlined text-2xl text-[#1B5E20]">
                engineering
              </span>
              <span className="text-base font-bold tracking-tight text-[#1B5E20]">
                ULES FYW PAY
              </span>
            </div>

            {/* Status badge */}
            <span className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-700 md:mx-0 md:self-start">
              <span className="material-symbols-outlined text-sm">lock</span>
              Payment Closed
            </span>

            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl">
              Payment is now <span className="text-[#1B5E20]">closed</span>
            </h1>

            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              Payment for the Final Year Week has officially closed. We are no
              longer accepting new registrations or payments at this time.
            </p>

            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              If you believe this is an error or have a pending issue, reach out
              to the FYW committee on WhatsApp and we&apos;ll sort it out.
            </p>

            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/2349014420387?text=Hi%2C%20I%20have%20an%20issue%20with%20my%20FYW%20payment%20and%20need%20some%20help."
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Message the FYW committee on WhatsApp"
              className="mt-6 inline-flex items-center justify-center gap-2 self-center rounded-xl bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#25D366]/30 transition hover:bg-[#1eb955] hover:shadow-[#25D366]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 md:self-start"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
                className="h-5 w-5"
              >
                <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.477-.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413z" />
              </svg>
              Chat with us on WhatsApp
            </a>

            {/* Divider */}
            <div className="mx-auto my-7 h-px w-16 bg-slate-200 md:mx-0" />

            <div className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1B5E20]/[0.07] px-5 py-3 text-sm font-medium text-[#1B5E20] md:justify-start">
              <span className="material-symbols-outlined text-base">
                celebration
              </span>
              Thank you for participating — see you at Final Year Week!
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

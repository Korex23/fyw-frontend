"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../common/Navbar";
import { parseApiError } from "@/utils/helpers";
import {
  GROUP_DISCOUNT_PCT,
  GROUP_MATRIC_REGEX,
  GROUP_REGULAR_TOTAL,
  GROUP_SIZE,
  GROUP_TOTAL,
  type GroupMemberInput,
} from "@/types";

const API_BASE = "https://fyw-api.blessedbid.com";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emptyMember = (): GroupMemberInput => ({
  matricNumber: "",
  fullName: "",
  gender: "",
  email: "",
  phone: "",
});

type MemberErrors = Partial<Record<keyof GroupMemberInput, string>>;

export default function GroupRegister() {
  const router = useRouter();

  const [payerEmail, setPayerEmail] = useState("");
  const [members, setMembers] = useState<GroupMemberInput[]>([
    emptyMember(),
    emptyMember(),
    emptyMember(),
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  function updateMember(
    index: number,
    patch: Partial<GroupMemberInput>,
  ) {
    setMembers((prev) =>
      prev.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    );
  }

  const payerEmailError = useMemo(() => {
    if (!payerEmail.trim()) return "Payer email is required.";
    if (!EMAIL_REGEX.test(payerEmail.trim()))
      return "Enter a valid email address.";
    return null;
  }, [payerEmail]);

  const memberErrors = useMemo<MemberErrors[]>(() => {
    const matrics = members.map((m) => m.matricNumber.trim());
    return members.map((m, i) => {
      const errs: MemberErrors = {};
      const matric = m.matricNumber.trim();

      if (!matric) {
        errs.matricNumber = "Matric number is required.";
      } else if (!GROUP_MATRIC_REGEX.test(matric)) {
        errs.matricNumber = "Must start with 1904 or 2104 (9 digits).";
      } else if (matrics.filter((x) => x && x === matric).length > 1) {
        errs.matricNumber = "All three matric numbers must be different.";
      }

      if (m.fullName.trim().length < 2)
        errs.fullName = "Enter the member's full name.";

      if (m.gender !== "male" && m.gender !== "female")
        errs.gender = "Select a gender.";

      if (m.email.trim() && !EMAIL_REGEX.test(m.email.trim()))
        errs.email = "Enter a valid email address.";

      return errs;
    });
  }, [members]);

  const isValid = useMemo(() => {
    if (payerEmailError) return false;
    return memberErrors.every((e) => Object.keys(e).length === 0);
  }, [payerEmailError, memberErrors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidation(true);
    setError(null);

    if (!isValid) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/group/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payerEmail: payerEmail.trim(),
          members: members.map((m) => ({
            matricNumber: m.matricNumber.trim(),
            fullName: m.fullName.trim(),
            gender: m.gender,
            ...(m.email.trim() ? { email: m.email.trim() } : {}),
            ...(m.phone.trim() ? { phone: m.phone.trim() } : {}),
          })),
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.success) {
        throw new Error(parseApiError(res.status, json));
      }

      const groupId: string | undefined = json?.data?.groupId;
      if (!groupId) throw new Error("Registration succeeded but no group ID was returned.");

      localStorage.setItem("fyw_group_id", groupId);
      router.push(`/group/${encodeURIComponent(groupId)}`);
    } catch (err: any) {
      setError(err?.message ?? "Failed to register group.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#F9FAFB] font-sans text-slate-800">
      <Header />

      <main className="relative flex flex-1 flex-col items-center px-4 py-8 sm:py-12">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-[5%] top-[10%] h-[40%] w-[40%] rounded-full bg-[#1B5E20]/5 blur-[120px]" />
          <div className="absolute bottom-[10%] right-[5%] h-[35%] w-[35%] rounded-full bg-[#8B0000]/5 blur-[100px]" />
        </div>

        <div className="w-full max-w-3xl">
          {/* Heading */}
          <div className="mb-6 text-center">
            <span className="mb-3 inline-block rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-[#1B5E20]">
              Group Package
            </span>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Register Your Group of {GROUP_SIZE}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm font-medium text-slate-500">
              One fixed bundle: <span className="font-black text-slate-700">3 members</span>,
              the <span className="font-black text-slate-700">Full Experience</span> (all 5 days).
              Save <span className="font-black text-[#1B5E20]">{GROUP_DISCOUNT_PCT}%</span> vs
              registering individually — pay just{" "}
              <span className="font-black text-[#1B5E20]">₦{GROUP_TOTAL.toLocaleString("en-NG")}</span>{" "}
              instead of <span className="line-through">₦{GROUP_REGULAR_TOTAL.toLocaleString("en-NG")}</span>.
              You can pay in instalments — invites are sent once the full amount is received.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span className="material-symbols-outlined mt-0.5 text-base">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Payer */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">
                Payer
              </h2>
              <p className="mt-1 text-xs font-medium text-slate-500">
                The person paying — billed by the gateway and receives all receipts.
              </p>
              <div className="mt-4">
                <label className="ml-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                  Payer Email <span className="text-red-500">*</span>
                </label>
                <div className="group relative mt-2">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#1B5E20]">
                    mail
                  </span>
                  <input
                    type="email"
                    value={payerEmail}
                    onChange={(e) => setPayerEmail(e.target.value)}
                    placeholder="payer@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-12 pr-4 font-medium text-slate-800 placeholder:text-slate-400 transition-all focus:border-[#1B5E20] focus:outline-none focus:ring-4 focus:ring-[#1B5E20]/5"
                  />
                </div>
                {showValidation && payerEmailError && (
                  <p className="mt-1.5 ml-1 text-xs font-bold text-red-600">
                    {payerEmailError}
                  </p>
                )}
              </div>
            </div>

            {/* Members */}
            {members.map((member, i) => (
              <MemberCard
                key={i}
                index={i}
                member={member}
                errors={showValidation ? memberErrors[i] : {}}
                onChange={(patch) => updateMember(i, patch)}
              />
            ))}

            {/* Summary + submit */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Total
                    </p>
                    <span className="rounded-full bg-[#1B5E20]/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#1B5E20]">
                      {GROUP_DISCOUNT_PCT}% off
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black text-slate-900">
                      ₦{GROUP_TOTAL.toLocaleString("en-NG")}
                    </p>
                    <p className="text-base font-bold text-slate-400 line-through">
                      ₦{GROUP_REGULAR_TOTAL.toLocaleString("en-NG")}
                    </p>
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    ₦{(GROUP_TOTAL / GROUP_SIZE).toLocaleString("en-NG")} per member · pay in full or in parts
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="group flex items-center justify-center gap-2 rounded-xl bg-[#1B5E20] px-7 py-4 font-bold text-white shadow-lg shadow-[#1B5E20]/20 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-lg">
                        progress_activity
                      </span>
                      Registering...
                    </>
                  ) : (
                    <>
                      Register Group
                      <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">
                        arrow_forward
                      </span>
                    </>
                  )}
                </button>
              </div>

              <p className="mt-4 text-xs font-medium text-slate-400">
                A member can&apos;t join if they already have their own registration in
                progress — we&apos;ll tell you who, so you can swap them out.
              </p>
            </div>

            <p className="text-center text-sm font-bold tracking-[0.05em] text-slate-400">
              Already registered a group?{" "}
              <Link href="/group/resume" className="text-[#1B5E20]">
                Resume payment
              </Link>
            </p>
          </form>
        </div>

        <footer className="mt-12 flex items-center gap-2 text-xs text-slate-400">
          <span className="font-bold text-[#1B5E20]">Built by Korex</span>
          <span className="font-medium">© 2026 ULES</span>
        </footer>
      </main>
    </div>
  );
}

function MemberCard(props: {
  index: number;
  member: GroupMemberInput;
  errors: MemberErrors;
  onChange: (patch: Partial<GroupMemberInput>) => void;
}) {
  const { index, member, errors, onChange } = props;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1B5E20]/10 text-sm font-black text-[#1B5E20]">
          {index + 1}
        </div>
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">
          Member {index + 1}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextInput
          label="Matric Number"
          required
          icon="fingerprint"
          placeholder="e.g. 190408026"
          value={member.matricNumber}
          onChange={(v) => onChange({ matricNumber: v })}
          error={errors.matricNumber}
        />
        <TextInput
          label="Full Name"
          required
          icon="person"
          placeholder="Full name"
          value={member.fullName}
          onChange={(v) => onChange({ fullName: v })}
          error={errors.fullName}
        />

        {/* Gender */}
        <div>
          <label className="ml-1 text-xs font-bold uppercase tracking-widest text-slate-400">
            Gender <span className="text-red-500">*</span>
          </label>
          <div className="mt-2 flex gap-3">
            {(["male", "female"] as const).map((g) => (
              <label
                key={g}
                className={[
                  "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border py-3 text-sm font-bold capitalize transition",
                  member.gender === g
                    ? "border-[#1B5E20] bg-[#1B5E20]/10 text-[#1B5E20]"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name={`gender-${index}`}
                  value={g}
                  checked={member.gender === g}
                  onChange={() => onChange({ gender: g })}
                  className="sr-only"
                />
                {g}
              </label>
            ))}
          </div>
          {errors.gender && (
            <p className="mt-1.5 ml-1 text-xs font-bold text-red-600">
              {errors.gender}
            </p>
          )}
        </div>

        <TextInput
          label="Email"
          icon="mail"
          placeholder="member@example.com (recommended)"
          value={member.email}
          onChange={(v) => onChange({ email: v })}
          error={errors.email}
          hint="No email means this member gets no invite or notifications."
        />
        <TextInput
          label="Phone"
          icon="call"
          placeholder="0801... (optional)"
          value={member.phone}
          onChange={(v) => onChange({ phone: v })}
        />
      </div>
    </div>
  );
}

function TextInput(props: {
  label: string;
  icon: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  error?: string;
  hint?: string;
}) {
  const { label, icon, placeholder, value, onChange, required, error, hint } =
    props;
  return (
    <div>
      <label className="ml-1 text-xs font-bold uppercase tracking-widest text-slate-400">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="group relative mt-2">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#1B5E20]">
          {icon}
        </span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-12 pr-4 font-medium text-slate-800 placeholder:text-slate-400 transition-all focus:border-[#1B5E20] focus:outline-none focus:ring-4 focus:ring-[#1B5E20]/5"
        />
      </div>
      {error ? (
        <p className="mt-1.5 ml-1 text-xs font-bold text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 ml-1 text-[11px] font-medium text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

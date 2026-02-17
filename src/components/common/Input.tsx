// common/Input.tsx
"use client";

import React from "react";

export function Field(props: {
  label: string;
  icon: string;
  placeholder: string;
  name: string;
  value?: string;
  type?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}) {
  const { label, icon, placeholder, name, value, type, onChange } = props;

  return (
    <div className="flex flex-col gap-2">
      <label className="ml-1 text-xs font-bold uppercase tracking-widest text-slate-400">
        {label}
      </label>

      <div className="group relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#1B5E20]">
          {icon}
        </span>

        <input
          name={name}
          value={value}
          onChange={onChange}
          type={type || "text"}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-4 pl-12 pr-4 font-medium text-slate-800 placeholder:text-slate-400 transition-all focus:border-[#1B5E20] focus:outline-none focus:ring-4 focus:ring-[#1B5E20]/5"
        />
      </div>
    </div>
  );
}

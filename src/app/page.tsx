import StudentRegister from "@/components/pages/StudentRegister";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ULES FYW PAY - Identify",
};

export default function Page() {
  return (
    <div>
      <StudentRegister />
      {/* <Packages /> */}
    </div>
  );
}

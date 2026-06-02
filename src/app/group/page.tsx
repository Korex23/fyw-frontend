import GroupRegister from "@/components/pages/GroupRegister";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ULES FYW PAY - Group Registration",
};

export default function Page() {
  return <GroupRegister />;
}

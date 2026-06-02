import GroupStatusPage from "@/components/pages/GroupStatus";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ULES FYW PAY - Group Status",
};

export default function Page() {
  return <GroupStatusPage />;
}

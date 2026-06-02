export type PackageCode = "T" | "C" | "F";

export type PackageType = "CORPORATE_PLUS" | "CORPORATE_OWAMBE" | "FULL";

export type Pkg = {
  _id: string;
  code: PackageCode;
  name: string;
  packageType: PackageType;
  price: number;
  benefits: string[];
};

// ---------------------------------------------------------------------------
// Group package (fixed: 3 members → Full Experience → ₦162,000, 10% off ₦180,000)
// ---------------------------------------------------------------------------

export type PaymentStatus = "NOT_PAID" | "PARTIALLY_PAID" | "FULLY_PAID";

export const GROUP_SIZE = 3;
export const GROUP_DISCOUNT_PCT = 10;
export const GROUP_REGULAR_TOTAL = 180000; // 3 × ₦60,000 Full Experience
export const GROUP_TOTAL = 162000; // after 10% group discount
export const GROUP_SHARE = GROUP_TOTAL / GROUP_SIZE; // each member's share
export const GROUP_MATRIC_REGEX = /^(1904|2104)\d{5}$/;

/** A member as entered in the registration form. */
export type GroupMemberInput = {
  matricNumber: string;
  fullName: string;
  gender: "male" | "female" | "";
  email: string;
  phone: string;
};

/** A member as returned by the status endpoint. */
export type GroupMemberStatus = {
  matricNumber: string;
  fullName: string;
  email?: string | null;
  paymentStatus: PaymentStatus;
  share?: number; // this member's portion of the total (totalAmount / 3)
  totalPaid?: number; // collected amount split evenly across members
  outstanding?: number; // share − totalPaid
  hasInvite: boolean;
  inviteUrl?: string | null;
};

export type GroupStatus = {
  groupId: string;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  totalPaid: number;
  outstanding: number;
  payerEmail: string;
  members: GroupMemberStatus[];
  createdAt: string;
};

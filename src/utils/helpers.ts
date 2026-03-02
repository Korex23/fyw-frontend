export function formatNaira(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// ---------------------------------------------------------------------------
// API error parsing
// ---------------------------------------------------------------------------

const FIELD_LABELS: Record<string, string> = {
  matricNumber: "Matric number",
  fullName: "Full name",
  gender: "Gender",
  packageCode: "Package",
  newPackageCode: "Package",
  email: "Email",
  amount: "Amount",
  studentId: "Student ID",
  reference: "Reference",
};

const FRIENDLY_MESSAGES: Record<string, string> = {
  "matricNumber already exists": "This matric number is already registered.",
  "Student not found": "No student found with this matric number.",
  "Package already fully paid": "This package has already been fully paid.",
  "Amount must be greater than 0": "Payment amount must be greater than zero.",
  "Failed to initialize payment":
    "Payment could not be started. Please try again.",
  "Payment verification failed":
    "We couldn't verify your payment. Please contact support if money was deducted.",
  "Payment not found": "Payment record not found. Please check your reference.",
  "Can only upgrade to a higher-priced package. Downgrades are not allowed.":
    "You can only upgrade to a higher-priced package.",
  "Corporate Plus package requires exactly 1 additional day (Tuesday, Wednesday, or Thursday)":
    "Corporate Plus requires exactly one additional day — Tuesday, Wednesday, or Thursday.",
  "Corporate Plus package: additional day must be Tuesday, Wednesday, or Thursday":
    "The chosen day must be Tuesday, Wednesday, or Thursday.",
  "Selected days contain invalid day values":
    "One or more selected days are invalid.",
  "Internal server error": "Something went wrong on our end. Please try again.",
  "Too many requests, please try again later":
    "Too many requests. Please wait a moment and try again.",
  "Too many payment requests, please try again later":
    "Too many payment attempts. Please wait a moment and try again.",
};

function humanizeFieldMessage(raw: string): string {
  if (raw === "Required") return "is required";
  if (/String must contain at least \d+/.test(raw)) {
    const n = raw.match(/(\d+)/)?.[1];
    return `must be at least ${n} characters`;
  }
  if (raw.startsWith("String must contain exactly")) return "is invalid";
  if (raw.startsWith("Invalid enum value")) return "has an invalid value";
  if (raw === "Invalid email") return "must be a valid email address";
  if (raw === "Expected number, received string") return "must be a number";
  if (raw.startsWith("Number must be greater than"))
    return "must be greater than 0";
  return raw.toLowerCase();
}

/** Converts a raw API error response into a clean, user-facing string. */
export function parseApiError(status: number, body: unknown): string {
  const msg: string = (body as any)?.message ?? "";

  if (status === 429) {
    return (
      FRIENDLY_MESSAGES[msg] ??
      "Too many requests. Please wait a moment and try again."
    );
  }
  if (status === 500) {
    return "Something went wrong on our end. Please try again.";
  }
  if (status === 409) {
    return FRIENDLY_MESSAGES[msg] ?? msg;
  }
  if (status === 404) {
    return FRIENDLY_MESSAGES[msg] ?? msg;
  }
  if (status === 400) {
    // Shape A — stringified field-error array
    try {
      const fieldErrors = JSON.parse(msg) as {
        field: string;
        message: string;
      }[];
      if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
        return fieldErrors
          .map(({ field, message }) => {
            const key = field.replace(/^(body|query)\./, "");
            const label = FIELD_LABELS[key] ?? key;
            return `${label} ${humanizeFieldMessage(message)}`;
          })
          .join(". ");
      }
    } catch {
      // Shape B — plain string
    }
    return FRIENDLY_MESSAGES[msg] ?? msg;
  }

  return (
    (FRIENDLY_MESSAGES[msg] ?? msg) || "Something went wrong. Please try again."
  );
}

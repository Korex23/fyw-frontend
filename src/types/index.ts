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

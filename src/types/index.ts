export type PackageCode = "T" | "F";

export type Pkg = {
  _id: string;
  code: PackageCode;
  name: string;
  price: number;
  benefits: string[];
};

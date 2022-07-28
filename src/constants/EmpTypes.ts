/** Define ENUM for Employee Types */
export enum EMPTYPES {
  CTR = "ctr",
  MIL = "mil",
  CIV = "civ",
}

/** EmpType should only be 'civ', 'ctr', or 'mil' */
export type emptype = EMPTYPES.CIV | EMPTYPES.CTR | EMPTYPES.MIL;

/** Constant used for Choice Groups  */
export const empTypeOpts = [
  { value: EMPTYPES.CIV, label: "Civilian" },
  { value: EMPTYPES.MIL, label: "Military" },
  { value: EMPTYPES.CTR, label: "Contractor" },
];

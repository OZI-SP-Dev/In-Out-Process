/** EmpType should only be 'civ', 'ctr', or 'mil' */
export type emptype = "civ" | "ctr" | "mil";

/** Constant used for Choice Groups  */
export const EMPTYPES = [
  { value: 'civ', label: 'Civilian' },
  { value: 'mil', label: 'Military' },
  { value: 'ctr', label: 'Contractor' }
];

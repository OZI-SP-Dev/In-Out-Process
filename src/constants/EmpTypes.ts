import { IChoiceGroupOption } from "@fluentui/react";

/** EmpType should only be 'civ', 'ctr', or 'mil' */
export type emptype = "civ" | "ctr" | "mil";

/** Constant used for Choice Groups  */
export const EMPTYPES: IChoiceGroupOption[] = [
  { key: 'civ', text: 'Civilian' },
  { key: 'mil', text: 'Military' },
  { key: 'ctr', text: 'Contractor' }
];

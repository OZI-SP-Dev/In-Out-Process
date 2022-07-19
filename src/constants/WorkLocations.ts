/** Location should only be 'local', or 'remote' */
export type worklocation = "local" | "remote";

/** Constant used for Choice Groups  */
export const WORKLOCATIONS = [
  { value: "local", label: "Local" },
  { value: "remote", label: "Remote" },
];

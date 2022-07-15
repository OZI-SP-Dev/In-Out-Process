import { DateTime } from "luxon";

export interface ICheckListItem {
  Id: number;
  Title: string;
  Lead: string; // TBD: better as role and/or person?
  CompletedDate?: DateTime;
  SortOrder?: number;
}

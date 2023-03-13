import { IInRequest } from "api/RequestApi";
import { IPerson } from "api/UserApi";
import { EMPTYPES } from "constants/EmpTypes";

test("Load Test Data file", () => {});

export const testUsers: IPerson[] = [
  {
    Id: 1,
    Title: "Barb Akew (All)",
    EMail: "Barb Akew@localhost",
  },
  {
    Id: 2,
    Title: "Chris P. Bacon (IT)",
    EMail: "Chris P. Bacon@localhost",
  },
];

/* Incoming military example */
export const milRequest: IInRequest = {
  Id: 1,
  empName: testUsers[1].Title,
  empType: EMPTYPES.Military,
  gradeRank: "E-2",
  MPCN: 7654321,
  SAR: 5,
  workLocation: "local",
  office: "OZIC",
  isNewCivMil: "yes",
  prevOrg: "",
  hasExistingCAC: "",
  eta: new Date("2023-03-13T04:00:00.000Z"),
  completionDate: new Date("2023-04-10T04:00:00.000Z"),
  supGovLead: { ...testUsers[0] },
  employee: { ...testUsers[1] },
  isTraveler: "no",
  isSupervisor: "no",
  status: "Active",
};

/* Incoming civilian example */
export const civRequest: IInRequest = {
  Id: 2,
  empName: testUsers[1].Title,
  empType: EMPTYPES.Civilian,
  gradeRank: "GS-12",
  MPCN: 1234567,
  SAR: 5,
  sensitivityCode: 4,
  workLocation: "local",
  office: "OZIC",
  isNewCivMil: "no",
  prevOrg: "AFLCMC/WA",
  hasExistingCAC: "",
  eta: new Date("2023-03-13T04:00:00.000Z"),
  completionDate: new Date("2023-04-10T04:00:00.000Z"),
  supGovLead: { ...testUsers[0] },
  employee: { ...testUsers[1] },
  isTraveler: "yes",
  isSupervisor: "yes",
  status: "Active",
};

/* Incoming contractor example */
export const ctrRequest: IInRequest = {
  Id: 3,
  empName: testUsers[1].Title,
  empType: EMPTYPES.Contractor,
  gradeRank: "",
  MPCN: 4321567,
  SAR: 3,
  workLocation: "local",
  office: "OZIC",
  isNewCivMil: "",
  prevOrg: "",
  hasExistingCAC: "yes",
  CACExpiration: new Date("2024-12-31T05:00:00.000Z"),
  eta: new Date("2023-03-13T04:00:00.000Z"),
  completionDate: new Date("2023-04-10T04:00:00.000Z"),
  supGovLead: { ...testUsers[0] },
  employee: { ...testUsers[1] },
  isTraveler: "",
  isSupervisor: "",
  status: "Active",
};

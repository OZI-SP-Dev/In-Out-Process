import { rest } from "msw";

export const handlers = [
  // Build a fake context object for PnPJS
  rest.post("/_api/contextinfo", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        webFullUrl: "http://localhost:3000/",
        siteFullUrl: "http://localhost:3000/",
        formDigestValue: "value",
      })
    );
  }),

  // Get Request
  rest.get(
    "/_api/web/lists/getByTitle\\('Items')/items\\(:ItemId)",
    (req, res, ctx) => {
      const { ItemId } = req.params;
      let result = requests.find(
        (element: any) => element.Id === Number(ItemId)
      );
      return res(ctx.status(200), ctx.json({ value: result }));
    }
  ),

  // Update Request
  rest.post(
    "/_api/web/lists/getByTitle\\('Items')/items\\(:ItemId)",
    async (req, res, ctx) => {
      const { ItemId } = req.params;
      let index = requests.findIndex(
        (element: any) => element.Id === Number(ItemId)
      );
      let body = await req.json();

      requests[index].Id = body.Id ? body.Id : requests[index].Id;
      requests[index].empName = body.empName
        ? body.empName
        : requests[index].empName;
      requests[index].empType = body.empType
        ? body.empType
        : requests[index].empType;
      requests[index].gradeRank = body.gradeRank
        ? body.gradeRank
        : requests[index].gradeRank;
      requests[index].MPCN = body.MPCN ? body.MPCN : requests[index].MPCN;
      requests[index].SAR = body.SAR ? body.SAR : requests[index].SAR;
      requests[index].workLocation = body.workLocation
        ? body.workLocation
        : requests[index].workLocation;
      requests[index].office = body.office
        ? body.office
        : requests[index].office;
      requests[index].isNewCivMil = body.isNewCivMil
        ? body.isNewCivMil
        : requests[index].isNewCivMil;
      requests[index].prevOrg = body.prevOrg
        ? body.prevOrg
        : requests[index].prevOrg;
      requests[index].isNewToBaseAndCenter = body.isNewToBaseAndCenter
        ? body.isNewToBaseAndCenter
        : requests[index].isNewToBaseAndCenter;
      requests[index].hasExistingCAC = body.hasExistingCAC
        ? body.hasExistingCAC
        : requests[index].hasExistingCAC;
      requests[index].CACExpiration = body.CACExpiration
        ? body.CACExpiration
        : requests[index].CACExpiration;
      requests[index].eta = body.eta ? body.eta : requests[index].eta;
      requests[index].completionDate = body.completionDate
        ? body.completionDate
        : requests[index].completionDate;
      // supGovLead: {
      //   Id: 1,
      //   Title: "Default User",
      //   EMail: "defaultTEST@us.af.mil",
      // },
      // employee: {
      //   Id: 2,
      //   Title: "Default User 2",
      //   EMail: "defaultTEST2@us.af.mil",
      // },
      requests[index].isTraveler = body.isTraveler
        ? body.isTraveler
        : requests[index].isTraveler;

      return res(ctx.status(200), ctx.json({ value: requests[index] }));
    }
  ),

  // Create new Request
  rest.post(
    "/_api/web/lists/getByTitle\\('Items')/items",
    async (req, res, ctx) => {
      let body = await req.json();

      let request = {
        Id: maxRequestId++,
        empName: body.empName,
        empType: body.empType,
        gradeRank: body.gradeRank,
        MPCN: body.MPCN,
        SAR: body.SAR,
        workLocation: body.workLocation,
        office: body.office,
        isNewCivMil: body.isNewCivMil,
        prevOrg: body.prevOrg,
        isNewToBaseAndCenter: body.isNewToBaseAndCenter,
        hasExistingCAC: body.hasExistingCAC,
        CACExpiration: body.CACExpiration,
        eta: body.eta,
        completionDate: body.completionDate,
        supGovLead: {
          Id: 1,
          Title: "Default User",
          EMail: "defaultTEST@us.af.mil",
        },
        // employee: {
        //   Id: 2,
        //   Title: "Default User 2",
        //   EMail: "defaultTEST2@us.af.mil",
        // },
        isTraveler: body.isTraveler,
      };
      requests.push(request);
      console.log(requests);

      return res(ctx.status(200), ctx.json({ value: request }));
    }
  ),

  // Get all Items
  rest.get("/_api/web/lists/getByTitle\\('Items')/items", (req, res, ctx) => {
    const filter = req.url.searchParams.get("$filter");
    let results = structuredClone(requests);
    if (filter) {
      //filter the results
      switch (filter) {
        case "supGovLead/Id eq '1' or employee/Id eq '1'":
          results = results.filter(
            (item: any) => item.supGovLead.Id === 1 || item.employee.Id === 1
          );
          break;
        default:
      }
    }
    return res(ctx.status(200), ctx.json({ value: results }));
  }),
];

let requests: any = [
  {
    Id: 2,
    empName: "Doe, John D",
    empType: "Civilian",
    gradeRank: "GS-11",
    MPCN: 1234567,
    SAR: 5,
    workLocation: "remote",
    office: "OZIC",
    isNewCivMil: "yes",
    prevOrg: null,
    isNewToBaseAndCenter: "yes",
    hasExistingCAC: "no",
    CACExpiration: "2022-12-31T00:00:00.000Z",
    eta: "2022-12-31T00:00:00.000Z",
    completionDate: "2023-01-31T00:00:00.000Z",
    supGovLead: {
      Id: 1,
      Title: "Default User",
      EMail: "defaultTEST@us.af.mil",
    },
    employee: {
      Id: 2,
      Title: "Default User 2",
      EMail: "defaultTEST2@us.af.mil",
    },
    isTraveler: "no",
  },
  {
    Id: 1,
    empName: "Doe, Jane D",
    empType: "Civilian",
    gradeRank: "GS-13",
    MPCN: 7654321,
    SAR: 6,
    workLocation: "local",
    office: "OZIC",
    isNewCivMil: "no",
    prevOrg: "AFLCMC/WA",
    isNewToBaseAndCenter: "no",
    hasExistingCAC: "no",
    CACExpiration: "2022-12-31T00:00:00.000Z",
    eta: "2022-12-31T00:00:00.000Z",
    completionDate: "2023-01-31T00:00:00.000Z",
    supGovLead: {
      Id: 1,
      Title: "Default User",
      EMail: "defaultTEST@us.af.mil",
    },
    employee: {
      Id: 2,
      Title: "Default User 2",
      EMail: "defaultTEST2@us.af.mil",
    },
    isTraveler: "no",
  },
  {
    Id: 3,
    empName: "Default User",
    empType: "Civilian",
    gradeRank: "GS-12",
    MPCN: 1233217,
    SAR: 6,
    workLocation: "local",
    office: "OZIC",
    isNewCivMil: "yes",
    isTraveler: "yes",
    prevOrg: null,
    isNewToBaseAndCenter: "yes",
    hasExistingCAC: "no",
    CACExpiration: null,
    eta: "2022-12-31T00:00:00.000Z",
    completionDate: "2023-01-31T00:00:00.000Z",
    supGovLead: {
      Id: 2,
      Title: "Default User 2",
      EMail: "defaultTEST2@us.af.mil",
    },
    employee: {
      Id: 1,
      Title: "Default User",
      EMail: "defaultTEST@us.af.mil",
    },
  },
  {
    Id: 5,
    empName: "Cancelled, Imma B",
    empType: "Civilian",
    gradeRank: "GS-13",
    MPCN: 7654321,
    SAR: 6,
    workLocation: "local",
    office: "OZIC",
    isNewCivMil: "no",
    prevOrg: "AFLCMC/WA",
    isNewToBaseAndCenter: "no",
    hasExistingCAC: "no",
    CACExpiration: "2022-12-31T00:00:00.000Z",
    eta: "2022-12-31T00:00:00.000Z",
    completionDate: "2023-01-31T00:00:00.000Z",
    supGovLead: {
      Id: 1,
      Title: "Default User",
      EMail: "defaultTEST@us.af.mil",
    },
    employee: {
      Id: 2,
      Title: "Default User 2",
      EMail: "defaultTEST2@us.af.mil",
    },
    isTraveler: "no",
    closedOrCancelledDate: "2022-11-30T00:00:00.000Z",
    cancelReason: "Employee proceeded with new opportunity",
  },
  {
    Id: 4,
    empName: "Closed, Aye M",
    empType: "Civilian",
    gradeRank: "GS-13",
    MPCN: 7654321,
    SAR: 6,
    workLocation: "local",
    office: "OZIC",
    isNewCivMil: "no",
    prevOrg: "AFLCMC/WA",
    isNewToBaseAndCenter: "no",
    hasExistingCAC: "no",
    CACExpiration: "2022-12-31T00:00:00.000Z",
    eta: "2022-12-31T00:00:00.000Z",
    completionDate: "2023-01-31T00:00:00.000Z",
    supGovLead: {
      Id: 2,
      Title: "Default User 2",
      EMail: "defaultTEST@us.af.mil",
    },
    employee: {
      Id: 3,
      Title: "Default User 3",
      EMail: "defaultTEST2@us.af.mil",
    },
    isTraveler: "no",
    closedOrCancelledDate: "2022-11-30T00:00:00.000Z",
  },
];
let maxRequestId = requests.length + 1;

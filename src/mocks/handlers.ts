import { ICheckListResponseItem } from "api/CheckListItemApi";
import { IRequestItem, IResponseItem } from "api/RequestApi";
import { RoleType, SPRole } from "api/RolesApi";
import { EMPTYPES } from "constants/EmpTypes";
import { rest } from "msw";

const responsedelay = 500;

export const handlers = [
  /**
   * Build a fake context object for PnPJS
   */
  rest.post("/_api/contextinfo", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.delay(responsedelay),
      ctx.json({
        webFullUrl: "http://localhost:3000/",
        siteFullUrl: "http://localhost:3000/",
        formDigestValue: "value",
      })
    );
  }),

  /**
   * Build a fake ensure user function
   * Currently will ALWYAS return Brenda Wedding
   * To update this, we'll need to track users and user ID's
   */
  rest.post("/_api/web/ensureuser", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.delay(responsedelay),
      ctx.json({
        Id: 14,
        IsHiddenInUI: false,
        LoginName: "i:0#.f|membership|brenda.wedding@us.af.mil",
        Title: "WEDDING, BRENDA K NH-04 USAF AFMC AFLCMC/OZIC",
        PrincipalType: 1,
        Email: "brenda.wedding@us.af.mil",
        Expiration: "",
        IsEmailAuthenticationGuestUser: false,
        IsShareByEmailGuestUser: false,
        IsSiteAdmin: false,
        UserId: {
          NameId: "1003000099a500ad",
          NameIdIssuer: "urn:federation:microsoftonline",
        },
        UserPrincipalName: "brenda.wedding@us.af.mil",
      })
    );
  }),

  /**
   * Build emails API
   */
  rest.post("/_api/web/lists/getByTitle\\('Emails')/items", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.delay(responsedelay)
      //ctx.json({})
    );
  }),

  /**
   * Get Request Item
   */
  rest.get(
    "/_api/web/lists/getByTitle\\('Items')/items\\(:ItemId)",
    (req, res, ctx) => {
      const { ItemId } = req.params;
      let result = requests.find((element) => element.Id === Number(ItemId));
      if (result) {
        return res(
          ctx.status(200),
          ctx.delay(responsedelay),
          ctx.json({ value: result })
        );
      } else {
        return res(
          ctx.status(404),
          ctx.delay(responsedelay),
          ctx.json(notFound)
        );
      }
    }
  ),

  /**
   * Update Request Item
   * We know we're updating an item because an ItemId is included
   */
  rest.post(
    "/_api/web/lists/getByTitle\\('Items')/items\\(:ItemId)",
    async (req, res, ctx) => {
      const { ItemId } = req.params;
      let index = requests.findIndex(
        (element) => element.Id === Number(ItemId)
      );
      if (index !== -1) {
        let body = await req.json();
        updateRequest(body);
        return res(
          ctx.status(200),
          ctx.delay(responsedelay),
          ctx.json({ value: requests[index] })
        );
      } else {
        return res(
          ctx.status(404),
          ctx.delay(responsedelay),
          ctx.json(notFound)
        );
      }
    }
  ),

  // Create new Request
  rest.post(
    "/_api/web/lists/getByTitle\\('Items')/items",
    async (req, res, ctx) => {
      let body = (await req.json()) as IRequestItem;

      let request: IResponseItem = {
        Id: nextRequestId++,
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
        isSupervisor: body.isSupervisor,
      };
      requests.push(request);
      return res(
        ctx.status(200),
        ctx.delay(responsedelay),
        ctx.json({ value: request })
      );
    }
  ),

  // Get all Request Items
  rest.get("/_api/web/lists/getByTitle\\('Items')/items", (req, res, ctx) => {
    const filter = req.url.searchParams.get("$filter");
    let results = structuredClone(requests);
    if (filter) {
      //filter the results
      switch (filter) {
        case "supGovLead/Id eq '1' or employee/Id eq '1'":
          results = results.filter(
            (item: IResponseItem) =>
              item.supGovLead.Id === 1 || item.employee?.Id === 1
          );
          break;
        default:
      }
    }
    return res(
      ctx.status(200),
      ctx.delay(responsedelay),
      ctx.json({ value: results })
    );
  }),

  rest.get(
    "/_api/web/lists/getByTitle\\('CheckListItems')/items",
    (req, res, ctx) => {
      const filter = req.url.searchParams.get("$filter");
      let results = structuredClone(checklistitems);
      if (filter) {
        const RequestId = filter.match(/RequestId eq (.+?)/);
        if (RequestId) {
          results = results.filter(
            (item: ICheckListResponseItem) =>
              item.RequestId === Number(RequestId[1])
          );
        }
      }
      return res(
        ctx.status(200),
        ctx.delay(responsedelay),
        ctx.json({ value: results })
      );
    }
  ),

  // Handle $batch requests
  // TODO: actually parse the batch request and update our items as needed
  rest.post("/_api/$batch", async (req, res, ctx) => {
    // We're going to cheat for now and only pseudo parse these
    const body = await req.text();

    /**
     * RegExp
     * Matching group 0 finds the POST (excluded with ?:)
     * Matching group 1 finds the URL
     * Matching group 2 finds HTTP1.1 and headers (excluded with ?:)
     * Matching group 3 finds the object
     */
    const regex = RegExp(
      /(?:[POST|MERGE] http:\/\/localhost:3000)([A-Za-z0-9'/_:.\-()]+)(?:\sHTTP\/1\.1\saccept: application\/json\s+content-type: application\/json;charset=utf-8\s(?:if-match: \*)?\s+)({.+?})/g
    );

    const posts = Array.from(body.matchAll(regex), (m) => {
      /**
       * m[0] is the complete matched string
       * m[1] is matching group 1
       * m[2] is matching group 3
       */
      return [m[1], m[2]];
    });

    let batchresponse = "";
    posts.forEach((post) => {
      if (post[0] === "/_api/web/lists/getByTitle('CheckListItems')/items") {
        const item = JSON.parse(post[1]);
        checklistitems.push({
          Id: nextChecklistitemId++,
          Title: item.Title,
          Description: item.Description,
          Lead: item.Lead,
          CompletedDate: "",
          CompletedBy: undefined,
          RequestId: item.RequestId,
          TemplateId: item.TemplateId,
          Active: item.Active,
        });
        //add a batchresponse
      } else {
        let checklistitemId = post[0].match(
          /_api\/web\/lists\/getByTitle\('CheckListItems'\)\/items\((.+?)\)/
        );
        if (checklistitemId) {
          const thisId = checklistitemId[1];

          let index = checklistitems.findIndex(
            (element) => element.Id === Number(thisId)
          );

          if (index !== -1) {
            const item = JSON.parse(post[1]);

            const newItem = {
              ...checklistitems[index],
              ...(item.CompletedDate && { CompletedDate: item.CompletedDate }),
              ...(item.CompletedById && {
                CompletedBy: {
                  Id: item.CompletedById,
                  Title: "Default User " + item.CompletedById,
                  EMail: "defaultTEST@us.af.mil",
                },
              }),
              ...(item.Active && { Active: true }),
            };
            checklistitems[index] = newItem;
          }
        }
      }
    });

    // Count the number of POST (change) requests in the batch
    const count = posts.length;
    const batch = `--batchresponse_88fbf8e7-8616-4c32-96c8-cedd3323460b
Content-Type: application/http
Content-Transfer-Encoding: binary

HTTP/1.1 201 Created
CONTENT-TYPE: application/json;odata=minimalmetadata;streaming=true;charset=utf-8
ETAG: "34501734-b43e-455e-badb-142ade3ef2f1,1"
LOCATION: http://localhost:3000/_api/Web/Lists(guid'5325476d-8a45-4e66-bdd9-d55d72d51d15')/Items(59)

{"odata.metadata":"http://localhost:3000/_api/$metadata#SP.ListData.ChecklistItemsListItems/@Element","odata.type":"SP.Data.ChecklistItemsListItem","odata.id":"d9d8aefe-6f84-4dbe-9c1c-b9cb45e58e38","odata.etag":"\\"1\\"","odata.editLink":"Web/Lists(guid'5325476d-8a45-4e66-bdd9-d55d72d51d15')/Items(59)","FileSystemObjectType":0,"Id":59,"ServerRedirectedEmbedUri":null,"ServerRedirectedEmbedUrl":"","ContentTypeId":"0x0100EFABA43AC7208144A715E899CA25CAE5","Title":"Welcome Package","ComplianceAssetId":null,"Lead":"Supervisor","CompletedDate":null,"RequestId":11.0,"CompletedById":null,"CompletedByStringId":null,"Description":"<p>This is a sample description of a task.</p><p>It <b>CAN</b> contain <span style='color:#4472C4'>fancy</span><span style='background:yellow'>formatting</span> to help deliver an <span    style='font-size:14.0pt;line-height:107%'>IMPACTFUL </span>message/</p>","TemplateId":null,"Active":true,"ID":59,"Modified":"2022-11-04T16:12:04Z","Created":"2022-11-04T16:12:04Z","AuthorId":13,"EditorId":13,"OData__UIVersionString":"1.0","Attachments":false,"GUID":"a1815a34-a494-4a6e-a4ad-a4542b94c6b4"}`;

    // For each POST request found, add our response

    for (let x = 0; x < count; x++) {
      batchresponse += batch + "\n";
    }
    batchresponse += "--batchresponse_88fbf8e7-8616-4c32-96c8-cedd3323460b--\n";

    return res(
      ctx.status(200),
      ctx.delay(responsedelay),
      ctx.text(batchresponse),
      ctx.set(
        "Content-Type",
        "multipart/mixed; boundary=batchresponse_88fbf8e7-8616-4c32-96c8-cedd3323460b"
      ),
      ctx.set("SPRequestGuid", "6b5975a0-40d3-0000-1598-09882fca4612"),
      ctx.set("request-id", "6b5975a0-40d3-0000-1598-09882fca4612")
    );
  }),

  /**
   * Get all Roles
   */
  rest.get("/_api/web/lists/getByTitle\\('Roles')/items", (req, res, ctx) => {
    let results = structuredClone(testRoles);
    return res(
      ctx.status(200),
      ctx.delay(responsedelay),
      ctx.json({ value: results })
    );
  }),

  /**
   * Get a specific Role
   */
  rest.get(
    "/_api/web/lists/getByTitle\\('Roles')/items\\(:ItemId)",
    (req, res, ctx) => {
      const { ItemId } = req.params;
      let result = requests.find((element) => element.Id === Number(ItemId));
      if (result) {
        return res(
          ctx.status(200),
          ctx.delay(responsedelay),
          ctx.json({ value: result })
        );
      } else {
        return res(
          ctx.status(404),
          ctx.delay(responsedelay),
          ctx.json(notFound)
        );
      }
    }
  ),

  /**
   * Delete a Role
   */
  rest.post(
    "/_api/web/lists/getByTitle\\('Roles')/items\\(:ItemId)",
    async (req, res, ctx) => {
      const { ItemId } = req.params;
      let index = testRoles.findIndex(
        (element) => element.Id === Number(ItemId)
      );
      if (index !== -1) {
        //let body = await req.json();
        testRoles.splice(index, 1);
        console.log(testRoles);
        return res(
          ctx.status(200),
          ctx.delay(responsedelay)
          //ctx.json({ value: requests[index] })
        );
      } else {
        return res(
          ctx.status(404),
          ctx.delay(responsedelay),
          ctx.json(notFound)
        );
      }
    }
  ),

  /**
   * Add a user to a Role
   * Currently that user will ALWYAS be Brenda Wedding
   * To update this, we'll need to track users and user ID's
   */
  rest.post(
    "/_api/web/lists/getByTitle\\('Roles')/items",
    async (req, res, ctx) => {
      let body = await req.json();
      let role = {
        Id: ++maxRoleId,
        User: {
          Id: body.UserId,
          Title: "WEDDING, BRENDA K NH-04 USAF AFMC AFLCMC/OZIC",
          EMail: "brenda.wedding@us.af.mil",
        },
        Title: body.Title,
      };

      testRoles.push(role);
      alert(JSON.stringify(testRoles));
      return res(
        ctx.status(200),
        ctx.delay(responsedelay),
        ctx.json({ value: role }) //This may not be correct, but I can't verify in Chrome dev tools and GPUpdate isn't fixing it
      );
    }
  ),

  /**
   * Delete a User Role
   */
  rest.post(
    "/_api/web/lists/getByTitle\\('Roles')/items\\(:ItemId)",
    async (req, res, ctx) => {
      const { ItemId } = req.params;
      let index = testRoles.findIndex(
        (element) => element.Id === Number(ItemId)
      );
      if (index !== -1) {
        testRoles.splice(index, 1);
        console.log(testRoles);
        return res(
          ctx.status(200),
          ctx.delay(responsedelay)
          //ctx.json({ value: requests[index] })
        );
      } else {
        return res(
          ctx.status(404),
          ctx.delay(responsedelay),
          ctx.json(notFound)
        );
      }
    }
  ),
];

/**
 * requests array holds our sample data
 */
let requests: IResponseItem[] = [
  {
    Id: 2,
    empName: "Doe, John D",
    empType: EMPTYPES.Civilian,
    gradeRank: "GS-11",
    MPCN: 1234567,
    SAR: 5,
    workLocation: "remote",
    office: "OZIC",
    isNewCivMil: "yes",
    prevOrg: "",
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
    isSupervisor: "no",
  },
  {
    Id: 1,
    empName: "Doe, Jane D",
    empType: EMPTYPES.Civilian,
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
    isSupervisor: "no",
  },
  {
    Id: 3,
    empName: "Default User",
    empType: EMPTYPES.Civilian,
    gradeRank: "GS-12",
    MPCN: 1233217,
    SAR: 6,
    workLocation: "local",
    office: "OZIC",
    isNewCivMil: "yes",
    isTraveler: "yes",
    isSupervisor: "no",
    prevOrg: "",
    isNewToBaseAndCenter: "yes",
    hasExistingCAC: "no",
    CACExpiration: "",
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
    empType: EMPTYPES.Civilian,
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
    isSupervisor: "yes",
    closedOrCancelledDate: "2022-11-30T00:00:00.000Z",
    cancelReason: "Employee proceeded with new opportunity",
  },
  {
    Id: 4,
    empName: "Closed, Aye M",
    empType: EMPTYPES.Civilian,
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
    isSupervisor: "no",
    closedOrCancelledDate: "2022-11-30T00:00:00.000Z",
  },
];
let nextRequestId = requests.length + 1;

/**
 * checklistitems array holds our sample data
 */
let checklistitems: ICheckListResponseItem[] = [
  {
    Id: 1,
    Title: "First Item!",
    Description:
      "<p>This is a sample description of a task.</p><p>It <b>CAN</b> contain <span style='color:#4472C4'>fancy</span> <span style='background:yellow'>formatting</span> to help deliver an <span    style='font-size:14.0pt;line-height:107%'>IMPACTFUL </span>message/</p>",
    Lead: "Admin",
    CompletedDate: "2022-09-15",
    CompletedBy: {
      Id: 2,
      Title: "Default User 2",
      EMail: "defaultTEST2@us.af.mil",
    },
    RequestId: 1,
    TemplateId: -1,
    Active: true,
  },
  {
    Id: 2,
    Title: "Second Item!",
    Description: "<p>This task should be able to be completed by IT</p>",
    Lead: "IT",
    CompletedDate: "",
    CompletedBy: undefined,
    RequestId: 1,
    TemplateId: -2,
    Active: true,
  },
  {
    Id: 3,
    Title: "Third Item!",
    Description:
      "<p>This task should be able to be completed by Supervisor</p>",
    Lead: "Supervisor",
    CompletedDate: "",
    CompletedBy: undefined,
    RequestId: 1,
    TemplateId: -3,
    Active: true,
  },
  {
    Id: 4,
    Title: "Fourth Item!",
    Description:
      "<p>This task should be able to be completed by Employee or Supervisor</p>",
    Lead: "Employee",
    CompletedDate: "",
    CompletedBy: undefined,
    RequestId: 1,
    TemplateId: -4,
    Active: false,
  },
  {
    Id: 5,
    Title: "TESTING ITEM",
    Description:
      "<p>This item should become enabled AFTER the Welcome Package is complete</p>",
    Lead: "Supervisor",
    CompletedDate: "",
    CompletedBy: undefined,
    RequestId: 2,
    TemplateId: -1,
    Active: false,
  },
  {
    Id: 6,
    Title: "Welcome Package",
    Description:
      "<p>This is a sample description of a task.</p><p>It <b>CAN</b> contain <span style='color:#4472C4'>fancy</span><span style='background:yellow'>formatting</span> to help deliver an <span    style='font-size:14.0pt;line-height:107%'>IMPACTFUL </span>message/</p>",
    Lead: "Supervisor",
    CompletedDate: "",
    CompletedBy: undefined,
    RequestId: 2,
    TemplateId: 1,
    Active: true,
  },
  {
    Id: 7,
    Title: "IA Training",
    Description: "",
    Lead: "Employee",
    CompletedDate: "",
    CompletedBy: undefined,
    RequestId: 2,
    TemplateId: 2,
    Active: true,
  },
  {
    Id: 8,
    Title: "Attend On-Base Training",
    Description: "",
    Lead: "Employee",
    CompletedDate: "",
    CompletedBy: undefined,
    RequestId: 2,
    TemplateId: 5,
    Active: true,
  },
  {
    Id: 9,
    Title: "GTC In-processing",
    Description: "",
    Lead: "GTC",
    CompletedDate: "",
    CompletedBy: undefined,
    RequestId: 2,
    TemplateId: 6,
    Active: true,
  },
  {
    Id: 10,
    Title: "DTS In-processing",
    Description: "",
    Lead: "DTS",
    CompletedDate: "",
    CompletedBy: undefined,
    RequestId: 2,
    TemplateId: 7,
    Active: true,
  },
  {
    Id: 11,
    Title: "ATAAPS In-processing",
    Description: "",
    Lead: "ATAAPS",
    CompletedDate: "",
    CompletedBy: undefined,
    RequestId: 2,
    TemplateId: 8,
    Active: false,
  },
];
let nextChecklistitemId = checklistitems.length + 1;

/**
 * json returned when a "SharePoint" item is not found
 */
const notFound = {
  "odata.error": {
    code: "-2130575338, System.ArgumentException",
    message: {
      lang: "en-US",
      value: "Item does not exist. It may have been deleted by another user.",
    },
  },
};

/**
 * Update request
 */
const updateRequest = (item: IResponseItem) => {
  let index = requests.findIndex((element) => element.Id === Number(item.Id));

  if (index !== -1) {
    requests[index].empName = item.empName
      ? item.empName
      : requests[index].empName;
    requests[index].empType = item.empType
      ? item.empType
      : requests[index].empType;
    requests[index].gradeRank = item.gradeRank
      ? item.gradeRank
      : requests[index].gradeRank;
    requests[index].MPCN = item.MPCN ? item.MPCN : requests[index].MPCN;
    requests[index].SAR = item.SAR ? item.SAR : requests[index].SAR;
    requests[index].workLocation = item.workLocation
      ? item.workLocation
      : requests[index].workLocation;
    requests[index].office = item.office ? item.office : requests[index].office;
    requests[index].isNewCivMil = item.isNewCivMil
      ? item.isNewCivMil
      : requests[index].isNewCivMil;
    requests[index].prevOrg = item.prevOrg
      ? item.prevOrg
      : requests[index].prevOrg;
    requests[index].isNewToBaseAndCenter = item.isNewToBaseAndCenter
      ? item.isNewToBaseAndCenter
      : requests[index].isNewToBaseAndCenter;
    requests[index].hasExistingCAC = item.hasExistingCAC
      ? item.hasExistingCAC
      : requests[index].hasExistingCAC;
    requests[index].CACExpiration = item.CACExpiration
      ? item.CACExpiration
      : requests[index].CACExpiration;
    requests[index].eta = item.eta ? item.eta : requests[index].eta;
    requests[index].completionDate = item.completionDate
      ? item.completionDate
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
    requests[index].isTraveler = item.isTraveler
      ? item.isTraveler
      : requests[index].isTraveler;
    requests[index].isSupervisor = item.isSupervisor
      ? item.isSupervisor
      : requests[index].isSupervisor;
  }
  if (item.cancelReason) {
    requests[index].cancelReason = item.cancelReason;
  }
  if (item.closedOrCancelledDate) {
    requests[index].closedOrCancelledDate = item.closedOrCancelledDate;
  }
};

/**
 * Default sample data roles
 */
let testRoles: SPRole[] = [
  {
    Id: 1,
    User: {
      Id: 1,
      Title: "FORREST, GREGORY M CTR USAF AFMC AFLCMC/OZIC",
      EMail: "me@example.com",
    },
    Title: RoleType.ADMIN,
  },
  {
    Id: 2,
    User: {
      Id: 2,
      Title: "PORTERFIELD, ROBERT D GS-13 USAF AFMC AFLCMC/OZIC",
      EMail: "me@example.com",
    },
    Title: RoleType.IT,
  },
  {
    Id: 3,
    User: {
      Id: 1,
      Title: "FORREST, GREGORY M CTR USAF AFMC AFLCMC/OZIC",
      EMail: "me@example.com",
    },
    Title: RoleType.IT,
  },
];

/**
 * The maxId of records in testRoles -- used for appending new roles in DEV env to mimic SharePoint
 */
let maxRoleId = testRoles.length;

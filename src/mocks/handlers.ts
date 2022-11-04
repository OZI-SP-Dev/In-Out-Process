import { rest } from "msw";

export const handlers = [
  /**
   * Build a fake context object for PnPJS
   */
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

  /**
   * Get Request Item
   */
  rest.get(
    "/_api/web/lists/getByTitle\\('Items')/items\\(:ItemId)",
    (req, res, ctx) => {
      const { ItemId } = req.params;
      let result = requests.find(
        (element: any) => element.Id === Number(ItemId)
      );
      if (result) {
        return res(ctx.status(200), ctx.json({ value: result }));
      } else {
        return res(ctx.status(404), ctx.json(notFound));
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
        (element: any) => element.Id === Number(ItemId)
      );
      if (index !== -1) {
        let body = await req.json();
        updateRequest(body);
        return res(ctx.status(200), ctx.json({ value: requests[index] }));
      } else {
        return res(ctx.status(404), ctx.json(notFound));
      }
    }
  ),

  // Create new Request
  rest.post(
    "/_api/web/lists/getByTitle\\('Items')/items",
    async (req, res, ctx) => {
      let body = await req.json();

      let request = {
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
      };
      requests.push(request);
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

  // Handle $batch requests
  // TODO: actually parse the batch request and update our items as needed
  rest.post("/_api/$batch", async (req, res, ctx) => {
    // We're going to cheat for now and only pseudo parse these
    const body = await req.text();
    // Count the number of POST (change) requests in the batch
    const count = (body.match(/POST /g) || []).length;

    const batch = `--batchresponse_88fbf8e7-8616-4c32-96c8-cedd3323460b
Content-Type: application/http
Content-Transfer-Encoding: binary

HTTP/1.1 201 Created
CONTENT-TYPE: application/json;odata=minimalmetadata;streaming=true;charset=utf-8
ETAG: "34501734-b43e-455e-badb-142ade3ef2f1,1"
LOCATION: http://localhost:3000/_api/Web/Lists(guid'5325476d-8a45-4e66-bdd9-d55d72d51d15')/Items(59)

{"odata.metadata":"http://localhost:3000/_api/$metadata#SP.ListData.ChecklistItemsListItems/@Element","odata.type":"SP.Data.ChecklistItemsListItem","odata.id":"d9d8aefe-6f84-4dbe-9c1c-b9cb45e58e38","odata.etag":"\\"1\\"","odata.editLink":"Web/Lists(guid'5325476d-8a45-4e66-bdd9-d55d72d51d15')/Items(59)","FileSystemObjectType":0,"Id":59,"ServerRedirectedEmbedUri":null,"ServerRedirectedEmbedUrl":"","ContentTypeId":"0x0100EFABA43AC7208144A715E899CA25CAE5","Title":"Welcome Package","ComplianceAssetId":null,"Lead":"Supervisor","CompletedDate":null,"RequestId":11.0,"CompletedById":null,"CompletedByStringId":null,"Description":"<p>This is a sample description of a task.</p><p>It <b>CAN</b> contain <span style='color:#4472C4'>fancy</span><span style='background:yellow'>formatting</span> to help deliver an <span    style='font-size:14.0pt;line-height:107%'>IMPACTFUL </span>message/</p>","TemplateId":null,"Active":true,"ID":59,"Modified":"2022-11-04T16:12:04Z","Created":"2022-11-04T16:12:04Z","AuthorId":13,"EditorId":13,"OData__UIVersionString":"1.0","Attachments":false,"GUID":"a1815a34-a494-4a6e-a4ad-a4542b94c6b4"}`;

    // For each POST request found, add our response
    let batchresponse = "";
    for (let x = 0; x < count; x++) {
      batchresponse += batch + "\n";
    }
    batchresponse += "--batchresponse_88fbf8e7-8616-4c32-96c8-cedd3323460b--\n";

    return res(
      ctx.status(200),
      ctx.text(batchresponse),
      ctx.set(
        "Content-Type",
        "multipart/mixed; boundary=batchresponse_88fbf8e7-8616-4c32-96c8-cedd3323460b"
      ),
      ctx.set("SPRequestGuid", "6b5975a0-40d3-0000-1598-09882fca4612"),
      ctx.set("request-id", "6b5975a0-40d3-0000-1598-09882fca4612")
    );
  }),
];

/**
 * requests array holds our sample data
 */
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
let nextRequestId = requests.length + 1;

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
const updateRequest = (item: any) => {
  console.log(item);
  let index = requests.findIndex(
    (element: any) => element.Id === Number(item.Id)
  );

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
  }
};

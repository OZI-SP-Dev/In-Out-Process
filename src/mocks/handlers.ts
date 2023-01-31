import { IExampleExtendedPersonaProps, people } from "@fluentui/example-data";
import { ICheckListResponseItem } from "api/CheckListItemApi";
import { IRequestItem, IResponseItem } from "api/RequestApi";
import { RoleType, SPRole } from "api/RolesApi";
import { IPerson } from "api/UserApi";
import { EMPTYPES } from "constants/EmpTypes";
import { rest } from "msw";

const responsedelay = 500;

/**
 * Users table
 */
let testUsers: IPerson[] = [
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
  {
    Id: 3,
    Title: "Cole Slaw (ATAAPS)",
    EMail: "Cole Slaw@localhost",
  },
  {
    Id: 4,
    Title: "Patty O'Table (FOG)",
    EMail: "Patty O'Table@localhost",
  },
  {
    Id: 5,
    Title: "Chip N. Dip (DTS)",
    EMail: "Chip N. Dip@localhost",
  },
  {
    Id: 6,
    Title: "Walter Mellon (GTC)",
    EMail: "Walter Mellon@localhost",
  },
  {
    Id: 7,
    Title: "Herb Alty (Security)",
    EMail: "Herb Alty@localhost",
  },
  {
    Id: 8,
    Title: "Saul Sage (Regular User)",
    EMail: "Saul Sagey@localhost",
  },
  {
    Id: 9,
    Title: "Des Urt (Regular User)",
    EMail: "Des Urt@localhost",
  },
];

/**
 * Default sample data roles
 */
let testRoles: SPRole[] = [
  /* All Roles for Barb Akew */
  { Id: 1, User: { ...testUsers[0] }, Title: RoleType.ADMIN },
  { Id: 2, User: { ...testUsers[0] }, Title: RoleType.IT },
  { Id: 3, User: { ...testUsers[0] }, Title: RoleType.ATAAPS },
  { Id: 4, User: { ...testUsers[0] }, Title: RoleType.FOG },
  { Id: 5, User: { ...testUsers[0] }, Title: RoleType.DTS },
  { Id: 6, User: { ...testUsers[0] }, Title: RoleType.GTC },
  { Id: 7, User: { ...testUsers[0] }, Title: RoleType.SECURITY },
  { Id: 8, User: { ...testUsers[1] }, Title: RoleType.IT }, // IT for Chris P. Bacon
  { Id: 9, User: { ...testUsers[2] }, Title: RoleType.ATAAPS }, // ATAAPS for Cole Slaw
  { Id: 10, User: { ...testUsers[3] }, Title: RoleType.FOG }, // FOG for Patty O'Table
  { Id: 11, User: { ...testUsers[4] }, Title: RoleType.DTS }, // DTS for Chip N. Dip
  { Id: 12, User: { ...testUsers[5] }, Title: RoleType.GTC }, // GTC for Walter Mellon@localhost
  { Id: 13, User: { ...testUsers[6] }, Title: RoleType.SECURITY }, // SECURITY for Herb Alty
];

/**
 * The maxId of records in testRoles -- used for appending new roles in DEV env to mimic SharePoint
 */
let maxRoleId = testRoles.length;

/**
 * Custom type guard to determine if it is an IPerson or FluentUI example data user
 * @param userObj The IPerson array of people entries
 * @returns A boolean on whether this is an IPerson object type
 */
function isIPerson(
  userObj: IPerson | (IExampleExtendedPersonaProps & { key: string | number })
): userObj is IPerson {
  return "Title" in userObj ? true : false; // If it has a Title prop, then assume it is an IPerson (testUser)
}

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
  rest.post("/_api/web/ensureuser", async (req, res, ctx) => {
    let body = await req.json();
    let email: string = body.logonName;
    let title = email.replace("@localhost", "");

    let user = testUsers.find((element) => element.EMail === body.logonName);
    if (!user) {
      user = {
        Id: getHash(title),
        Title: title,
        EMail: email,
      };
      testUsers.push(user);
    }

    return res(
      ctx.status(200),
      ctx.delay(responsedelay),
      ctx.json({
        Id: user.Id,
        Title: user.Title,
        Email: user.EMail,
      })
    );
  }),

  /**
   * Build a fake ClientPeoplePickerSearchUser function to emulate GAL lookup for the PeoplePicker
   */
  rest.post(
    "/_api/sp.ui.applicationpages.clientpeoplepickerwebserviceinterface.clientpeoplepickersearchuser",
    async (req, res, ctx) => {
      let body = await req.json();
      // Get the QueryString from the request
      // Ignore all the other parameters for now, and assume it is
      //  to just look up a standard user accoutn
      let queryString: string = body.queryParams.QueryString;

      // Find matches from the FluentUI example data
      const peopleUsers = people.filter(
        (person) =>
          person.text?.toLowerCase().includes(queryString.toLowerCase()) &&
          !testUsers.find((testUser) => testUser.Title === person.text) // Exclude any that are also defined in testUsers
      );

      // Find matches from the predefined (and added on the fly) testUsers
      const users = testUsers
        .filter((person) =>
          person.Title.toLowerCase().includes(queryString.toLowerCase())
        )
        .sort(
          (
            a,
            b // Sort our testUsers alphabetially
          ) => a.Title.localeCompare(b.Title)
        );

      // Add any users from our testUsers data to the top, and the FluentUI data to the bottom of the results
      const retValue = [...users, ...peopleUsers].map((user) => {
        // Hardcode some return values and dynamically populate others
        const email = isIPerson(user)
          ? user.EMail
          : (user.text ? user.text : "DEFAULT") + "@localhost";

        const title = isIPerson(user)
          ? user.Title
          : user.text
          ? user.text
          : "DEFAULT";
        return {
          Key: `i:0#.f|membership|${email}`,
          DisplayText: title,
          IsResolved: true,
          Description: email,
          EntityType: "User",
          EntityData: {
            IsAltSecIdPresent: "False",
            UserKey: `i:0h.f|membership|${title}@live.com`, //"i:0h.f|membership|abcdefghijklmnop@live.com",
            Title: "Test User Job Title",
            Email: email,
            MobilePhone: "",
            ObjectId: title, //"a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6",
            Department: "AFMC",
          },
          MultipleMatches: [],
          ProviderName: "Tenant",
          ProviderDisplayName: "Tenant",
        };
      });

      return res(
        ctx.status(200),
        ctx.delay(responsedelay),
        ctx.json({
          value: JSON.stringify(retValue),
        })
      );
    }
  ),

  /**
   * Build emails API
   */
  rest.post("/_api/web/lists/getByTitle\\('Emails')/items", (req, res, ctx) => {
    return res(ctx.status(200), ctx.delay(responsedelay));
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
      let supervisor = testUsers.find(
        (element) => element.Id === Number(body.supGovLeadId)
      );
      let employee = testUsers.find(
        (element) => element.Id === Number(body.employeeId)
      );
      if (supervisor) {
        let request: IResponseItem = {
          Id: nextRequestId++,
          empName: body.empName,
          empType: body.empType,
          gradeRank: body.gradeRank,
          MPCN: body.MPCN,
          SAR: body.SAR,
          sensitivityCode: body.sensitivityCode,
          workLocation: body.workLocation,
          office: body.office,
          isNewCivMil: body.isNewCivMil,
          prevOrg: body.prevOrg,
          isNewToBaseAndCenter: body.isNewToBaseAndCenter,
          hasExistingCAC: body.hasExistingCAC,
          CACExpiration: body.CACExpiration,
          eta: body.eta,
          completionDate: body.completionDate,
          supGovLead: { ...supervisor },
          isTraveler: body.isTraveler,
          isSupervisor: body.isSupervisor,
        };
        if (employee) {
          request.employee = { ...employee };
        }
        requests.push(request);
        return res(
          ctx.status(200),
          ctx.delay(responsedelay),
          ctx.json({ value: request })
        );
      }
      return res(ctx.status(400), ctx.delay(responsedelay));
    }
  ),

  // Get all Request Items
  rest.get("/_api/web/lists/getByTitle\\('Items')/items", (req, res, ctx) => {
    const filter = req.url.searchParams.get("$filter");
    let results = structuredClone(requests);
    if (filter) {
      // Filter for My Requests
      const myRequestFilter = filter.match(
        /\(supGovLead\/Id eq '(-?\d+)' or employee\/Id eq '(-?\d+)'\) and closedOrCancelledDate eq null/
      );

      // If the filter was for My Requests
      if (myRequestFilter) {
        results = results.filter(
          (item: IResponseItem) =>
            (item.supGovLead.Id.toString() === myRequestFilter[2] ||
              item.employee?.Id.toString() === myRequestFilter[1]) &&
            !item.closedOrCancelledDate
        );
      } else {
        // If a filter was passed, but we didn't have a match for how to process it, return an error so mock can be adjusted
        return res(
          ctx.status(500),
          ctx.delay(responsedelay),
          ctx.body(`No Mock created for this filter string - ${filter}`)
        );
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
        // Filter for checklist items for a specific request
        const RequestId = filter.match(/RequestId eq (\d+)/);
        // Filter for open checklist items
        const CompletedDate = filter.match(/CompletedDate eq null/);
        // Filter for Roles
        const filterRoles = [...filter.matchAll(/(?:Lead eq ')(\w+)(?:')/g)];
        let roles: string[] = []; // Array of roles we want to filter for
        filterRoles.forEach((item) => roles.push(item[1])); // initialize roles from regex array

        if (RequestId) {
          results = results.filter(
            (item: ICheckListResponseItem) =>
              item.RequestId === Number(RequestId[1])
          );
        } else if (CompletedDate) {
          results = results.filter(
            (item: ICheckListResponseItem) => !item.CompletedDate
          );
          if (filterRoles) {
            results = results.filter((item: ICheckListResponseItem) =>
              roles.includes(item.Lead)
            );
          }
        } else if (filterRoles) {
          results = results.filter((item: ICheckListResponseItem) =>
            roles.includes(item.Lead)
          );
        } else {
          // If a filter was passed, but we didn't have a match for how to process it, return an error so mock can be adjusted
          return res(
            ctx.status(500),
            ctx.delay(responsedelay),
            ctx.body(`No Mock created for this filter string - ${filter}`)
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

  /**
   * Update ChecklistItem
   * We know we're updating an item because an ItemId is included
   * Most updates happen via batch (creation/completion/activation) -- This handles reactivating
   */
  rest.post(
    "/_api/web/lists/getByTitle\\('ChecklistItems')/items\\(:ItemId)",
    async (req, res, ctx) => {
      const { ItemId } = req.params;
      let index = checklistitems.findIndex(
        (element) => element.Id === Number(ItemId)
      );
      if (index !== -1) {
        let body = await req.json();

        // If we have a CompletedByStringId of "" and a CompletedById of -1 then we are clearing the CompletedBy field
        if (body.CompletedByStringId === "" && body.CompletedById === -1) {
          // Drop the CompletedByStringId and CompletedById fields, and set CompletedBy to null
          body = {
            ...body,
            CompletedByStringId: undefined,
            CompletedById: undefined,
            CompletedBy: null,
          };
        }

        // Pass along any other updates, such as CompletedDate
        const updatedItem = { ...checklistitems[index], ...body };

        // Update the ChecklistItems data with our updated record
        checklistitems[index] = updatedItem;

        return res(
          ctx.status(200),
          ctx.delay(responsedelay),
          ctx.json({ value: checklistitems[index] })
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
      if (post[0] === "/_api/web/lists/getByTitle('Emails')/items") {
        // Do nothing as we don't actually need to track Emails
      } else if (
        post[0] === "/_api/web/lists/getByTitle('CheckListItems')/items"
      ) {
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
                  Title: testUsers.find(
                    (user) => user.Id === item.CompletedById
                  )?.Title,
                  EMail: testUsers.find(
                    (user) => user.Id === item.CompletedById
                  )?.EMail,
                },
              }),
              ...(item.Active && { Active: true }),
            };
            checklistitems[index] = newItem;
          }
        }
      }
    });

    // TODO -- Actually update the repsonse for Emails, but for now just return the CheckList item data since we aren't doing anythign with it
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
    const filter = req.url.searchParams.get("$filter");
    let results = structuredClone(testRoles);
    if (filter) {
      const UserId = filter.match(/User\/Id eq '(.+?)'/);
      if (UserId) {
        results = results.filter(
          (item: SPRole) => item.User.Id === Number(UserId[1])
        );
      } else {
        // If a filter was passed, but we didn't have a match for how to process it, return an error so mock can be adjusted
        return res(
          ctx.status(500),
          ctx.delay(responsedelay),
          ctx.body(`No Mock created for this filter string - ${filter}`)
        );
      }
    }
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
   * Add a user to a Role
   */
  rest.post(
    "/_api/web/lists/getByTitle\\('Roles')/items",
    async (req, res, ctx) => {
      let body = await req.json();
      let user = testUsers.find((element) => element.Id === body.UserId);

      if (user) {
        let role: SPRole = {
          Id: ++maxRoleId,
          User: { ...user },
          Title: body.Title,
        };

        testRoles.push(role);
        return res(ctx.status(200), ctx.delay(responsedelay), ctx.json(role));
      }
      return res(ctx.status(400), ctx.delay(responsedelay));
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
    sensitivityCode: 4,
    workLocation: "remote",
    office: "OZIC",
    isNewCivMil: "yes",
    prevOrg: "",
    isNewToBaseAndCenter: "yes",
    hasExistingCAC: "no",
    CACExpiration: "2022-12-31T00:00:00.000Z",
    eta: "2022-12-31T00:00:00.000Z",
    completionDate: "2023-01-31T00:00:00.000Z",
    supGovLead: { ...testUsers[0] },
    employee: { ...testUsers[1] },
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
    sensitivityCode: 3,
    workLocation: "local",
    office: "OZIC",
    isNewCivMil: "no",
    prevOrg: "AFLCMC/WA",
    isNewToBaseAndCenter: "no",
    hasExistingCAC: "no",
    CACExpiration: "2022-12-31T00:00:00.000Z",
    eta: "2022-12-31T00:00:00.000Z",
    completionDate: "2023-01-31T00:00:00.000Z",
    supGovLead: { ...testUsers[0] },
    employee: { ...testUsers[1] },
    isTraveler: "no",
    isSupervisor: "no",
  },
  {
    Id: 3,
    empName: testUsers[0].Title,
    empType: EMPTYPES.Civilian,
    gradeRank: "GS-12",
    MPCN: 1233217,
    SAR: 6,
    sensitivityCode: 3,
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
    supGovLead: { ...testUsers[1] },
    employee: { ...testUsers[0] },
  },
  {
    Id: 5,
    empName: "Cancelled, Imma B",
    empType: EMPTYPES.Civilian,
    gradeRank: "GS-13",
    MPCN: 7654321,
    SAR: 6,
    sensitivityCode: 2,
    workLocation: "local",
    office: "OZIC",
    isNewCivMil: "no",
    prevOrg: "AFLCMC/WA",
    isNewToBaseAndCenter: "no",
    hasExistingCAC: "no",
    CACExpiration: "2022-12-31T00:00:00.000Z",
    eta: "2022-12-31T00:00:00.000Z",
    completionDate: "2023-01-31T00:00:00.000Z",
    supGovLead: { ...testUsers[0] },
    employee: { ...testUsers[1] },
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
    sensitivityCode: 3,
    workLocation: "local",
    office: "OZIC",
    isNewCivMil: "no",
    prevOrg: "AFLCMC/WA",
    isNewToBaseAndCenter: "no",
    hasExistingCAC: "no",
    CACExpiration: "2022-12-31T00:00:00.000Z",
    eta: "2022-12-31T00:00:00.000Z",
    completionDate: "2023-01-31T00:00:00.000Z",
    supGovLead: { ...testUsers[1] },
    employee: { ...testUsers[1] },
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
    CompletedBy: { ...testUsers[1] },
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
const updateRequest = (item: IRequestItem) => {
  let index = requests.findIndex((element) => element.Id === Number(item.Id));
  let supervisor = testUsers.find(
    (element) => element.Id === Number(item.supGovLeadId)
  );
  let employee = testUsers.find(
    (element) => element.Id === Number(item.employeeId)
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
    requests[index].sensitivityCode = item.sensitivityCode
      ? item.sensitivityCode
      : requests[index].sensitivityCode;
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
    requests[index].isTraveler = item.isTraveler
      ? item.isTraveler
      : requests[index].isTraveler;
    requests[index].isSupervisor = item.isSupervisor
      ? item.isSupervisor
      : requests[index].isSupervisor;
  }

  if (supervisor) {
    requests[index].supGovLead = { ...supervisor };
  }

  if (employee) {
    requests[index].employee = { ...employee };
  }

  if (item.cancelReason) {
    requests[index].cancelReason = item.cancelReason;
  }
  if (item.closedOrCancelledDate) {
    requests[index].closedOrCancelledDate = item.closedOrCancelledDate;
  }
};

let getHash = function (toHash: string) {
  let hash = 0;

  if (toHash.length !== 0) {
    for (let i = 0; i < toHash.length; i++) {
      let chr = toHash.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32bit int
    }
  }
  return hash;
};

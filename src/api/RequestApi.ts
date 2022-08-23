import { spWebContext } from "../providers/SPWebContext";
import { ApiError } from "./InternalErrors";
import { IItemUpdateResult } from "@pnp/sp/items";
import { emptype, EMPTYPES } from "../constants/EmpTypes";
import { worklocation } from "../constants/WorkLocations";
import { SPPersona } from "../components/PeoplePicker/PeoplePicker";

// create PnP JS response interface for the InForm
// This extends the IInForm -- currently identical, but may need to vary when pulling in SPData
type IResponseItem = IInForm;

// create IItem item to work with it internally
export type IInForm = {
  /** Required - Will be -1 for NewForms that haven't been saved yet */
  Id: number;
  /** Required - Contains the Employee's Name */
  empName: string;
  /** Required - Employee's Type valid values are:
   * 'civ' - for Civilian Employees
   * 'mil' - for Military Employees
   * 'ctr' - for Contracted Employees
   */
  empType: emptype;
  /** Required - The Employee's Grade/Rank.  Not applicable if 'ctr' */
  gradeRank: string;
  /** Required - Possible values are 'local' and 'remote'  */
  workLocation: worklocation;
  /** Required - The Employee's Office */
  office: string;
  /** Required - Can only be 'true' if it is a New to USAF Civilain.  Must be 'false' if it is a 'mil' or 'ctr' */
  // TODO - Look into making this a Type or Leveraging SharePoint Type -- Think they possibly use yes/no instead of true/false
  isNewCivMil: "yes" | "no";
  /** Required - The user's previous organization.  Will be "" if isNewCiv is false */
  prevOrg: string;
  /** Required - Can only be 'true' if is a Civ/Mil.  For Ctr, will be 'false' */
  // TODO - Look into making this a Type or Leveraging SharePoint Type -- Think they possibly use yes/no instead of true/false
  isNewToBaseAndCenter: "yes" | "no";
  /** Required - Can only be 'true' if is a Ctr.  For others it will be false */
  // TODO - Look into making this a Type or Leveraging SharePoint Type -- Think they possibly use yes/no instead of true/false
  hasExistingCAC: "yes" | "no";
  /** Required - Will only be defined for Ctr, for others it will be undefined*/
  // TODO - Look into making this a Type or Leveraging SharePoint Type -- Think they possibly use yes/no instead of true/false
  CACExpiration: Date | undefined;
  /** Required - The user's Estimated Arrival Date */
  eta: Date;
  /** Required - The Expected Completion Date - Default to 28 days from eta*/
  completionDate: Date;
  /** Required - The Superviosr/Gov Lead of the employee */
  supGovLead: SPPersona;
};

export interface IInFormApi {
  /**
   * Gets the request based on ID.
   *
   * @param ID The ID of the item to retrieve from SharePoint
   * @returns The IITem for the given ID
   */
  getItemById(ID: number): Promise<IResponseItem | undefined>;

  /**
   * Update/persist the given Item
   *
   * @param requirementsRequest The RequirementsRequest to be saved/updated
   */
  updateItem(IItem: IInForm): Promise<IItemUpdateResult>;
}

export class RequestApi implements IInFormApi {
  itemList = spWebContext.web.lists.getByTitle("Items");

  async getItemById(ID: number): Promise<IResponseItem | undefined> {
    try {
      // use map to convert IResponseItem[] into our internal object IItem[]
      const response: IResponseItem = await this.itemList.items.getById(ID)();
      const items: IInForm = {
        Id: response.Id,
        empName: response.empName,
        empType: response.empType,
        gradeRank: response.gradeRank,
        workLocation: response.workLocation,
        office: response.office,
        isNewCivMil: response.isNewCivMil,
        prevOrg: response.prevOrg,
        isNewToBaseAndCenter: response.isNewToBaseAndCenter,
        hasExistingCAC: response.hasExistingCAC,
        CACExpiration: response.CACExpiration,
        eta: response.eta,
        completionDate: response.completionDate,
        supGovLead: response.supGovLead,
      };
      return items;
    } catch (e) {
      console.error(`Error occurred while trying to fetch Item with ID ${ID}`);
      console.error(e);
      if (e instanceof Error) {
        throw new ApiError(
          e,
          `Error occurred while trying to fetch Item with ID ${ID}: ${e.message}`
        );
      } else if (typeof e === "string") {
        throw new ApiError(
          new Error(
            `Error occurred while trying to fetch Item with ID ${ID}: ${e}`
          )
        );
      } else {
        throw new ApiError(
          undefined,
          `Unknown error occurred while trying to Item with ID ${ID}`
        );
      }
    }
  }

  async updateItem(Item: IInForm): Promise<IItemUpdateResult> {
    try {
      return await this.itemList.items.getById(Item.Id).update(Item);
    } catch (e) {
      console.error(
        `Error occurred while trying to fetch Item with ID ${Item.Id}`
      );
      console.error(e);
      if (e instanceof Error) {
        throw new ApiError(
          e,
          `Error occurred while trying to fetch Item with ID ${Item.Id}: ${e.message}`
        );
      } else if (typeof e === "string") {
        throw new ApiError(
          new Error(
            `Error occurred while trying to fetch Item with ID ${Item.Id}: ${e}`
          )
        );
      } else {
        throw new ApiError(
          undefined,
          `Unknown error occurred while trying to Item with ID ${Item.Id}`
        );
      }
    }
  }
}

export class RequestApiDev implements IInFormApi {
  sleep() {
    return new Promise((r) => setTimeout(r, 500));
  }

  items: IResponseItem[] = [
    {
      Id: 1,
      empName: "Doe, John D",
      empType: EMPTYPES.CIV,
      gradeRank: "GS-11",
      workLocation: "remote",
      office: "OZIC",
      isNewCivMil: "yes",
      prevOrg: "",
      isNewToBaseAndCenter: "yes",
      hasExistingCAC: "no",
      CACExpiration: new Date(),
      eta: new Date(),
      completionDate: new Date(),
      supGovLead: {
        text: "Default User",
        imageUrl:
          "https://static2.sharepointonline.com/files/fabric/office-ui-fabric-react-assets/persona-male.png",
      } as SPPersona,
    },
    {
      Id: 2,
      empName: "Doe, Jane D",
      empType: EMPTYPES.CIV,
      gradeRank: "GS-13",
      workLocation: "local",
      office: "OZIC",
      isNewCivMil: "no",
      prevOrg: "AFLCMC/WA",
      isNewToBaseAndCenter: "no",
      hasExistingCAC: "no",
      CACExpiration: undefined,
      eta: new Date(),
      completionDate: new Date(),
      supGovLead: {
        text: "Default User",
        imageUrl:
          "https://static2.sharepointonline.com/files/fabric/office-ui-fabric-react-assets/persona-male.png",
      } as SPPersona,
    },
  ];

  async getItemById(ID: number): Promise<IResponseItem | undefined> {
    await this.sleep();
    return this.items.find((r) => r.Id === ID);
  }

  async updateItem(Item: IInForm): Promise<IItemUpdateResult | any> {
    await this.sleep();
    return (this.items[this.items.findIndex((r) => r.Id === Item.Id)] = Item);
  }
}

export class RequestApiConfig {
  private static itemApi: IInFormApi;

  // optionally supply the api used to set up test data in the dev version
  static getApi(): IInFormApi {
    if (!this.itemApi) {
      this.itemApi =
        process.env.NODE_ENV === "development"
          ? new RequestApiDev()
          : new RequestApi();
    }
    return this.itemApi;
  }
}

import { ApiError } from "./InternalErrors";
import { IItemUpdateResult } from "@pnp/sp/items";
import { EMPTYPES } from "../constants/EmpTypes";
import { worklocation } from "../constants/WorkLocations";
import { SPPersona } from "../components/PeoplePicker/PeoplePicker";

import { spWebContext } from "../providers/SPWebContext";
import { useQuery } from "@tanstack/react-query";

declare var _spPageContextInfo: any;

const getMyRequests = async () => {
  const userId = _spPageContextInfo.userId;
  if (process.env.NODE_ENV === "development") {
    return Promise.resolve(testItems);
  } else if (userId === undefined) {
    return Promise.reject([] as IInRequest[]);
  } else {
    const response = await spWebContext.web.lists
      .getByTitle("Items")
      .items.filter(
        `supGovLead/Id eq '${userId}' or employee/Id eq '${userId}'`
      )();
    return response.map((request) => {
      // Convert date strings to Date objects
      const eta = new Date(request.eta);
      const CACExpiration = new Date(request.CACExpiration);
      const completionDate = new Date(request.completionDate);
      const newRequest = { ...request, eta, CACExpiration, completionDate };
      return newRequest as IInRequest;
    });
  }
};

export const useMyRequests = () => {
  return useQuery({
    queryKey: ["myRequests"],
    queryFn: () => getMyRequests(),
  });
};

// create PnP JS response interface for the InForm
// This extends the IInRequest -- currently identical, but may need to vary when pulling in SPData
type IResponseItem = IInRequest;

// create IItem item to work with it internally
export type IInRequest = {
  /** Required - Will be -1 for NewForms that haven't been saved yet */
  Id: number;
  /** Required - Contains the Employee's Name */
  empName: string;
  /** Required - Employee's Type valid values are:
   * 'Civilian' - for Civilian Employees
   * 'Contractor' - for Contracted Employees
   * 'Military' - for Military Employees
   */
  empType: EMPTYPES;
  /** Required - The Employee's Grade/Rank.  Not applicable if 'ctr' */
  gradeRank: string;
  /** Required - Possible values are 'local' and 'remote'  */
  workLocation: worklocation;
  /** Required - The Employee's Office */
  office: string;
  /** Required - Can only be 'true' if it is a New to USAF Civilain.  Must be 'false' if it is a 'mil' or 'ctr' */
  isNewCivMil: boolean;
  /** Required - The user's previous organization.  Will be "" if isNewCiv is false */
  prevOrg: string;
  /** Required - Can only be 'true' if is a Civ/Mil.  For Ctr, will be 'false' */
  isNewToBaseAndCenter: boolean;
  /** Required - Can only be 'true' if is a Ctr.  For others it will be false */
  hasExistingCAC: boolean;
  /** Required - Will only be defined for Ctr, for others it will be undefined*/
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
  updateItem(IItem: IInRequest): Promise<IItemUpdateResult>;
}

export class RequestApi implements IInFormApi {
  itemList = spWebContext.web.lists.getByTitle("Items");

  async getItemById(ID: number): Promise<IResponseItem | undefined> {
    try {
      // use map to convert IResponseItem[] into our internal object IItem[]
      const response: IResponseItem = await this.itemList.items.getById(ID)();
      const items: IInRequest = {
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

  async updateItem(Item: IInRequest): Promise<IItemUpdateResult> {
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

const testItems: IResponseItem[] = [
  {
    Id: 1,
    empName: "Doe, John D",
    empType: EMPTYPES.Civilian,
    gradeRank: "GS-11",
    workLocation: "remote",
    office: "OZIC",
    isNewCivMil: true,
    prevOrg: "",
    isNewToBaseAndCenter: true,
    hasExistingCAC: false,
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
    empType: EMPTYPES.Civilian,
    gradeRank: "GS-13",
    workLocation: "local",
    office: "OZIC",
    isNewCivMil: false,
    prevOrg: "AFLCMC/WA",
    isNewToBaseAndCenter: false,
    hasExistingCAC: false,
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

export class RequestApiDev implements IInFormApi {
  sleep() {
    return new Promise((r) => setTimeout(r, 500));
  }

  async getItemById(ID: number): Promise<IResponseItem | undefined> {
    await this.sleep();
    return testItems.find((r) => r.Id === ID);
  }

  async updateItem(Item: IInRequest): Promise<IItemUpdateResult | any> {
    await this.sleep();
    return (testItems[testItems.findIndex((r) => r.Id === Item.Id)] = Item);
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

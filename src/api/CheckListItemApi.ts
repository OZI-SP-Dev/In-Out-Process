import { useEffect, useState } from "react";
import { spWebContext } from "../providers/SPWebContext";
import { ApiError } from "./InternalErrors";
import { DateTime } from "luxon";

export interface ICheckListItem {
  Id: number;
  Title: string;
  Lead: string; // TBD: better as role and/or person?
  CompletedDate?: DateTime;
  SortOrder?: number;
}

export interface ICheckListItemApi {
  /**
   * Gets the items based on the checklist Id.
   *
   * @param Id The Id of the item to retrieve from SharePoint
   * @returns The ICheckListItem for the given Id
   */
  getItemsById(Id: number): Promise<ICheckListItem[] | undefined>;
}

export class CheckListItemApi implements ICheckListItemApi {
  itemList = spWebContext.web.lists.getByTitle("CheckListItems");

  async getItemsById(Id: number): Promise<ICheckListItem[] | undefined> {
    try {
      const response: ICheckListItem[] = await this.itemList.items.filter(
        "RequestId eq " + Id
      )();
      return response;
    } catch (e) {
      console.error(`Error occurred while trying to fetch Item with Id ${Id}`);
      console.error(e);
      if (e instanceof Error) {
        throw new ApiError(
          e,
          `Error occurred while trying to fetch Item with Id ${Id}: ${e.message}`
        );
      } else if (typeof e === "string") {
        throw new ApiError(
          new Error(
            `Error occurred while trying to fetch Item with Id ${Id}: ${e}`
          )
        );
      } else {
        throw new ApiError(
          undefined,
          `Unknown error occurred while trying to Item with Id ${Id}`
        );
      }
    }
  }
}

export class CheckListItemApiDev implements ICheckListItemApi {
  sleep() {
    return new Promise((r) => setTimeout(r, 2000));
  }

  items: ICheckListItem[] = [
    {
      Id: 1,
      Title: "First Item!",
      Lead: "Anakin Skywalker",
    },
    {
      Id: 2,
      Title: "Second Item!",
      Lead: "Obi-Wan Kenobi",
    },
  ];

  async getItemsById(Id: number): Promise<ICheckListItem[] | undefined> {
    await this.sleep();
    return this.items;
  }
}

export class CheckListItemApiConfig {
  private static checklistApi: ICheckListItemApi;

  static getApi(): ICheckListItemApi {
    if (!this.checklistApi) {
      this.checklistApi =
        process.env.NODE_ENV === "development"
          ? new CheckListItemApiDev()
          : new CheckListItemApi();
    }
    return this.checklistApi;
  }
}

/**
 * Gets the checklist items based on the checklist Id.
 *
 * @param Id The Id of the parent request to retrieve from SharePoint
 */
export const useChecklistItems = (Id: number) => {
  // Initialize as null (have not fetched yet)
  // Then update to empty set or data once data retrieved
  const [checklisItems, setChecklistItems] = useState<ICheckListItem[] | null>(
    null
  );

  useEffect(() => {
    const fetchChecklistItems = async () => {
      const checklistItemApi = CheckListItemApiConfig.getApi();
      const items = await checklistItemApi.getItemsById(Id);
      setChecklistItems(items || []);
    };

    fetchChecklistItems();
  }, [Id]);

  return checklisItems;
};

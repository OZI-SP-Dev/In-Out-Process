import { spWebContext } from "../providers/SPWebContext";
import { ApiError } from "./InternalErrors";
import { IItemUpdateResult } from "@pnp/sp/items";

  // create PnP JS response interface for Item
  export interface IResponseItem {
    Id: number;
    Title: string;
  }

// create IItem item to work with it internally
export interface IItem {
    Id: number,
    Title: string
}


export interface IItemApi {
    /**
     * Gets the item based on ID.
     * 
     * @param ID The ID of the item to retrieve from SharePoint
     * @returns The IITem for the given ID
     */
    getItemById(ID: number): Promise<IResponseItem | undefined>,

     /**
     * Update/persist the given Item
     * 
     * @param requirementsRequest The RequirementsRequest to be saved/updated
     */
    updateItem(IItem: IItem): Promise<IItemUpdateResult>,
}

export class ItemApi implements IItemApi {

    itemList = spWebContext.web.lists.getByTitle("Items");

    async getItemById(ID: number): Promise<IResponseItem | undefined> {
        try {
            // use map to convert IResponseItem[] into our internal object IItem[]
            const response: IResponseItem = await this.itemList.items.getById(ID)();
            const items: IItem = {
                Id: response.Id,
                Title: response.Title
                };
            return items;
        } catch (e) {
            console.error(`Error occurred while trying to fetch Item with ID ${ID}`);
            console.error(e);
            if (e instanceof Error) {
                throw new ApiError(e, `Error occurred while trying to fetch Item with ID ${ID}: ${e.message}`);
            } else if (typeof (e) === "string") {
                throw new ApiError(new Error(`Error occurred while trying to fetch Item with ID ${ID}: ${e}`));
            } else {
                throw new ApiError(undefined, `Unknown error occurred while trying to Item with ID ${ID}`);
            }
        }
    }

    async updateItem(Item: IItem): Promise<IItemUpdateResult> {
        try {
            return await this.itemList.items.getById(Item.Id).update(Item);
        } catch (e) {
            console.error(`Error occurred while trying to fetch Item with ID ${Item.Id}`);
            console.error(e);
            if (e instanceof Error) {
                throw new ApiError(e, `Error occurred while trying to fetch Item with ID ${Item.Id}: ${e.message}`);
            } else if (typeof (e) === "string") {
                throw new ApiError(new Error(`Error occurred while trying to fetch Item with ID ${Item.Id}: ${e}`));
            } else {
                throw new ApiError(undefined, `Unknown error occurred while trying to Item with ID ${Item.Id}`);
            }
        }
    }

}

export class ItemApiDev implements IItemApi {

    sleep() {
        return new Promise(r => setTimeout(r, 500));
    }

    items:IResponseItem[] = [
        { Id:1, "Title": "I am Item 1 from Test Data"},
        { Id:2, "Title": "I am Item 2 from Test Data"}
    ]

    async getItemById(ID: number): Promise<IResponseItem | undefined> {
        await this.sleep();
        return this.items.find(r => r.Id === ID);
    }

    async updateItem(Item: IItem): Promise<IItemUpdateResult | any> {
        await this.sleep();
        return this.items[this.items.findIndex(r => r.Id === Item.Id)] = Item;
    }

}

export class ItemApiConfig {
    private static itemApi: IItemApi

    // optionally supply the api used to set up test data in the dev version
    static getApi(): IItemApi {
        if (!this.itemApi) {
            this.itemApi = process.env.NODE_ENV === 'development' ? new ItemApiDev() : new ItemApi();
        }
        return this.itemApi;
    }
}

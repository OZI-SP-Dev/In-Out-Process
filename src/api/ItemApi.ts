import { spWebContext } from "../providers/SPWebContext";
import { ApiError } from "./InternalErrors";

export interface IItem {
    ID: number,
    Title: string
}


export interface IItemApi {
    /**
     * Gets the item based on ID.
     * 
     * @param ID The ID of the item to retrieve from SharePoint
     * @returns The IITem for the given ID
     */
    getItemById(ID: number): Promise<IItem | undefined>,

}

export class ItemApi implements IItemApi {

    rolesList = spWebContext.web.lists.getByTitle("Items");

    async getItemById(ID: number): Promise<IItem | undefined> {
        try {
            return await this.rolesList.items.getById(ID)();
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

}

export class ItemApiDev implements IItemApi {

    sleep() {
        return new Promise(r => setTimeout(r, 500));
    }

    items = [
        { "odata.type": "SP.Data.ItemsListItem", "odata.id": "f85358ff-ff57-43d9-b45f-29497afa61a9", "odata.etag": "\"1\"", "odata.editLink": "Web/Lists(guid'f31adb2a-f0f8-407e-a49c-58b2a95948ec')/Items(1)", "FileSystemObjectType": 0, "Id": 1, "ServerRedirectedEmbedUri": null, "ServerRedirectedEmbedUrl": "", "ID": 1, "ContentTypeId": "0x01005F6EBBB8C1815D4BB76AD7E764349CB800BCB84074E20FF642B5A2F39E9C2046BE", "Title": "I am Item 1 from Test Data", "Modified": "2022-07-08T18:46:58Z", "Created": "2022-07-08T18:46:58Z", "AuthorId": 117, "EditorId": 117, "OData__UIVersionString": "1.0", "Attachments": false, "GUID": "89a506f5-455a-4c01-a10f-ad7a009308cb", "ComplianceAssetId": null },
        { "odata.type": "SP.Data.ItemsListItem", "odata.id": "f85358ff-ff57-43d9-b45f-29497afa61a9", "odata.etag": "\"1\"", "odata.editLink": "Web/Lists(guid'f31adb2a-f0f8-407e-a49c-58b2a95948ec')/Items(2)", "FileSystemObjectType": 0, "Id": 2, "ServerRedirectedEmbedUri": null, "ServerRedirectedEmbedUrl": "", "ID": 2, "ContentTypeId": "0x01005F6EBBB8C1815D4BB76AD7E764349CB800BCB84074E20FF642B5A2F39E9C2046BE", "Title": "I am Item 2 from Test Data", "Modified": "2022-07-08T18:46:58Z", "Created": "2022-07-08T18:46:58Z", "AuthorId": 117, "EditorId": 117, "OData__UIVersionString": "1.0", "Attachments": false, "GUID": "89a506f5-455a-4c01-a10f-ad7a009308cb", "ComplianceAssetId": null }
    ]

    async getItemById(ID: number): Promise<IItem | undefined> {
        await this.sleep();
        return this.items.find(r => r.Id === ID);
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
import { spfi, SPBrowser } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists/web";
import "@pnp/sp/items/list";

// Possible future imports
//import "@pnp/sp/batching";
//import "@pnp/sp/site-users/web";
//import "@pnp/sp/profiles";

declare var _spPageContextInfo: any;

export const webUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : _spPageContextInfo.webAbsoluteUrl;
export const spWebContext = spfi().using(SPBrowser({ baseUrl: webUrl }));

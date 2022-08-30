import { spfi, SPFI, SPBrowser } from "@pnp/sp";
//import { LogLevel, PnPLogging } from "@pnp/logging";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/batching";
import "@pnp/sp/site-users/web";
import "@pnp/sp/profiles";

//var _sp: SPFI;
declare var _spPageContextInfo: any;

export const webUrl =
  process.env.NODE_ENV === "development"
    ? "http ://localhost:3000"
    : _spPageContextInfo.webAbsoluteUrl;
export const spWebContext: SPFI = spfi(webUrl).using(SPBrowser());

/* export const spWebContext = (): SPFI => {
  if (_sp === undefined) {
    //You must add the @pnp/logging package to include the PnPLogging behavior it is no longer a peer dependency
    // The LogLevel set's at what level a message will be written to the console
    _sp = spfi(webUrl).using(SPBrowser());//.using(SPFx(context)).using(PnPLogging(LogLevel.Warning));
  }
  return _sp;
};
*/

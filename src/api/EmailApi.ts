import { spWebContext, webUrl } from "providers/SPWebContext";
import { IPerson } from "api/UserApi";
import { EmailError } from "api/InternalErrors";

export interface IEmailApi {
  readonly siteUrl: string;
  sendEmail: (
    to: IPerson[],
    subject: string,
    body: string,
    cc?: IPerson[]
  ) => Promise<void>;
}

export class EmailApi implements IEmailApi {
  siteUrl: string = webUrl;
  /** Turn an array of People objects into Email address list
   *
   * @param people The IPerson array of people entries
   * @returns A string of semicolon delimited email addresses
   */
  private getEmailAddresses(people: IPerson[]): string {
    let emailArray = people.map((p) => p.EMail);
    return emailArray.join(";");
  }

  async sendEmail(
    to: IPerson[],
    subject: string,
    body: string,
    cc?: IPerson[]
  ): Promise<void> {
    try {
      let email = {
        To: this.getEmailAddresses(to),
        CC: cc ? this.getEmailAddresses(cc) : undefined,
        Subject:
          (process.env.REACT_APP_TEST_SYS === "true" ? "TEST - " : "") +
          "In/Out Process - " +
          subject,
        Body: body.replace(/\n/g, "<BR>"),
      };

      //Add an entry to SharePoint list "Emails"
      const emailList = spWebContext.web.lists.getByTitle("Emails");
      await emailList.items.add({
        ...email,
      });
    } catch (e) {
      if (e instanceof Error) {
        throw new EmailError(e);
      } else throw new EmailError();
    }
  }
}

export class EmailApiDev implements IEmailApi {
  siteUrl: string = "localhost";

  sleep() {
    return new Promise((r) => setTimeout(r, 500));
  }

  async sendEmail(): Promise<void> {
    await this.sleep();
    //Empty as there isn't really anything to do for it in dev.
  }
}

export class EmailApiConfig {
  private static emailApi: IEmailApi;

  static getApi(): IEmailApi {
    if (!this.emailApi) {
      this.emailApi =
        process.env.NODE_ENV === "development"
          ? new EmailApiDev()
          : new EmailApi();
    }
    return this.emailApi;
  }
}

import { useState } from "react";
import { EmailApiConfig } from "api/EmailApi";
import { EmailError } from "api/InternalErrors";
import { IInRequest } from "api/RequestApi";
import { IPerson } from "api/UserApi";
import { useError } from "hooks/useError";

export interface IEmailSender {
  sending: boolean;
  sendEmail: (
    to: IPerson[],
    subject: string,
    body: string,
    cc?: IPerson[]
  ) => Promise<void>;
  sendInRequestSubmitEmail: (process: IInRequest) => Promise<void>;
}

export function useEmail(): IEmailSender {
  const [sending, setSending] = useState<boolean>(false);

  const emailApi = EmailApiConfig.getApi();
  const error = useError();

  const sendEmail = async (
    to: IPerson[],
    subject: string,
    body: string,
    cc?: IPerson[]
  ): Promise<void> => {
    try {
      setSending(true);
      if (to.length) {
        await emailApi.sendEmail(to, subject, body, cc);
      }
    } catch (e) {
      if (e instanceof EmailError) {
        error.addError(e.message);
      } else {
        throw e;
      }
    } finally {
      setSending(false);
    }
  };

  const sendInRequestSubmitEmail = async (
    request: IInRequest
  ): Promise<void> => {
    // TODO - Populate with whom it should actually go to rather than selected Supervisor
    let to = [request.supGovLead] as IPerson[]; // TODO -- Don't use AS here -- Work issue #12 to standardize person object
    let subject = `In Process: ${request.empName} has been submitted`;
    let body = `A request for in-processing ${request.empName} has been submitted.

    Link to request: ${emailApi.siteUrl}/app/index.aspx`; // TODO -- Provide a route to the item stored in SharePoint
    return await sendEmail(to, subject, body);
  };

  return {
    sending,
    sendEmail,
    sendInRequestSubmitEmail,
  };
}

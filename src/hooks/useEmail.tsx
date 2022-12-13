import { useState } from "react";
import { EmailApi } from "api/EmailApi";
import { EmailError } from "api/InternalErrors";
import {
  getRequest,
  IInRequest,
  transformInRequestFromSP,
} from "api/RequestApi";
import { IPerson } from "api/UserApi";
import { useError } from "hooks/useError";
import { RoleType, useAllUserRolesByRole } from "api/RolesApi";
import { ICheckListItem } from "api/CheckListItemApi";
import { useQueryClient } from "@tanstack/react-query";

export interface IEmailSender {
  sending: boolean;
  sendEmail: (
    to: IPerson[],
    subject: string,
    body: string,
    cc?: IPerson[]
  ) => Promise<void>;
  sendInRequestSubmitEmail: (process: IInRequest) => Promise<void>;
  sendActivationEmails: (
    activatedChecklistItems: Map<RoleType, ICheckListItem[]>,
    allChecklistItems: ICheckListItem[],
    completedChecklistItemId: number
  ) => Promise<void[]>;
}

export function useEmail(): IEmailSender {
  const [sending, setSending] = useState<boolean>(false);
  const { data: allRolesByRole } = useAllUserRolesByRole();
  const queryClient = useQueryClient();

  const emailApi = new EmailApi();
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

  const sendActivationEmails = async (
    activatedChecklistItems: Map<RoleType, ICheckListItem[]>,
    allChecklistItems: ICheckListItem[],
    completedChecklistItemId: number
  ): Promise<void[]> => {
    const reqId = activatedChecklistItems.values().next().value[0].RequestId;
    const requestTemp = await queryClient.fetchQuery(["request", reqId], () =>
      getRequest(reqId)
    );
    const request = transformInRequestFromSP(requestTemp);
    let allEmailPromises: Promise<void>[] = [];

    for (let [lead, items] of activatedChecklistItems) {
      let leadUsers: IPerson[] = [];
      let outstandingMessage: String = "";
      const oustandingItems: ICheckListItem[] = allChecklistItems.filter(
        (item) =>
          item.Id !== completedChecklistItemId && // Don't include the item just completed
          item.Lead === lead && // Items for this Lead/POC
          item.Active && // which are Active
          !item.CompletedDate // and not yet completed
      );

      if (oustandingItems.length > 0) {
        // If we have outstanding items, then populate to include in message
        outstandingMessage = `
As a reminder the following item(s) are still awaiting your action:
  ${oustandingItems.map((item) => item.Title).join("<br/>")}`;
      }

      switch (lead) {
        case RoleType.EMPLOYEE:
          // If we don't have an Employee GAL entry -- and the Lead is the Employee -- send to Supervisor
          leadUsers = request.employee
            ? [request.employee]
            : [request.supGovLead];
          break;
        case RoleType.SUPERVISOR:
          leadUsers = [request.supGovLead];
          break;
        default:
          const roleMembers = allRolesByRole?.get(lead);
          if (roleMembers) {
            leadUsers = roleMembers.map((role) => role.User);
          }
      }

      let to = leadUsers;
      let cc = [request.supGovLead];
      let subject = `In Process: New checklist item(s) available for ${request.empName}`;
      let body = `The following checklist item(s) are now available to be completed:
  ${items.map((item) => item.Title).join("<br/>")}
${outstandingMessage}

To view this request and take action follow the below link:
  ${emailApi.siteUrl}/app/index.aspx#/item/${request.Id}`;
      allEmailPromises.push(sendEmail(to, subject, body, cc));
    }
    return Promise.all(allEmailPromises);
  };

  return {
    sending,
    sendEmail,
    sendInRequestSubmitEmail,
    sendActivationEmails,
  };
}

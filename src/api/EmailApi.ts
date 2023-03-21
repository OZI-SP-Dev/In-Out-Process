import { spWebContext, webUrl } from "providers/SPWebContext";
import { IPerson } from "api/UserApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useError } from "hooks/useError";
import {
  getRequest,
  IInRequest,
  transformInRequestFromSP,
} from "api/RequestApi";
import { RoleType, useAllUserRolesByRole } from "./RolesApi";
import { ICheckListItem } from "./CheckListItemApi";

/**  Definition for what is required/optional for sending an email */
interface IEmail {
  /** Required - Whom to send message to */ to: IPerson[];
  /** Required - Subject line of the Email */ subject: string;
  /** Required - Contents for the body of the Email */ body: string;
  /** Optional - Whom to CC on the Email */ cc?: IPerson[];
}

/**  Definition for what data is needed to identify what tasks just became Active */
interface IActivationObj {
  /** The Map of items that just came Active by Role */ activatedChecklistItems: Map<
    RoleType,
    ICheckListItem[]
  >;
  /** All CheckListItems for this request */ allChecklistItems: ICheckListItem[];
}

/**
 * Turn an array of People objects into Email address list (removing duplicates)
 *
 * @param people The IPerson array of people entries
 * @returns A string of semicolon delimited email addresses
 */
const getEmailAddresses = (people: IPerson[]) => {
  let emailArray = people.map((p) => p.EMail);
  const emailArrayNoDupes = emailArray.filter(
    (n, i) => emailArray.indexOf(n) === i
  );

  return emailArrayNoDupes.join(";");
};

/**
 * Translate the internal object to the fields for SharePoint
 *
 * @param email The object containing the email structure to be translated
 * @returns The object fields translated to SharePoint fields
 */
const transformInRequestToSP = (email: IEmail) => {
  return {
    To: getEmailAddresses(email.to),
    CC: email.cc ? getEmailAddresses(email.cc) : undefined,
    // Truncate the subject if it is going to exceed 255 characters so it doesn't error writing to field
    Subject: (
      (process.env.REACT_APP_TEST_SYS === "true" ? "TEST - " : "") +
      "In/Out Process - " +
      email.subject
    ).substring(0, 255),
    //Adjust line breaks so they show nicely even when Outlook converts to plaintext
    Body: email.body.replace(/\n/g, "\r\n<BR />"),
  };
};

/** Hook to send the Notification Activation emails */
export const useSendActivationEmails = (completedChecklistItemId: number) => {
  const { data: allRolesByRole } = useAllUserRolesByRole();
  const queryClient = useQueryClient();
  const errorAPI = useError();

  /**
   *  Send the Activation Notifications to the POCs
   *
   * @param activatedChecklistItems The ChecklistItems that have just become active, grouped by lead
   * @param allChecklistItems All the CheckListItems for this request
   *
   * @returns A Promise from SharePoint PnP batch for all the emails being sent
   */
  const sendActivationEmails = async ({
    activatedChecklistItems,
    allChecklistItems,
  }: IActivationObj) => {
    const [batchedSP, execute] = spWebContext.batched();
    const batch = batchedSP.web.lists.getByTitle("Emails");

    // Get the Id of the request from the first entry in the array of CheckListItems
    const reqId = allChecklistItems[0].RequestId;

    // Get the request details for use in the email
    const request = transformInRequestFromSP(
      await queryClient.fetchQuery(["request", reqId], () => getRequest(reqId))
    );

    // Loop through the Map of checklist items that just became active, which are grouped by lead
    for (let [lead, items] of activatedChecklistItems) {
      let leadUsers: IPerson[] = [];
      let outstandingMessage: string = "";
      const oustandingItems: ICheckListItem[] = allChecklistItems.filter(
        (item) =>
          item.Id !== completedChecklistItemId && // Don't include the item just completed
          item.Lead === lead && // Items for this Lead/POC
          item.Active && // which are Active
          !item.CompletedDate // and not yet completed
      );

      if (oustandingItems.length > 0) {
        // If we have outstanding items, then populate to include in message
        outstandingMessage = `<br/>As a reminder the following item(s) are still awaiting your action:<ul>${oustandingItems
          .map((item) => `<li>${item.Title}</li>`)
          .join("")}</ul>`;
      }

      // Populate leadUsers based on the users in that Role
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

      const linkURL = `${webUrl}/app/index.aspx#/item/${request.Id}`;

      const newEmail: IEmail = {
        to: leadUsers,
        cc: [request.supGovLead],
        subject: `In Process: New checklist item(s) available for ${request.empName}`,
        body: `The following checklist item(s) are now available to be completed:<ul>${items
          .map((item) => `<li>${item.Title}</li>`)
          .join(
            ""
          )}</ul>${outstandingMessage}<br/>To view this request and take action follow the below link:<br/><a href="${linkURL}">${linkURL}</a>`,
      };

      batch.items.add(transformInRequestToSP(newEmail));
    }
    return execute();
  };

  return useMutation(["requests"], sendActivationEmails, {
    onError: (error) => {
      const errPrefix =
        "Error occurred while trying to send Email Notification.  Please ensure those whom need to be informed of the request are. ";
      if (error instanceof Error) {
        errorAPI.addError(errPrefix + error.message);
      } else {
        errorAPI.addError(errPrefix + "Unkown error");
      }
    },
  });
};

export const useSendInRequestSubmitEmail = () => {
  const errorAPI = useError();

  /**
   *  Send the New In Processing Request to the POCs
   *
   * @param request The new In Processing Request
   * @returns A Promise from SharePoint for the email being sent
   */
  const sendInRequestSubmitEmail = (request: IInRequest) => {
    // TODO - Populate with whom it should actually go to rather than selected Supervisor (Card exists)
    const newEmail: IEmail = {
      to: [request.supGovLead],
      subject: `In Process: ${request.empName} has been submitted`,
      body: `A request for in-processing ${request.empName} has been submitted.

    Link to request: ${webUrl}/app/index.aspx`, // TODO -- Provide a route to the item stored in SharePoint (Card exists)
    };

    return spWebContext.web.lists
      .getByTitle("Emails")
      .items.add(transformInRequestToSP(newEmail));
  };

  return useMutation(["requests"], sendInRequestSubmitEmail, {
    onError: (error) => {
      const errPrefix =
        "Error occurred while trying to send Email Notification.  Please ensure those whom need to be informed of the request are. ";
      if (error instanceof Error) {
        errorAPI.addError(errPrefix + error.message);
      } else {
        errorAPI.addError(errPrefix + "Unkown error");
      }
    },
  });
};

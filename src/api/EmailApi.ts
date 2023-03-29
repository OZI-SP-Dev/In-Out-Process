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
import { IItemAddResult } from "@pnp/sp/items";

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

/**  Definition for what data is needed to send the email notification that new In Processing was added */
interface ISendInRequestSubmitEmail {
  /** The new request */
  request: IInRequest;
  /** The tasks that were added to the request, so we know which Leads to contact */
  tasks: IItemAddResult[];
}

/**  Definition for what data is needed to send the email notification that the In Processing was cancelled */
interface ISendInRequestCancelEmail {
  /** The request */
  request: IInRequest;
  /** The tasks, so we know which Leads to contact */
  tasks: ICheckListItem[];
  /** The reason the request was cancelled */
  reason: string;
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
  let toAddresses: string;

  // If the email is not being sent TO anyone, then there is a potential issue.  Send to the BAC Support box
  if (email.to.length === 0) {
    toAddresses = "AFLCMC.XP-OZ.BACSupport@us.af.mil;";
  } else {
    toAddresses = getEmailAddresses(email.to);
  }

  return {
    To: toAddresses,
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

  // Get the roles defined -- and who is in them
  const { data: allRolesByRole } = useAllUserRolesByRole();

  /**
   *  Send the New In Processing Request to the POCs
   *
   * @param {Object} requestInfo - Object containing the new request object and tasks object
   * @param {string} requestInfo.request - The new In Processing Request
   * @param {string} requestInfo.tasks - The tasks created for the new request
   * @returns A Promise from SharePoint for the email being sent
   */
  const sendInRequestSubmitEmail = ({
    request,
    tasks,
  }: ISendInRequestSubmitEmail) => {
    // Create a list of leads who have checklist items for this request
    const leadsWithDupes = tasks.map((task) => task.data.Lead);

    // Remove any duplicates from the array so we can loop through and process each lead only once
    const leads = leadsWithDupes.filter(
      (n, i) => leadsWithDupes.indexOf(n) === i
    );

    let leadUsers: IPerson[] = [];

    leads.forEach((lead) => {
      const roleMembers = allRolesByRole?.get(lead);
      if (roleMembers) {
        roleMembers.forEach((role) => leadUsers.push(role.User));
      }
    });

    const toField = leadUsers;
    const ccField = [request.supGovLead];

    const linkURL = `<a href="${webUrl}/app/index.aspx#/item/${request.Id}">${webUrl}/app/index.aspx#/item/${request.Id}</a>`;

    const newEmail: IEmail = {
      to: toField,
      cc: ccField,
      subject: `Initial Notification for In-bound Employee: ${
        request.empName
      } expected arrival ${request.eta.toLocaleDateString()}`,
      body: `In-bound employee: ${request.empName}
Expected arrival date: ${request.eta.toLocaleDateString()}
Owning organization and supervisor: ${request.office}, ${
        request.supGovLead.Title
      }

To view this request and take action follow the below link:
${linkURL}`,
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

export const useSendInRequestCancelEmail = () => {
  const errorAPI = useError();

  // Get the roles defined -- and who is in them
  const { data: allRolesByRole } = useAllUserRolesByRole();

  /**
   *  Send the In Processing Request Cancellation to the POCs
   *
   * @param {Object} cancelInfo - Object containing the new request object and tasks object
   * @param {IInRequest} cancelInfo.request - The In Processing Request
   * @param {ICheckListItem[]} cancelInfo.tasks - The tasks associated with the request
   * @param {string} cancelInfo.reason - The reason for the cancellation
   * @returns A Promise from SharePoint for the email being sent
   */
  const sendInRequestCancelEmail = ({
    request,
    tasks,
    reason,
  }: ISendInRequestCancelEmail) => {
    // Create a list of leads who have checklist items for this request
    const leadsWithDupes = tasks.map((task) => task.Lead);

    // Remove any duplicates from the array so we can loop through and process each lead only once
    const leads = leadsWithDupes.filter(
      (n, i) => leadsWithDupes.indexOf(n) === i
    );

    let leadUsers: IPerson[] = [];

    leads.forEach((lead) => {
      const roleMembers = allRolesByRole?.get(lead);
      if (roleMembers) {
        roleMembers.forEach((role) => leadUsers.push(role.User));
      }
    });

    const toField = leadUsers;
    const ccField = [request.supGovLead];

    const newEmail: IEmail = {
      to: toField,
      cc: ccField,
      subject: `In-processing for ${request.empName} has been cancelled`,
      body: `This email notification is to announce the cancellation of the in-processing request for ${request.empName} assigned to ${request.office}.
The request has been cancelled for the following reason:
${reason}`,
    };

    return spWebContext.web.lists
      .getByTitle("Emails")
      .items.add(transformInRequestToSP(newEmail));
  };

  return useMutation(["requests"], sendInRequestCancelEmail, {
    onError: (error) => {
      const errPrefix =
        "Error occurred while trying to send Email Notification.  Please ensure those whom need to be informed the request was cancelled are.";
      if (error instanceof Error) {
        errorAPI.addError(errPrefix + error.message);
      } else {
        errorAPI.addError(errPrefix + "Unkown error");
      }
    },
  });
};

export const useSendInRequestCompleteEmail = () => {
  const errorAPI = useError();

  /**
   *  Send the In Processing Request Complete Notification to the Employee
   *
   * @param {IInRequest} request - The In Processing Request
   * @returns A Promise from SharePoint for the email being sent
   */
  const sendInRequestCompleteEmail = (request: IInRequest) => {
    const toField: IPerson[] = request.employee ? [request.employee] : [];
    const newEmail: IEmail = {
      to: toField,
      subject: `In-processing for ${request.empName} is now closed`,
      body: `This email notification is to inform you that all in-processing tasks have been completed and the request closed.`,
    };

    return spWebContext.web.lists
      .getByTitle("Emails")
      .items.add(transformInRequestToSP(newEmail));
  };

  return useMutation(["requests"], sendInRequestCompleteEmail, {
    onError: (error) => {
      const errPrefix =
        "Error occurred while trying to send Email Notification.  Please ensure the Employee knows the In Processing Request is now complete.";
      if (error instanceof Error) {
        errorAPI.addError(errPrefix + error.message);
      } else {
        errorAPI.addError(errPrefix + "Unkown error");
      }
    },
  });
};

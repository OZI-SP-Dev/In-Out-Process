import {
  getCheckListItemsByRequestId,
  ICheckListItem,
  transformCheckListItemsFromSP,
} from "api/CheckListItemApi";
import { spWebContext } from "providers/SPWebContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { Person, useCurrentUser } from "api/UserApi";
import { templates } from "api/CreateChecklistItems";
import { useEmail } from "hooks/useEmail";
import { RoleType } from "api/RolesApi";

const completeCheckListItem = (
  item: ICheckListItem,
  checklistItems: ICheckListItem[],
  currentUser: Person,
  sendActivationEmails: (
    activatedTasksByRole: Map<RoleType, ICheckListItem[]>,
    allChecklistItems: ICheckListItem[],
    completedChecklistItemId: number
  ) => Promise<void[]>
) => {
  const [batchedSP, execute] = spWebContext.batched();
  const batch = batchedSP.web.lists.getByTitle("CheckListItems");
  let activatedTasksByRole: Map<RoleType, ICheckListItem[]> = new Map();

  const addChecklistItemActivated = (item: ICheckListItem) => {
    const leadItems = activatedTasksByRole.get(item.Lead);
    if (leadItems) {
      leadItems.push(item);
    } else {
      activatedTasksByRole.set(item.Lead, [item]);
    }
    batch.items.getById(item.Id).update({ Active: true });
  };

  // Always add the current update to the batch
  batch.items.getById(item.Id).update({
    CompletedById: currentUser.Id,
    CompletedDate: DateTime.now().toISODate(),
  });

  // Find additional updates
  switch (item.TemplateId) {
    case templates.ObtainCACGov:
    case templates.ObtainCACCtr:
      //Activate several tasks if we are completing one of the 2 different CAC tasks
      checklistItems?.forEach((element) => {
        if (
          element.TemplateId === templates.VerifyMyLearn ||
          element.TemplateId === templates.VerifyMyETMS ||
          element.TemplateId === templates.PhoneSetup ||
          element.TemplateId === templates.OrientationVideos ||
          element.TemplateId === templates.Bookmarks ||
          element.TemplateId === templates.NewcomerBrief ||
          element.TemplateId === templates.SignedPerformContribPlan ||
          element.TemplateId === templates.SignedTeleworkAgreement ||
          element.TemplateId === templates.SupervisorCoord2875
        ) {
          addChecklistItemActivated(element);
        }
      });
      break;
    case templates.VerifyMyETMS:
      // Activate the Confirm AFMC myETMS account task
      checklistItems?.forEach((element) => {
        if (element.TemplateId === templates.ConfirmMyETMS) {
          addChecklistItemActivated(element);
        }
      });

      // Determine if this checklist item has a Verify Air Force myLearning account task
      //   if it does, then only activate Mandatory Training task if it is completed
      let myLearnTask = checklistItems?.find(
        (item) => item.TemplateId === templates.VerifyMyLearn
      );
      if (myLearnTask?.CompletedBy) {
        checklistItems?.forEach((element) => {
          if (element.TemplateId === templates.MandatoryTraining) {
            addChecklistItemActivated(element);
          }
        });
      }
      break;
    case templates.VerifyMyLearn:
      checklistItems?.forEach((element) => {
        if (element.TemplateId === templates.ConfirmMyLearn) {
          addChecklistItemActivated(element);
        }
      });
      let myETMSTask = checklistItems?.find(
        (item) => item.TemplateId === templates.VerifyMyETMS
      );
      if (myETMSTask) {
        if (myETMSTask.CompletedBy) {
          checklistItems?.forEach((element) => {
            if (element.TemplateId === templates.MandatoryTraining) {
              addChecklistItemActivated(element);
            }
          });
        }
      } // If we can't find the myETMS task, it is because it wasn't required (ex CTR), so it is safe to activate the mandatory training
      else {
        checklistItems?.forEach((element) => {
          if (element.TemplateId === templates.MandatoryTraining) {
            addChecklistItemActivated(element);
          }
        });
      }
      break;
    case templates.InstallationInProcess:
      //Activate the Obtain CAC (Mil/Civ) task
      checklistItems?.forEach((element) => {
        if (element.TemplateId === templates.ObtainCACGov) {
          addChecklistItemActivated(element);
        }
      });
      break;
    case templates.MandatoryTraining:
      //Activate the Confirm mandatory training task
      checklistItems?.forEach((element) => {
        if (element.TemplateId === templates.ConfirmMandatoryTraining) {
          addChecklistItemActivated(element);
        }
      });
      break;
    case templates.SignedTeleworkAgreement:
      //Activate the Telework status entered in WHAT task
      checklistItems?.forEach((element) => {
        if (element.TemplateId === templates.TeleworkAddedToWHAT) {
          addChecklistItemActivated(element);
        }
      });
      break;
    default:
      break;
  }

  // If we activated any checklist items, then send out appropriate notifications
  if (activatedTasksByRole.size > 0) {
    sendActivationEmails(activatedTasksByRole, checklistItems, item.Id);
  }
  return execute();
};

export const useCompleteChecklistItem = (item: ICheckListItem) => {
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();
  const email = useEmail();
  let checklistItems: ICheckListItem[];

  return useMutation(
    ["checklist", item.Id],
    () => {
      return completeCheckListItem(
        item,
        checklistItems,
        currentUser,
        email.sendActivationEmails
      );
    },
    {
      onMutate: async () => {
        const checklistItemsTemp = await queryClient.fetchQuery(
          ["checklist", item.RequestId],
          () => getCheckListItemsByRequestId(item.RequestId)
        );
        checklistItems = transformCheckListItemsFromSP(checklistItemsTemp);
      },
      onSuccess: () => {
        return queryClient.invalidateQueries(["checklist"]);
      },
    }
  );
};

import { spWebContext } from "providers/SPWebContext";
import { IInRequest } from "api/RequestApi";
import { EMPTYPES } from "constants/EmpTypes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RoleType } from "./RolesApi";

const createInboundChecklistItems = (request: IInRequest) => {
  const [batchedSP, execute] = spWebContext.batched();

  const checklistItems = batchedSP.web.lists.getByTitle("CheckListItems");

  // TESTING ITEM
  checklistItems.items.add({
    Title: "TESTING ITEM",
    Description:
      "<p>This item should become enabled AFTER the Welcome Package is complete</p>",
    Lead: RoleType.SUPERVISOR,
    RequestId: request.Id,
    TemplateId: -1,
    Active: false,
  });

  // Welcome Package
  // Required for all inbounds?
  checklistItems.items.add({
    Title: "Welcome Package",
    Description:
      "<p>This is a sample description of a task.</p><p>It <b>CAN</b> contain <span style='color:#4472C4'>fancy</span><span style='background:yellow'>formatting</span> to help deliver an <span    style='font-size:14.0pt;line-height:107%'>IMPACTFUL </span>message/</p>",
    Lead: RoleType.SUPERVISOR,
    RequestId: request.Id,
    TemplateId: 1,
    Active: true,
  });

  // IA Training
  // Required for all inbounds?
  checklistItems.items.add({
    Title: "IA Training",
    Description: "",
    Lead: RoleType.EMPLOYEE,
    RequestId: request.Id,
    TemplateId: 2,
    Active: true,
  });

  // Transfer CAC if civilian employee already has one
  if (
    request.hasExistingCAC === "yes" &&
    request.empType === EMPTYPES.Civilian
  ) {
    checklistItems.items.add({
      Title: "Transfer CAC",
      Description: "",
      Lead: RoleType.SECURITY,
      RequestId: request.Id,
      TemplateId: 3,
      Active: true,
    });
  }

  // Obtain CAC if employee doesn't already have one
  if (request.hasExistingCAC === "no") {
    checklistItems.items.add({
      Title: "Obtain CAC",
      Description: "",
      Lead: RoleType.SECURITY,
      RequestId: request.Id,
      TemplateId: 4,
      Active: true,
    });
  }

  // Base Training
  if (request.isNewCivMil === "yes") {
    checklistItems.items.add({
      Title: "Attend On-Base Training",
      Description: "",
      Lead: RoleType.EMPLOYEE,
      RequestId: request.Id,
      TemplateId: 5,
      Active: true,
    });
  }

  // GTC/DTS
  if (request.isTraveler === "yes") {
    checklistItems.items.add({
      Title: "GTC In-processing",
      Description: "",
      Lead: RoleType.GTC,
      RequestId: request.Id,
      TemplateId: 6,
      Active: true,
    });
    checklistItems.items.add({
      Title: "DTS In-processing",
      Description: "",
      Lead: RoleType.DTS,
      RequestId: request.Id,
      TemplateId: 7,
      Active: true,
    });
  }

  // ATAAPS
  if (request.empType === EMPTYPES.Civilian) {
    checklistItems.items.add({
      Title: "ATAAPS In-processing",
      Description: "",
      Lead: RoleType.ATAAPS,
      RequestId: request.Id,
      TemplateId: 8,
      Active: false,
    });
  }

  // Training In-processing
  // Security In-processing
  // Supervisor In-processing
  // ETT In-processing

  return execute();
};

export const useAddTasks = () => {
  const queryClient = useQueryClient();
  return useMutation(
    ["checklist"],
    (newRequest: IInRequest) => {
      if (process.env.NODE_ENV === "development") {
        return Promise.resolve();
      } else {
        return createInboundChecklistItems(newRequest);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["checklist"]);
      },
    }
  );
};

import { spWebContext } from "providers/SPWebContext";
import { IInRequest } from "api/RequestApi";
import { EMPTYPES } from "constants/EmpTypes";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const createInboundChecklistItems = (request: IInRequest) => {
  const [batchedSP, execute] = spWebContext.batched();

  const checklistItems = batchedSP.web.lists.getByTitle("CheckListItems");

  // Welcome Package
  // Required for all inbounds?
  checklistItems.items.add({
    Title: "Welcome Package",
    Description: "",
    Lead: "Supervisor",
    RequestId: request.Id,
  });

  // IA Training
  // Required for all inbounds?
  checklistItems.items.add({
    Title: "IA Training",
    Description: "",
    Lead: "Employee",
    RequestId: request.Id,
  });

  // Transfer CAC if civilian employee already has one
  if (
    request.hasExistingCAC === "yes" &&
    request.empType === EMPTYPES.Civilian
  ) {
    checklistItems.items.add({
      Title: "Transfer CAC",
      Description: "",
      Lead: "Security",
      RequestId: request.Id,
    });
  }

  // Obtain CAC if employee doesn't already have one
  if (request.hasExistingCAC === "no") {
    checklistItems.items.add({
      Title: "Obtain CAC",
      Description: "",
      Lead: "Security",
      RequestId: request.Id,
    });
  }

  // Base Training
  if (request.isNewCivMil === "yes") {
    checklistItems.items.add({
      Title: "Attend On-Base Training",
      Description: "",
      Lead: "Employee",
      RequestId: request.Id,
    });
  }

  // GTC/DTS
  if (request.isTraveler === "yes") {
    checklistItems.items.add({
      Title: "GTC In-processing",
      Description: "",
      Lead: "Travel",
      RequestId: request.Id,
    });
    checklistItems.items.add({
      Title: "DTS In-processing",
      Description: "",
      Lead: "Travel",
      RequestId: request.Id,
    });
  }

  // ATAAPS
  if (request.empType === EMPTYPES.Civilian) {
    checklistItems.items.add({
      Title: "ATAAPS In-processing",
      Description: "",
      Lead: "ATAAPS",
      RequestId: request.Id,
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

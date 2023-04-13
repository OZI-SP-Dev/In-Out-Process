import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { ICheckListItem } from "api/CheckListItemApi";
import { checklistTemplates } from "api/CreateChecklistItems";
import { CheckListItemPrereq } from "components/CheckList/CheckListItemPrereq";
import { DateTime } from "luxon";
import { vi } from "vitest";

const queryClient = new QueryClient();

const checklistAPI = require("api/CheckListItemApi");

const testChecklistItems: ICheckListItem[] = checklistTemplates.map(
  (template, index) => {
    return {
      Id: index + 1,
      Title: template.Title,
      Description: template.Description,
      Lead: template.Lead,
      RequestId: 1,
      TemplateId: template.TemplateId,
      Active: false,
    };
  }
);

describe("Prequisites shows incomplete", () => {
  it.each(testChecklistItems)("$Title", async (item) => {
    // Mock the useCheckListItems to return a checklist item for every defined template
    vi.spyOn(checklistAPI, "useChecklistItems").mockImplementation(
      (requestId) => {
        const testChecklistItems: ICheckListItem[] = checklistTemplates.map(
          (template, index) => {
            return {
              Id: index + 1,
              Title: template.Title,
              Description: template.Description,
              Lead: template.Lead,
              RequestId: requestId as number,
              TemplateId: template.TemplateId,
              Active: false,
            };
          }
        );

        return { data: testChecklistItems };
      }
    );
    render(
      <QueryClientProvider client={queryClient}>
        <CheckListItemPrereq checklistItem={item} />
      </QueryClientProvider>
    );

    const thisTemp = checklistTemplates.find(
      (templ) => templ.TemplateId === item.TemplateId
    );

    const preReqTitles = thisTemp?.Prereqs.map(
      (id) => checklistTemplates.find((templ) => templ.TemplateId === id)?.Title
    );

    preReqTitles?.forEach((element) => {
      const preReqElement = screen.getByLabelText(element + " needs Completed");
      const completeIcon = within(preReqElement).queryByTitle("Complete");

      // Expect the prerequisite to be listed
      expect(preReqElement).toBeInTheDocument();
      // Expect it NOT to have a checkmark icon showing it as Complete
      expect(completeIcon).not.toBeInTheDocument();
    });
  });
});

describe("Prequisites shows completed", () => {
  it.each(testChecklistItems)("$Title", async (item) => {
    // Mock the useCheckListItems to return a checklist item for every defined template - and set CompletedDate
    vi.spyOn(checklistAPI, "useChecklistItems").mockImplementation(
      (requestId) => {
        const testChecklistItems: ICheckListItem[] = checklistTemplates.map(
          (template, index) => {
            return {
              Id: index + 1,
              Title: template.Title,
              Description: template.Description,
              Lead: template.Lead,
              RequestId: requestId as number,
              TemplateId: template.TemplateId,
              CompletedDate: DateTime.now(),
              Active: false,
            };
          }
        );

        return { data: testChecklistItems };
      }
    );
    render(
      <QueryClientProvider client={queryClient}>
        <CheckListItemPrereq checklistItem={item} />
      </QueryClientProvider>
    );

    const thisTemp = checklistTemplates.find(
      (templ) => templ.TemplateId === item.TemplateId
    );

    const preReqTitles = thisTemp?.Prereqs.map(
      (id) => checklistTemplates.find((templ) => templ.TemplateId === id)?.Title
    );

    preReqTitles?.forEach((element) => {
      const preReqElement = screen.getByLabelText(element + " is Complete");
      const completeIcon = within(preReqElement).getByTitle("Complete");

      // Expect the prequisite to be listed
      expect(preReqElement).toBeInTheDocument();
      // Expect the prequisite to have a Complete icon
      expect(completeIcon).toBeInTheDocument();
    });
  });
});

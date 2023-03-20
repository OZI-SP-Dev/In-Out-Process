import { Badge } from "@fluentui/react-components";
import { CompletedIcon } from "@fluentui/react-icons-mdl2";
import { ICheckListItem, useChecklistItems } from "api/CheckListItemApi";
import { checklistTemplates } from "api/CreateChecklistItems";

interface CheckListItemPrereqProps {
  checklistItem: ICheckListItem;
}

export const CheckListItemPrereq = ({
  checklistItem,
}: CheckListItemPrereqProps) => {
  // Get all the Checklist Items for this request so we can map them out
  const checklistItems = useChecklistItems(checklistItem.RequestId);
  let prereqItems: ICheckListItem[] = [];

  if (checklistItems.data) {
    // Locate the current checklist item's template
    const thisTemp = checklistTemplates.find(
      (templ) => templ.TemplateId === checklistItem.TemplateId
    );

    // If we have prereqs, then set the prereqItems to those Checklist Items
    if (thisTemp && thisTemp.Prereqs.length > 0) {
      prereqItems = checklistItems.data.filter((item) =>
        thisTemp.Prereqs.includes(item.TemplateId)
      );
    }
  } else {
    // If we don't have data yet, show that we are Loading this section
    return <>Loading</>;
  }

  return (
    <>
      {prereqItems.map((item) => {
        return (
          <Badge
            size="extra-large"
            key={item.Title}
            appearance="ghost"
            aria-label={
              item.Title +
              (item.CompletedDate ? " is Complete" : " needs Completed")
            }
            color={item.CompletedDate ? "success" : "informative"}
            style={{ verticalAlign: "middle", justifyContent: "flex-start" }}
            icon={item.CompletedDate ? <CompletedIcon title="Complete" /> : ""}
            iconPosition="after"
          >
            {item.Title}
          </Badge>
        );
      })}
    </>
  );
};

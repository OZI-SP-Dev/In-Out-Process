import { CheckList } from "./CheckList";
import { useChecklistItems } from "../../api/CheckListItemApi";
import { FunctionComponent } from "react";

export const CheckListTest: FunctionComponent = (props) => {
  const items = useChecklistItems(1);

  return <CheckList CheckListItems={items} />;
};

import { FunctionComponent } from "react";
import { useParams } from "react-router-dom";
import { CheckList } from "./components/CheckList/CheckList";
import { useChecklistItems } from "./api/CheckListItemApi";
import { InRequest, INFORMVIEWS } from "./components/InRequest/InRequest";

export const Item: FunctionComponent = (props) => {
  const { itemNum } = useParams();
  const checklisItems = useChecklistItems(Number(itemNum));

  return (
    <div>
      <h1>Welcome to the Item Page</h1>
      <InRequest ReqId={Number(itemNum)} view={INFORMVIEWS.COMPACT} />
      <CheckList CheckListItems={checklisItems} />
    </div>
  );
};

import { useParams } from "react-router-dom";
import { CheckList } from "./components/CheckList/CheckList";
import { useChecklistItems } from "./api/CheckListItemApi";
import { InForm } from "./components/InForm/InForm";

export const Item: React.FunctionComponent = (props) => {
  const { itemNum } = useParams();
  const checklisItems = useChecklistItems(Number(itemNum));

  return (
    <div>
      <h1>Welcome to the Item Page</h1>
      <InForm ReqId={Number(itemNum)} compactView />
      <CheckList CheckListItems={checklisItems} />
    </div>
  );
};

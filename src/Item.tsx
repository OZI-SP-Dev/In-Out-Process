import { FunctionComponent } from "react";
import { useParams } from "react-router-dom";
import { CheckList } from "./components/CheckList/CheckList";
import { InRequest, INFORMVIEWS } from "./components/InRequest/InRequest";

export const Item: FunctionComponent = (props) => {
  const { itemNum } = useParams();

  return (
    <div>
      <h1>Welcome to the Item Page</h1>
      <InRequest ReqId={Number(itemNum)} view={INFORMVIEWS.COMPACT} />
      <CheckList ReqId={Number(itemNum)} />
    </div>
  );
};

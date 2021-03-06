import { CheckList } from "./CheckList";
import { ICheckListItem } from "../../api/CheckListItemApi";

export const CheckListTest: React.FunctionComponent = (props) => {
  const items: ICheckListItem[] = [
    {
      Id: 1,
      Title: "First Item!",
      Lead: "Anakin Skywalker",
    },
    {
      Id: 2,
      Title: "Second Item!",
      Lead: "Obi-Wan Kenobi",
    },
  ];

  return <CheckList CheckListItems={items} />;
};

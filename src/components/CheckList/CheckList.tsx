import { ICheckListItem } from "../../api/CheckListItemApi";
import { IColumn } from "@fluentui/react";
import { ShimmeredDetailsList } from "@fluentui/react/lib/ShimmeredDetailsList";
import { FunctionComponent } from "react";

export interface ICheckList {
  CheckListItems: ICheckListItem[] | null;
}

export const CheckList: FunctionComponent<ICheckList> = (props) => {
  // Define columns for details list
  const columns: IColumn[] = [
    {
      key: "column0",
      name: "Item",
      fieldName: "Id",
      minWidth: 40,
      maxWidth: 40,
      isResizable: false,
    },
    {
      key: "column1",
      name: "Description",
      fieldName: "Title",
      minWidth: 100,
      maxWidth: 200,
      isResizable: true,
    },
    {
      key: "column2",
      name: "Lead",
      fieldName: "Lead",
      minWidth: 100,
      maxWidth: 200,
      isResizable: true,
    },
    {
      key: "column3",
      name: "Completed Date",
      fieldName: "CompletedDate",
      minWidth: 100,
      maxWidth: 200,
      isResizable: true,
    },
  ];

  return (
    <div>
      <ShimmeredDetailsList
        items={props.CheckListItems || []}
        columns={columns}
        enableShimmer={!props.CheckListItems}
      />
    </div>
  );
};

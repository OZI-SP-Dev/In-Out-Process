import { ICheckListItem } from "../../api/CheckListItemApi";
import { DetailsList, IColumn } from "@fluentui/react";
import { useState } from "react";

export interface ICheckList {
  CheckListItems: ICheckListItem[];
}

export const CheckList: React.FunctionComponent<ICheckList> = (props) => {

  // Define columns for details list
  const columns: IColumn[] = [
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
      key: "column2",
      name: "Completed Date",
      fieldName: "CompletedDate",
      minWidth: 100,
      maxWidth: 200,
      isResizable: true,
    },
  ];

  return (
    <div>
      <DetailsList items={props.CheckListItems} columns={columns} />
    </div>
  );
};

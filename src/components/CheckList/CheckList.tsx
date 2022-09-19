import {
  useChecklistItems,
  useUpdateCheckListItem,
} from "api/CheckListItemApi";
import { IColumn, SelectionMode } from "@fluentui/react";
import { ShimmeredDetailsList } from "@fluentui/react/lib/ShimmeredDetailsList";
import { FunctionComponent } from "react";
import { Button } from "@fluentui/react-components";

export interface ICheckList {
  ReqId: number;
}

export const CheckList: FunctionComponent<ICheckList> = (props) => {
  const checlistItems = useChecklistItems(Number(props.ReqId));

  const { completeCheckListItem } = useUpdateCheckListItem();

  const completeCheckListItemClick = (itemId: number) => {
    completeCheckListItem(itemId);
  };

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
      onRender: (item) => {
        if (item.CompletedDate) {
          return <>{item.CompletedDate?.toFormat("yyyy-MM-dd")}</>;
        } else {
          return (
            <>
              <Button
                appearance="primary"
                onClick={() => completeCheckListItemClick(item.Id)}
              >
                Complete
              </Button>
            </>
          );
        }
      },
    },
    {
      key: "column4",
      name: "Completed By",
      fieldName: "CompletedBy",
      minWidth: 100,
      maxWidth: 200,
      isResizable: true,
      onRender: (item) => {
        return <>{item.CompletedBy?.Title}</>;
      },
    },
  ];

  return (
    <div>
      <ShimmeredDetailsList
        items={checlistItems.data || []}
        columns={columns}
        enableShimmer={!checlistItems.data}
        selectionMode={SelectionMode.none}
      />
    </div>
  );
};

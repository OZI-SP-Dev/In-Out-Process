import { ICheckListItem, useChecklistItems } from "api/CheckListItemApi";
import { FunctionComponent, useState } from "react";
import {
  createTableColumn,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridProps,
  DataGridRow,
  Link,
  TableCellLayout,
  TableColumnDefinition,
} from "@fluentui/react-components";
import { useBoolean } from "@fluentui/react-hooks";
import { CheckListItemPanel } from "components/CheckList/CheckListItemPanel";
import { RoleType } from "api/RolesApi";
import { IRequest } from "api/RequestApi";
import { CheckListItemButton } from "components/CheckList/CheckListItemButton";
import { DateTime } from "luxon";

export interface ICheckList {
  ReqId: number;
  Roles: RoleType[];
  Request: IRequest;
}

export const CheckList: FunctionComponent<ICheckList> = (props) => {
  const checlistItems = useChecklistItems(Number(props.ReqId));

  // State and functions to handle whether or not to display the CheckList Item Panel
  const [isItemPanelOpen, { setTrue: showItemPanel, setFalse: hideItemPanel }] =
    useBoolean(false);

  // State and function to handle which item is being displayed in the CheckList Item Panel
  const [currentItemId, setCurrentItemId] = useState<number>();

  // DataGrid method for when a new row is selected
  const onSelectionChange: DataGridProps["onSelectionChange"] = (_e, data) => {
    setCurrentItemId(
      parseInt(data.selectedItems.values().next().value.toString())
    );
  };

  // Define columns for the DataGrid
  const columns: TableColumnDefinition<ICheckListItem>[] = [
    createTableColumn<ICheckListItem>({
      columnId: "title",
      compare: (a, b) => {
        return a.Title.localeCompare(b.Title);
      },
      renderHeaderCell: () => {
        return "Title";
      },
      renderCell: (item) => {
        return (
          <TableCellLayout>
            <Link
              onClick={() => {
                setCurrentItemId(item.Id);
                showItemPanel();
              }}
            >
              {item.Title}
            </Link>
          </TableCellLayout>
        );
      },
    }),
    createTableColumn<ICheckListItem>({
      columnId: "lead",
      compare: (a, b) => {
        return a.Lead.localeCompare(b.Lead);
      },
      renderHeaderCell: () => {
        return "Lead";
      },
      renderCell: (item) => {
        return <TableCellLayout>{item.Lead}</TableCellLayout>;
      },
    }),
    createTableColumn<ICheckListItem>({
      columnId: "completedDate",
      compare: (a, b) => {
        const aDate =
          a.CompletedDate?.toUnixInteger() ?? DateTime.now().toUnixInteger();
        const bDate =
          b.CompletedDate?.toUnixInteger() ?? DateTime.now().toUnixInteger();
        return aDate - bDate;
      },
      renderHeaderCell: () => {
        return "Completed Date";
      },
      renderCell: (item) => {
        return (
          <TableCellLayout>
            {item.CompletedDate
              ? item.CompletedDate?.toFormat("yyyy-MM-dd")
              : props.Roles?.includes(item.Lead) &&
                props.Request.status === "Active" && (
                  <CheckListItemButton checklistItem={item} />
                )}
          </TableCellLayout>
        );
      },
    }),
    createTableColumn<ICheckListItem>({
      columnId: "completedBy",
      compare: (a, b) => {
        const aTitle = a.CompletedBy?.Title ?? "";
        const bTitle = b.CompletedBy?.Title ?? "";
        return aTitle.localeCompare(bTitle);
      },
      renderHeaderCell: () => {
        return "Completed By";
      },
      renderCell: (item) => {
        return (
          <TableCellLayout truncate={true}>
            {item.CompletedBy?.Title}
          </TableCellLayout>
        );
      },
    }),
  ];

  // Define the columnSizingOptions for the resizable column grid
  const columnSizingOptions = {
    completedDate: {
      defaultWidth: 140,
      minWidth: 140,
      idealWidth: 140,
    },
    completedBy: {
      defaultWidth: 350,
      idealWidth: 350,
    },
    title: {
      defaultWidth: 650,
      idealWidth: 650,
    },
  };

  // The currently selected CheckList Item
  const currentItem = checlistItems.data?.find(
    (item) => item.Id === currentItemId
  );

  return (
    <>
      <br />
      <DataGrid
        items={checlistItems.data || []}
        columns={columns}
        selectionMode="single"
        getRowId={(item) => item.Id} // Make the rowId the Id of the ChecklistItem instead of index in array
        onSelectionChange={onSelectionChange}
        size="small"
        resizableColumns={true}
        columnSizingOptions={columnSizingOptions}
        sortable={true}
      >
        <DataGridHeader>
          <DataGridRow>
            {({ renderHeaderCell }) => (
              <DataGridHeaderCell>
                <b>{renderHeaderCell()}</b>
              </DataGridHeaderCell>
            )}
          </DataGridRow>
        </DataGridHeader>
        <DataGridBody<ICheckListItem>>
          {({ item, rowId }) => (
            <DataGridRow<ICheckListItem>
              key={rowId}
              selectionCell={{ "aria-label": "Select row" }}
              onDoubleClick={showItemPanel}
            >
              {({ renderCell }) => (
                <DataGridCell>{renderCell(item)}</DataGridCell>
              )}
            </DataGridRow>
          )}
        </DataGridBody>
      </DataGrid>
      {currentItem && (
        <CheckListItemPanel
          isOpen={isItemPanelOpen}
          onDismiss={hideItemPanel}
          item={currentItem}
          roles={props.Roles}
          request={props.Request}
        ></CheckListItemPanel>
      )}
    </>
  );
};

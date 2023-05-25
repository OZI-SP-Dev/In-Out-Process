import {
  Button,
  createTableColumn,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  makeStyles,
  TableCellLayout,
  TableColumnDefinition,
  tokens,
} from "@fluentui/react-components";
import { AddIcon } from "@fluentui/react-icons-mdl2";
import { useMyRequests, IInRequest } from "api/RequestApi";
import { Link, useNavigate } from "react-router-dom";

/* FluentUI Styling */
const useStyles = makeStyles({
  buttonBar: {
    display: "flex",
  },
  createButtons: {
    height: "2.5em",
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorBrandBackgroundInverted,
    marginLeft: "1em",
    marginRight: "1em",
    ":hover": {
      backgroundColor: tokens.colorBrandBackgroundHover,
      color: tokens.colorBrandBackgroundInvertedHover,
    },
  },
  icon: {
    color: tokens.colorBrandBackgroundInverted,
    ":hover": {
      color: tokens.colorBrandBackgroundInvertedHover,
    },
  },
  myRequestsHeader: {
    paddingLeft: "1em",
    paddingRight: "1em",
  },
  requestList: {
    paddingLeft: "1em",
    paddingRight: "1em",
  },
});

export const MyRequests = () => {
  const { data } = useMyRequests();
  const navigateTo = useNavigate();
  const classes = useStyles();

  // Define columns for the DataGrid
  const columns: TableColumnDefinition<IInRequest>[] = [
    createTableColumn<IInRequest>({
      columnId: "empName",
      compare: (a, b) => {
        return a.empName.localeCompare(b.empName);
      },
      renderHeaderCell: () => {
        return "Employee Name";
      },
      renderCell: (item) => {
        return (
          <TableCellLayout>
            <Link to={"item/" + item.Id}>{item.empName}</Link>
          </TableCellLayout>
        );
      },
    }),
    createTableColumn<IInRequest>({
      columnId: "eta",
      compare: (a, b) => {
        const aDate = a.eta?.getDate() ?? new Date().getDate();
        const bDate = b.eta?.getDate() ?? new Date().getDate();
        return aDate - bDate;
      },
      renderHeaderCell: () => {
        return "Estimated On-Boarding";
      },
      renderCell: (item) => {
        return (
          <TableCellLayout>{item.eta?.toLocaleDateString()}</TableCellLayout>
        );
      },
    }),
  ];

  // Define the columnSizingOptions for the resizable column grid
  const columnSizingOptions = {
    empName: {
      defaultWidth: 250,
      minWidth: 140,
      idealWidth: 250,
    },
    eta: {
      defaultWidth: 350,
      idealWidth: 350,
    },
  };

  return (
    <>
      <br />
      <div className={classes.buttonBar}>
        <Button
          className={classes.createButtons}
          appearance="primary"
          icon={
            <AddIcon
              className={classes.icon}
              onClick={() => navigateTo("/new")}
            />
          }
        >
          New In Processing Request
        </Button>
        <Button
          className={classes.createButtons}
          appearance="primary"
          icon={
            <AddIcon
              className={classes.icon}
              onClick={() => navigateTo("/depart")}
            />
          }
        >
          New Out Processing Request
        </Button>
      </div>
      <div className={classes.myRequestsHeader}>
        <h2>My Requests</h2>
      </div>
      <div className={classes.requestList}>
        <DataGrid
          items={data || []}
          columns={columns}
          getRowId={(item) => item.Id} // Make the rowId the Id of the ChecklistItem instead of index in array
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
          <DataGridBody<IInRequest>>
            {({ item, rowId }) => (
              <DataGridRow<IInRequest> key={rowId}>
                {({ renderCell }) => (
                  <DataGridCell>{renderCell(item)}</DataGridCell>
                )}
              </DataGridRow>
            )}
          </DataGridBody>
        </DataGrid>
      </div>
    </>
  );
};

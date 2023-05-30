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
import { useMyRequests, IInRequest, IOutRequest } from "api/RequestApi";
import { Link, useNavigate } from "react-router-dom";

/* FluentUI Styling */
const useStyles = makeStyles({
  buttonBar: {
    display: "flex",
    flexWrap: "wrap",
    rowGap: "1em",
    justifyContent: "space-evenly",
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
    display: "flex",
    flexWrap: "wrap",
    flexBasis: "50%",
    rowGap: "2em",
    justifyContent: "space-evenly",
    minWidth: "500px",
  },
});

export const MyRequests = () => {
  const { data } = useMyRequests();
  const navigateTo = useNavigate();
  const classes = useStyles();

  const inRequests = data?.filter((req) => req.reqType === "In");
  const outRequests = data?.filter((req) => req.reqType === "Out");

  // Define columns for the In-processing DataGrid
  const inReqColumns: TableColumnDefinition<IInRequest>[] = [
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

  // Define the columnSizingOptions for the resizable column grid for In-processing
  const inReqColumnSizingOptions = {
    empName: {
      defaultWidth: 250,
      minWidth: 140,
      idealWidth: 250,
    },
    eta: {
      defaultWidth: 175,
      idealWidth: 175,
    },
  };

  // Define columns for the In-processing DataGrid
  const outReqColumns: TableColumnDefinition<IOutRequest>[] = [
    createTableColumn<IOutRequest>({
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
    createTableColumn<IOutRequest>({
      columnId: "lastDay",
      compare: (a, b) => {
        const aDate = a.lastDay?.getDate() ?? new Date().getDate();
        const bDate = b.lastDay?.getDate() ?? new Date().getDate();
        return aDate - bDate;
      },
      renderHeaderCell: () => {
        return "Last Day";
      },
      renderCell: (item) => {
        return (
          <TableCellLayout>
            {item.lastDay?.toLocaleDateString()}
          </TableCellLayout>
        );
      },
    }),
  ];

  // Define the columnSizingOptions for the resizable column grid for In-processing
  const outReqColumnSizingOptions = {
    empName: {
      defaultWidth: 250,
      minWidth: 140,
      idealWidth: 250,
    },
    lastDay: {
      defaultWidth: 175,
      idealWidth: 175,
    },
  };

  return (
    <>
      <br />
      <div className={classes.buttonBar}>
        <Button
          className={classes.createButtons}
          onClick={() => navigateTo("/new")}
          appearance="primary"
          icon={<AddIcon className={classes.icon} />}
        >
          New In Processing Request
        </Button>
        <Button
          className={classes.createButtons}
          onClick={() => navigateTo("/depart")}
          appearance="primary"
          icon={<AddIcon className={classes.icon} />}
        >
          New Out Processing Request
        </Button>
      </div>
      <div className={classes.myRequestsHeader}>
        <h2>My Requests</h2>
      </div>
      <div className={classes.requestList}>
        <div>
          <h3>In-processing</h3>
          <DataGrid
            items={inRequests || []}
            columns={inReqColumns}
            getRowId={(item) => item.Id} // Make the rowId the Id of the ChecklistItem instead of index in array
            size="small"
            resizableColumns={true}
            columnSizingOptions={inReqColumnSizingOptions}
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
        <div>
          <h3>Out-processing</h3>
          <DataGrid
            items={outRequests || []}
            columns={outReqColumns}
            getRowId={(item) => item.Id} // Make the rowId the Id of the ChecklistItem instead of index in array
            size="small"
            resizableColumns={true}
            columnSizingOptions={outReqColumnSizingOptions}
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
      </div>
    </>
  );
};

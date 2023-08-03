import {
  createTableColumn,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  Field,
  makeStyles,
  Switch,
  TableCellLayout,
  TableColumnDefinition,
} from "@fluentui/react-components";
import { IRequest, isInRequest, useRequests } from "api/RequestApi";
import { useState } from "react";
import { Link } from "react-router-dom";

/* FluentUI Styling */
const useStyles = makeStyles({
  padContent: {
    paddingLeft: "1em",
    paddingRight: "1em",
  },
  requestList: {
    paddingLeft: "1em",
    paddingRight: "1em",
    rowGap: "2em",
    minWidth: "500px",
  },
});

const SummaryView = () => {
  const { data } = useRequests();
  const classes = useStyles();
  let dataList;

  const [showingClosed, setShowingClosed] = useState(false);

  if (showingClosed) {
    // Show all items
    dataList = data;
  } else {
    // Show just those with an "Active" status
    dataList = data?.filter((request) => request.status === "Active");
  }

  // Define columns for the In-processing DataGrid
  const inReqColumns: TableColumnDefinition<IRequest>[] = [
    createTableColumn<IRequest>({
      columnId: "reqType",
      compare: (a, b) => {
        return a.reqType.localeCompare(b.reqType);
      },
      renderHeaderCell: () => {
        return "Type";
      },
      renderCell: (item) => {
        return <TableCellLayout>{item.reqType}</TableCellLayout>;
      },
    }),
    createTableColumn<IRequest>({
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
            <Link to={"/item/" + item.Id}>{item.empName}</Link>
          </TableCellLayout>
        );
      },
    }),
    createTableColumn<IRequest>({
      columnId: "office",
      compare: (a, b) => {
        return a.office.localeCompare(b.office);
      },
      renderHeaderCell: () => {
        return "Office";
      },
      renderCell: (item) => {
        return <TableCellLayout>{item.office}</TableCellLayout>;
      },
    }),
    createTableColumn<IRequest>({
      columnId: "etaOrLastDay",
      compare: (a, b) => {
        const aDate = isInRequest(a) ? a.eta?.valueOf() : a.lastDay?.valueOf();
        const bDate = isInRequest(b) ? b.eta?.valueOf() : b.lastDay?.valueOf();
        return aDate - bDate;
      },
      renderHeaderCell: () => {
        return "Est. On-Boarding / Last Day";
      },
      renderCell: (item) => {
        return (
          <TableCellLayout>
            {isInRequest(item)
              ? item.eta?.toLocaleDateString()
              : item.lastDay?.toLocaleDateString()}
          </TableCellLayout>
        );
      },
    }),
    createTableColumn<IRequest>({
      columnId: "status",
      compare: (a, b) => {
        return a.status.localeCompare(b.status);
      },
      renderHeaderCell: () => {
        return "Status";
      },
      renderCell: (item) => {
        return <TableCellLayout>{item.status}</TableCellLayout>;
      },
    }),
  ];

  // Define the columnSizingOptions for the resizable column grid for In-processing
  const inReqColumnSizingOptions = {
    reqType: {
      defaultWidth: 30,
      minWidth: 30,
      idealWidth: 30,
    },
    empName: {
      defaultWidth: 450,
      minWidth: 140,
      idealWidth: 450,
    },
    office: {
      defaultWidth: 80,
      minWidth: 50,
      idealWidth: 80,
    },
    etaOrLastDay: {
      defaultWidth: 130,
      idealWidth: 130,
    },
  };

  return (
    <>
      <div className={classes.padContent}>
        <h1>Summary View</h1>
        <Field label="Toggle to show/hide closed items">
          <Switch
            onChange={() => setShowingClosed(!showingClosed)}
            label={showingClosed ? "Showing all items" : "Showing active items"}
          />
        </Field>
      </div>
      <div className={classes.requestList}>
        <DataGrid
          items={dataList || []}
          columns={inReqColumns}
          getRowId={(item) => item.Id} // Make the rowId the Id of the Request instead of index in array
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
          <DataGridBody<IRequest>>
            {({ item, rowId }) => (
              <DataGridRow<IRequest> key={rowId}>
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

export default SummaryView;

import { Children, isValidElement, ReactNode } from "react";
import {
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  Skeleton,
  SkeletonItem,
} from "@fluentui/react-components";

interface SkeletonDataGridProps {
  /** Whether the grid has data yet or not */
  isLoadingData: boolean;
  /** The child node  */
  children: ReactNode;
}

/** This Component is used to Render a DataGrid with SkeletonItems when the data for the grid is still loading */
export const SkeletonDataGrid = ({
  isLoadingData,
  children,
}: SkeletonDataGridProps) => {
  const firstChild = Children.toArray(children)[0];

  // Ensure we have a valid React Element, so that we can access the props -- if we don't terminate with displaying error
  if (!isValidElement(firstChild)) {
    return <>There has been an error trying to load grid of data</>;
  }

  // Determine if the selection mode was set on the DataGrid -- supposed to be false by default which should not render selection cell
  // Since DataGrid is still rendering the selectionCell regardless of value, this workaround will ensure we don't set a selectionCell
  // if the prop isn't populated
  const hasSelectionEnabled = firstChild.props?.selectionMode ? true : false;

  return (
    <>
      {isLoadingData ? (
        <Skeleton>
          <DataGrid
            {...firstChild.props} // Pass in all the props from the child DataGrid
            items={[{}, {}, {}, {}, {}, {}, {}, {}, {}, {}]} // Overwrite the items prop with some blank data
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
            <DataGridBody<any>>
              {({ rowId }) => (
                <DataGridRow<any>
                  key={rowId}
                  selectionCell={
                    hasSelectionEnabled
                      ? { "aria-label": "Select row" }
                      : undefined
                  }
                >
                  {() => (
                    <DataGridCell>
                      <SkeletonItem />
                    </DataGridCell>
                  )}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
        </Skeleton>
      ) : (
        <>
          {
            firstChild /* Render the DataGrid that was passed in once the data is there */
          }
        </>
      )}
    </>
  );
};

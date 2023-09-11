import { spWebContext } from "providers/SPWebContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Internal functions that actually do the fetching
// Return only 1 record, being the most recently modified one for the request
const getAdditionalInfo = async (requestId: number) => {
  return spWebContext.web.lists
    .getByTitle("AdditionalInfo")
    .items.filter(`RequestId eq ${requestId}`)
    .orderBy("Modified", false) // Descending so newest is first
    .top(1) // Select just 1 record
    .select("*")();
};

/** Exported hook for getting the additional info for the request
 *    It returns just the most recent record the user has permission to see
 */
export const useAdditionalInfo = (requestId: number) => {
  return useQuery({
    queryKey: ["additionalInfo", requestId],
    queryFn: () => getAdditionalInfo(requestId),
    enabled: false, // Don't load data on mount, just when requested via refetch
    staleTime: Infinity, // Mark data as always fresh so it doesn't try to get from server again unless we specifically ask
  });
};

/** Exported hook to add a record of additional info to the request */
export const useAddAdditionalInfo = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ["additionalInfo"],
    async (newRequest: IAdditionalInfo) => {
      const newRequestRes = await spWebContext.web.lists
        .getByTitle("AdditionalInfo")
        .items.add(newRequest);

      // Pass back the request that came to us, but add in the Id returned from SharePoint
      let res: IAdditionalInfo = structuredClone(newRequest);
      res.Id = newRequestRes.data.Id;

      return Promise.resolve(res);
    },
    {
      onSuccess: async (_data, variables) => {
        // Mark additionalInfo as needing refreshed
        queryClient.invalidateQueries(["additionalInfo", variables.RequestId]);
      },
    }
  );
};

/** Exported hook to update a record of additional info to the request
 *    If the record passed in has an Id of -1, then create the record instead of updating
 */
export const useUpdateAdditionalInfo = () => {
  const queryClient = useQueryClient();
  return useMutation(
    ["additionalInfoUpdate"],
    async (request: IAdditionalInfo) => {
      if (request.Id !== -1) { 
        // Update the existing record
        return spWebContext.web.lists
          .getByTitle("AdditionalInfo")
          .items.getById(request.Id)
          .update(request);
      } else {
        // The record doesn't exist, so we must create one
        const newRequestRes = await spWebContext.web.lists
          .getByTitle("AdditionalInfo")
          .items.add(request);

        // Pass back the request that came to us, but add in the Id returned from SharePoint
        let res: IAdditionalInfo = structuredClone(request);
        res.Id = newRequestRes.data.Id;

        return Promise.resolve(res);
      }
    },
    {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries(["additionalInfo", variables.RequestId]);
      },
    }
  );
};

/** Exported hook to delete a record of additional info to the request */
export const usePurgeAdditionalInfo = (RequestId: number) => {
  const queryClient = useQueryClient();
  return useMutation(
    ["additionalInfo", RequestId],
    async () => {
      const additionalInfo = await getAdditionalInfo(RequestId);
      if (additionalInfo.length > 0) {
        // If we returned a record, then delete it
        return spWebContext.web.lists
          .getByTitle("AdditionalInfo")
          .items.getById(additionalInfo[0].Id)
          .delete();
      } else {
        // If we didn't return a record then we either errored or the user didn't have permission, either way, pass back a resolved Promise
        return Promise.resolve();
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["additionalInfo", RequestId]);
      },
    }
  );
};

// create IItem item to work with it internally
export type IAdditionalInfo = {
  /** Required - The SSN */
  Title: string;
  /** Required - The Id of the corresponding InRequest */
  RequestId: number;
  /** Required - Will be -1 for records that haven't been saved yet */
  Id: number;
};

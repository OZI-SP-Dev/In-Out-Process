import { spWebContext } from "providers/SPWebContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Link,
  Toast,
  ToastBody,
  ToastTitle,
  ToastTrigger,
  useToastController,
} from "@fluentui/react-components";

// The name of our Document library holding the documents
const libraryPath = "Attachments";

/**
 * Function to return the extension of the file
 */
const getFileExtension = (file: File) => {
  if (!file || !file.name) {
    // No file, so return nothing
    return "";
  }
  const parts = file.name.split(".");
  if (parts.length <= 1) {
    // If we had no dot, or it was just at the end with nothing after, return nothing
    return "";
  }
  return parts.pop(); // Return the last item in the array, which is the extension
};

/**
 * Gets all Attachments
 */
export const useDocuments = (requestId: number) => {
  return useQuery({
    queryKey: ["documents", requestId],
    queryFn: () => getDocuments(requestId),
  });
};

const getDocuments = async (requestId: number) => {
  const path = `${libraryPath}/${requestId}`;
  return spWebContext.web
    .getFolderByServerRelativePath(path)
    .files.select(
      "Name",
      "TimeLastModified",
      "ServerRelativeUrl",
      "ModifiedBy",
      "ModifiedBy/Id",
      "ModifiedBy/EMail",
      "ModifiedBy/Title",
      "UniqueId",
      "ListId"
    )
    .expand("ModifiedBy")
    .orderBy("Name")<SPDocument[]>();
};

export const useDeleteDocument = (document: SPDocument) => {
  const queryClient = useQueryClient();
  const { dispatchToast } = useToastController("toaster");
  return useMutation(
    ["deleteDocument", document.Name],
    async () => {
      return spWebContext.web.getFileById(document.UniqueId).recycle();
    },
    {
      onSuccess: async () => {
        queryClient.invalidateQueries(["documents"]);
        dispatchToast(
          <Toast>
            <ToastTitle>Deleted {document.Name}</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
      },
      onError: async (error) => {
        console.log(error);
        if (error instanceof Error) {
          dispatchToast(
            <Toast>
              <ToastTitle
                action={
                  <ToastTrigger>
                    <Link>Dismiss</Link>
                  </ToastTrigger>
                }
              >
                Error deleting {document.Name}
              </ToastTitle>
              <ToastBody>{error.message}</ToastBody>
            </Toast>,
            { intent: "error", timeout: -1 }
          );
        }
      },
    }
  );
};

export const useAddDocument = (requestId: number, forceName?: string) => {
  const queryClient = useQueryClient();
  return useMutation(
    ["addDocument"],
    async (file: File) => {
      return spWebContext.web
        .getFolderByServerRelativePath(`${libraryPath}/${requestId}`)
        .files.addUsingPath(
          forceName ? `${forceName}.${getFileExtension(file)}` : file.name,
          file,
          { Overwrite: true }
        );
    },
    {
      onSuccess: async () => {
        queryClient.invalidateQueries(["documents", requestId]);
      },
    }
  );
};

export interface SPDocument {
  Name: string;
  ModifiedBy: { Id: string; EMail: string; Title: string };
  TimeLastModified: string;
  ServerRelativeUrl: string;
  UniqueId: string;
  ListId: string;
}

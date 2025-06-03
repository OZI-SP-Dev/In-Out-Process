import { Button, Spinner, Title3 } from "@fluentui/react-components";
import { useDocuments } from "api/DocumentsApi";
import { useParams } from "react-router-dom";
import { DocumentView } from "./DocumentView";
import { DocumentUploader } from "./DocumentUploader";
import { RefreshIcon } from "@fluentui/react-icons-mdl2";
import { Dispatch, SetStateAction, useEffect } from "react";

const ViewRequestDocuments = (props: {
  allowUpload?: boolean;
  forceName?: string;
  allowedExt?: string;
  setHasForcedNameAttached?: Dispatch<SetStateAction<boolean | undefined>>;
}) => {
  const params = useParams();
  const requestId = Number(params.itemNum);
  const documents = useDocuments(requestId);

  useEffect(() => {
    if (props.setHasForcedNameAttached && props.forceName) {
      const forcedName = props.forceName;
      const hasForcedNameAttached = documents?.data?.find((doc) =>
        doc.Name.startsWith(forcedName)
      );

      props.setHasForcedNameAttached(!!hasForcedNameAttached);
    }
  }, [documents.data, props.setHasForcedNameAttached, props.forceName]);

  return (
    <>
      <Title3>
        Documents{" "}
        <Button
          appearance="transparent"
          icon={documents.isLoading ? <Spinner /> : <RefreshIcon />}
          aria-label="Refresh"
          disabled={documents.isLoading}
          onClick={() => documents.refetch()}
        />
      </Title3>
      {props.allowUpload ? (
        <DocumentUploader
          requestId={requestId}
          forceName={props.forceName}
          allowedExt={props.allowedExt}
        />
      ) : (
        <></>
      )}
      {documents.isLoading && <div>Fetching data...</div>}
      <br />
      {documents.data && (
        <section>
          {documents.data.map((document) => {
            if (!props.forceName || document.Name.startsWith(props.forceName)) {
              /* Only show if we aren't forcing name, or if it matches the forced name */
              return (
                <DocumentView
                  key={document.UniqueId}
                  readonly={false}
                  document={document}
                />
              );
            }
          })}
        </section>
      )}
      {documents.isError && (
        <div>An error has occured: {(documents.error as Error).message}</div>
      )}
    </>
  );
};

export default ViewRequestDocuments;

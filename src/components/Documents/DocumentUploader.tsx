import { Icon } from "@fluentui/react";
import {
  Card,
  Label,
  Spinner,
  Toast,
  ToastTitle,
  useToastController,
} from "@fluentui/react-components";
import { useAddDocument } from "api/DocumentsApi";
import { ChangeEvent, DragEventHandler, useRef, useState } from "react";

export const DocumentUploader = (props: {
  requestId: number;
  forceName?: string;
  allowedExt?: string;
}) => {
  const { dispatchToast } = useToastController("toaster");

  const raiseFileNumberError = () => {
    dispatchToast(
      <Toast>
        <ToastTitle>You can only upload 1 file.</ToastTitle>
      </Toast>,
      { intent: "error" }
    );
  };

  const addDocument = useAddDocument(props.requestId, props.forceName);
  const [inDropZone, setInDropZone] = useState(false);
  const dropDepth = useRef(0);

  const handleDragEnter: DragEventHandler = (event) => {
    event.preventDefault();
    dropDepth.current += 1;
    if (dropDepth.current > 0) {
      setInDropZone(true);
    }
  };

  const handleDragLeave: DragEventHandler = (event) => {
    event.preventDefault();
    dropDepth.current -= 1;
    if (dropDepth.current < 1) {
      setInDropZone(false);
    }
  };

  const handleDragOver: DragEventHandler = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDrop: DragEventHandler = (event) => {
    event.preventDefault();
    setInDropZone(false);
    dropDepth.current = 0;

    if (event.dataTransfer.items) {
      if (props.forceName && event.dataTransfer.items.length > 1) {
        // If we are forcing a file name, then they should only be uploading a single file
        raiseFileNumberError();
      } else {
        // Use DataTransferItemList interface to access the file(s)
        [...event.dataTransfer.items].forEach((item) => {
          // If dropped items aren't files, reject them
          if (item.kind === "file") {
            const file = item.getAsFile();
            if (file) {
              addDocument.mutate(file);
            }
          }
        });
      }
    } else {
      // Use DataTransfer interface to access the file(s)
      if (props.forceName && event.dataTransfer.files.length > 1) {
        // If we are forcing a file name, then they should only be uploading a single file
        raiseFileNumberError();
      } else {
        [...event.dataTransfer.files].forEach((file) => {
          addDocument.mutate(file);
        });
      }
    }
  };

  const fileInputOnChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      if (props.forceName && event.target.files.length > 1) {
        // If we are forcing a file name, then they should only be uploading a single file
        raiseFileNumberError();
      } else {
        for (let i = 0; i < event.target.files.length; i++) {
          addDocument.mutate(event.target.files[i]);
        }
      }
    }
  };

  return (
    <Card
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      appearance="outline"
      style={{ textAlign: "center" }}
      className={inDropZone ? "inDropZone" : ""}
      id="documentDropZone"
    >
      <input
        type="file"
        style={{ display: "none" }}
        onChange={fileInputOnChange}
        id="fileUploader"
        multiple
        accept={props.allowedExt}
        disabled={addDocument.isLoading}
      />
      {addDocument.isLoading && (
        <Spinner
          role="status"
          labelPosition="after"
          label="Uploading document(s)..."
        />
      )}
      {!addDocument.isLoading && (
        <Label size="large" htmlFor="fileUploader" weight="semibold">
          <Icon iconName="Upload" />
          <strong>
            {
              /* If we are forcing a file name, then they should only be uploading a single file */
              !props.forceName
                ? "Choose one or more files, or drag them here."
                : "Choose a file, or drag it here."
            }
          </strong>
        </Label>
      )}
    </Card>
  );
};

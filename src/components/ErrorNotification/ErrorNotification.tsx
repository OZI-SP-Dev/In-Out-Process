import { MessageBar, MessageBarType } from "@fluentui/react";
import { FunctionComponent } from "react";
import { useError } from "hooks/useError";

export const ErrorNotification: FunctionComponent = () => {
  const { error, removeError } = useError();

  const handleSubmit = (key: number) => {
    removeError(key);
  };

  return (
    <>
      {/* If there are any errors in the error array, show them as MessageBar elements 
              The key is used to determine which one to remove when clicking the "X" to dismiss the error  */}
      {error.map((error, index) => {
        return (
          <MessageBar
            key={index}
            messageBarType={MessageBarType.error}
            onDismiss={() => {
              handleSubmit(index);
            }}
            dismissButtonAriaLabel="Close"
          >
            {error?.message}
          </MessageBar>
        );
      })}
    </>
  );
};

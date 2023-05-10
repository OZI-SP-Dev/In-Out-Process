import React, { useState, useCallback, FunctionComponent } from "react";

// Simple error type now with just a message - possible to expand with other properties such as severity etc
type error = {
  message: string;
};

export const ErrorContext = React.createContext({
  error: [] as error[],
  addError: (_message: string) => {},
  removeError: (_key: number) => {},
});

export const ErrorProvider: FunctionComponent = ({ children }) => {
  const [error, setError] = useState<error[]>([]);

  const removeError = (key: number) => {
    // Remove the error entry passed in
    setError((curErr) => {
      let newErr = [...curErr];
      newErr.splice(key, 1);
      return newErr;
    });
  };

  const addError = (message: string) => {
    // Add an error entry to the array of errors
    let errMsg: error = { message: message };
    setError((curErr) => [...curErr, errMsg]);
  };

  const contextValue = {
    error,
    addError: useCallback((message: string) => addError(message), []),
    removeError: useCallback((key: number) => removeError(key), []),
  };

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
    </ErrorContext.Provider>
  );
};

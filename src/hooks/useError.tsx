import { useContext } from "react";
import { ErrorContext } from "providers/ErrorProvider";

export function useError() {
  const { error, addError, removeError } = useContext(ErrorContext);
  return { error, addError, removeError };
}

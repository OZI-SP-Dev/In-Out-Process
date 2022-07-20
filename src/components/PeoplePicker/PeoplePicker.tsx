import React from "react";
import { IPersonaProps } from "@fluentui/react/lib/Persona";
import {
  IBasePickerSuggestionsProps,
  NormalPeoplePicker,
} from "@fluentui/react/lib/Pickers";
import { people } from "@fluentui/example-data";
import { spWebContext } from "../../providers/SPWebContext";
import { IPeoplePickerEntity } from "@pnp/sp/profiles";

const suggestionProps: IBasePickerSuggestionsProps = {
  suggestionsHeaderText: "Suggested People",
  mostRecentlyUsedHeaderText: "Suggested Contacts",
  noResultsFoundText: "No results found",
  loadingText: "Loading",
  showRemoveButtons: true,
  suggestionsAvailableAlertText: "People Picker Suggestions available",
  suggestionsContainerAriaLabel: "Suggested contacts",
};

export interface SPPersona extends IPersonaProps {
  AccountName?: string;
  Department?: string;
  Email?: string;
  SPUserId?: number;
}

interface IPeoplePickerProps {
  defaultValue?: SPPersona[];
  readOnly?: boolean;
  required?: boolean;
  itemLimit?: number;
  updatePeople: (p: SPPersona[]) => void;
}

export const PeoplePicker: React.FunctionComponent<any> = (props) => {
  const [currentSelectedItems, setCurrentSelectedItems] = React.useState<
    IPersonaProps[]
  >([]);
  const [peopleList] = React.useState<IPersonaProps[]>(people);

  const picker = React.useRef(null);

  const onFilterChanged = async (
    filterText: string,
    currentPersonas?: IPersonaProps[],
    limitResults?: number,
    selectedPersonas?: IPersonaProps[] | undefined
    //): IPersonaProps[] | Promise<IPersonaProps[]>  => {
  ): Promise<IPersonaProps[]> => {
    if (filterText) {
      let filteredPersonas: IPersonaProps[]; //| Promise<IPersonaProps[]>;
      if (process.env.NODE_ENV === "development") {
        filteredPersonas = await filterPersonasByText(filterText);
      } else {
        const results =
          await spWebContext.profiles.clientPeoplePickerSearchUser({
            AllowEmailAddresses: false,
            AllowMultipleEntities: false,
            MaximumEntitySuggestions: limitResults ? limitResults : 25,
            QueryString: filterText,
            PrincipalSource: 15,
            PrincipalType: 1,
          });
        let newPersonas: IPersonaProps[] = [];
        results.forEach((person: IPeoplePickerEntity) => {
          const persona: SPPersona = {
            text: person.DisplayText,
            secondaryText: person.EntityData.Title,
            imageInitials:
              person.DisplayText.substr(
                person.DisplayText.indexOf(" ") + 1,
                1
              ) + person.DisplayText.substr(0, 1),
            Email: person.EntityData.Email,
          };
          newPersonas.push(persona);
        });

        /* No Cache Support Yet 
        // Create list of matching cached suggestions
        let cachedResults = cachedPeople
          .getCachedPeople()
          .filter((p) =>
            p.text?.toLowerCase().includes(filterText.toLowerCase())
          );

        // If we have a cached entry, remove the matching entry from newPersonas, so it is only listed once
        if (cachedResults && newPersonas) {
          newPersonas = removeDuplicates(newPersonas, cachedResults);
        }

        // Return a listing of the cached matching entries, followed by the matching user entries
        filteredPersonas = [...cachedResults, ...newPersonas];
        */

        //TODO: Remove this and utilize cache
        filteredPersonas = [...newPersonas];
      }

      // If people were already selected, then do not list them as possible additions
      if (currentPersonas && filteredPersonas) {
        filteredPersonas = removeDuplicates(filteredPersonas, currentPersonas);
      }

      // Build in a delay if in the dev environment
      if (process.env.NODE_ENV === "development") {
        filteredPersonas = await filterPromise(filteredPersonas);
      }

      if (currentPersonas) {
        filteredPersonas = removeDuplicates(filteredPersonas, currentPersonas);
      }
      filteredPersonas = limitResults
        ? filteredPersonas.slice(0, limitResults)
        : filteredPersonas;
      return filterPromise(filteredPersonas);
    } else {
      return [];
    }
  };

  const filterPersonasByText = (filterText: string): IPersonaProps[] => {
    return peopleList.filter((item) =>
      doesTextStartWith(item.text as string, filterText)
    );
  };

  const filterPromise = (
    personasToReturn: IPersonaProps[]
  ): IPersonaProps[] | Promise<IPersonaProps[]> => {
    if (process.env.NODE_ENV === "development") {
      return convertResultsToPromise(personasToReturn);
    } else {
      return personasToReturn;
    }
  };

  const onItemsChange = (items: IPersonaProps[] | undefined): void => {
    if (items) {
      setCurrentSelectedItems(items);
    }
  };

  return (
    <NormalPeoplePicker
      // eslint-disable-next-line react/jsx-no-bind
      onResolveSuggestions={onFilterChanged}
      getTextFromItem={getTextFromItem}
      pickerSuggestionsProps={suggestionProps}
      className={"ms-PeoplePicker"}
      key={"controlled"}
      selectionAriaLabel={"Selected contacts"}
      removeButtonAriaLabel={"Remove"}
      selectedItems={currentSelectedItems}
      // eslint-disable-next-line react/jsx-no-bind
      onChange={onItemsChange}
      inputProps={{
        onBlur: (ev: React.FocusEvent<HTMLInputElement>) =>
          console.log("onBlur called"),
        onFocus: (ev: React.FocusEvent<HTMLInputElement>) =>
          console.log("onFocus called"),
        "aria-label": "Contacts",
      }}
      componentRef={picker}
      resolveDelay={300}
      disabled={false}
    />
  );
};

function doesTextStartWith(text: string, filterText: string): boolean {
  return text.toLowerCase().indexOf(filterText.toLowerCase()) === 0;
}

function removeDuplicates(
  personas: IPersonaProps[],
  possibleDupes: IPersonaProps[]
) {
  return personas.filter(
    (persona) => !listContainsPersona(persona, possibleDupes)
  );
}

function listContainsPersona(
  persona: IPersonaProps,
  personas: IPersonaProps[]
) {
  if (!personas || !personas.length || personas.length === 0) {
    return false;
  }
  return personas.filter((item) => item.text === persona.text).length > 0;
}

// This function is used in development to set a 1 second delay on the results from the PeoplePicker to simulate an API call to SharePoint
function convertResultsToPromise(
  results: IPersonaProps[]
): Promise<IPersonaProps[]> {
  return new Promise<IPersonaProps[]>((resolve, reject) =>
    setTimeout(() => resolve(results), 1000)
  );
}

function getTextFromItem(persona: IPersonaProps): string {
  return persona.text as string;
}

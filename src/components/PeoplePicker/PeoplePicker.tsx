import { FunctionComponent, useRef, useState } from "react";
import { IPersonaProps } from "@fluentui/react/lib/Persona";
import { IPerson, Person } from "api/UserApi";
import {
  IBasePicker,
  IBasePickerSuggestionsProps,
  NormalPeoplePicker,
} from "@fluentui/react/lib/Pickers";
import { people } from "@fluentui/example-data";
import { spWebContext } from "../../providers/SPWebContext";
import { IPeoplePickerEntity } from "@pnp/sp/profiles";

// TODO: Add a way to show as input needed/corrected

const suggestionProps: IBasePickerSuggestionsProps = {
  suggestionsHeaderText: "Suggested People",
  mostRecentlyUsedHeaderText: "Suggested Contacts",
  noResultsFoundText: "No results found",
  loadingText: "Loading",
  showRemoveButtons: true,
  suggestionsAvailableAlertText: "People Picker Suggestions available",
  suggestionsContainerAriaLabel: "Suggested contacts",
};

interface IPeoplePickerProps {
  /** Required - The text used to label this people picker for screenreaders */
  ariaLabel: string;
  readOnly?: boolean;
  required?: boolean;
  /** Optional - Limit the People Picker to only allow selection of specific number -- Defaults to 1 */
  itemLimit?: number;
  updatePeople: (p: IPerson[]) => void;
  selectedItems: IPerson[] | IPerson;
}

export const PeoplePicker: FunctionComponent<IPeoplePickerProps> = (props) => {
  let selectedItems: IPerson[];
  if (Array.isArray(props.selectedItems)) {
    selectedItems = [...props.selectedItems];
  } else if (props.selectedItems) {
    selectedItems = [{ ...props.selectedItems }];
  } else {
    selectedItems = [];
  }

  const [peopleList] = useState<IPersonaProps[]>(people);

  const picker = useRef<IBasePicker<IPersonaProps>>(null);

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
        const results = await filterPersonasByText(filterText);
        let newPersonas: IPerson[] = [];
        // Handle DEV a little different than PROD -- as props like the image URL can't be built the same
        results.forEach((person: IPersonaProps) => {
          newPersonas.push({
            ...person,
            Id: -1,
            Title: person.text ? person.text : "DEFAULT",
            EMail: person.text
              ? person.text + "@localhost"
              : "DEFAULT@localhost",
          });
        });
        filteredPersonas = [...newPersonas];
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
          const persona: IPersonaProps = new Person({
            Id: -1,
            Title: person.DisplayText,
            EMail: person.EntityData.Email ? person.EntityData.Email : "",
          });
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
      props.updatePeople(items as IPerson[]);
    } else {
      props.updatePeople([]);
    }
  };

  return (
    <NormalPeoplePicker
      onResolveSuggestions={onFilterChanged}
      getTextFromItem={getTextFromItem}
      pickerSuggestionsProps={suggestionProps}
      className={"ms-PeoplePicker"}
      key={"controlled"}
      selectionAriaLabel={"Selected users"}
      removeButtonAriaLabel={"Remove"}
      selectedItems={selectedItems}
      onChange={onItemsChange}
      inputProps={{
        "aria-label": props.ariaLabel,
      }}
      componentRef={picker}
      resolveDelay={300}
      disabled={props.readOnly}
      itemLimit={props.itemLimit ? props.itemLimit : 1}
      // TODO: Look into adding suggestions based on cache
      //onEmptyResolveSuggestions={getEmptyResolveSuggestions}
      //onRemoveSuggestion={removeSuggestion}
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

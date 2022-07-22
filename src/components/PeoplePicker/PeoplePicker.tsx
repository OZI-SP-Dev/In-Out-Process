import React from "react";
import { IPersonaProps } from "@fluentui/react/lib/Persona";
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

export interface SPPersona extends IPersonaProps {
  AccountName?: string;
  Department?: string;
  Email?: string;
  SPUserId?: number;
}

interface IPeoplePickerProps {
  /** Required - The text used to label this people picker for screenreaders */
  ariaLabel: string;
  /** Optional - The people to pre-populate the People Picker with */
  defaultValue?: SPPersona[];
  readOnly?: boolean;
  required?: boolean;
  /** Optional - Limit the People Picker to only allow selection of specific number -- Defaults to 1 */
  itemLimit?: number;
  updatePeople: (p: SPPersona[]) => void;
}

export const PeoplePicker: React.FunctionComponent<IPeoplePickerProps> = (
  props
) => {
  const [currentSelectedItems, setCurrentSelectedItems] = React.useState<
    IPersonaProps[]
  >([]);
  const [peopleList] = React.useState<IPersonaProps[]>(people);

  React.useEffect(() => {
    let personas: SPPersona[] = [];
    if (props.defaultValue) {
      personas = [...props.defaultValue];
    }
    setCurrentSelectedItems(personas);
  }, [props.defaultValue]);

  const picker = React.useRef<IBasePicker<IPersonaProps>>(null);

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
      props.updatePeople(items);
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
      selectedItems={currentSelectedItems}
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

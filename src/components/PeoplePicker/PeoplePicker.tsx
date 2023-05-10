import { FunctionComponent } from "react";
import { IPersonaProps } from "@fluentui/react/lib/Persona";
import { IPerson, Person } from "api/UserApi";
import {
  IBasePickerSuggestionsProps,
  NormalPeoplePicker,
} from "@fluentui/react/lib/Pickers";
import { spWebContext } from "providers/SPWebContext";
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

  const onFilterChanged = async (
    filterText: string,
    currentPersonas?: IPersonaProps[],
    limitResults?: number,
    _selectedPersonas?: IPersonaProps[] | undefined
  ): Promise<IPersonaProps[]> => {
    if (filterText) {
      let filteredPersonas: IPersonaProps[];

      const results = await spWebContext.profiles.clientPeoplePickerSearchUser({
        AllowEmailAddresses: false,
        AllowMultipleEntities: false,
        MaximumEntitySuggestions: limitResults ? limitResults : 25,
        QueryString: filterText,
        PrincipalSource: 15, // PrincipalSource.All -- Cannot use the enum directly from PnPJS due to it being an ambient enum
        PrincipalType: 1, // PrincipalType.User -- Cannot use the enum directly from PnPJS due to it being an ambient enum
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
      return filteredPersonas;
    } else {
      return [];
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
      resolveDelay={300}
      disabled={props.readOnly}
      itemLimit={props.itemLimit ? props.itemLimit : 1}
      // TODO: Look into adding suggestions based on cache
      //onEmptyResolveSuggestions={getEmptyResolveSuggestions}
      //onRemoveSuggestion={removeSuggestion}
    />
  );
};

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

function getTextFromItem(persona: IPersonaProps): string {
  return persona.text as string;
}

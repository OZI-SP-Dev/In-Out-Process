import React from 'react';
import { IPersonaProps } from '@fluentui/react/lib/Persona';
import { IBasePickerSuggestionsProps, NormalPeoplePicker } from '@fluentui/react/lib/Pickers';
import { people } from '@fluentui/example-data';

const suggestionProps: IBasePickerSuggestionsProps = {
  suggestionsHeaderText: 'Suggested People',
  mostRecentlyUsedHeaderText: 'Suggested Contacts',
  noResultsFoundText: 'No results found',
  loadingText: 'Loading',
  showRemoveButtons: true,
  suggestionsAvailableAlertText: 'People Picker Suggestions available',
  suggestionsContainerAriaLabel: 'Suggested contacts',
};

export const PeoplePicker: React.FunctionComponent<any> = (props) => {
  const [currentSelectedItems, setCurrentSelectedItems] = React.useState<IPersonaProps[]>([]);
  const [peopleList] = React.useState<IPersonaProps[]>(people);

  const picker = React.useRef(null);

  const onFilterChanged = (
    filterText: string,
    currentPersonas?: IPersonaProps[],
    limitResults?: number,
    selectedPersonas?: IPersonaProps[] | undefined
  ): IPersonaProps[] | Promise<IPersonaProps[]>  => {
    if (filterText) {
      let filteredPersonas: IPersonaProps[] = filterPersonasByText(filterText);
      if(currentPersonas)
      {
        filteredPersonas = removeDuplicates(filteredPersonas, currentPersonas);
      }
      filteredPersonas = limitResults ? filteredPersonas.slice(0, limitResults) : filteredPersonas;
      return filterPromise(filteredPersonas);
    } else {
      return [];
    }
  };

  const filterPersonasByText = (filterText: string): IPersonaProps[] => {
    return peopleList.filter(item => doesTextStartWith(item.text as string, filterText));
  };

  const filterPromise = (personasToReturn: IPersonaProps[]): IPersonaProps[] | Promise<IPersonaProps[]> => {
    if (process.env.NODE_ENV === 'development') {
      return convertResultsToPromise(personasToReturn);
    } else {
      return personasToReturn;
    }
  };

  const onItemsChange = (items: IPersonaProps[] | undefined): void => {
    if(items)
    {
      setCurrentSelectedItems(items);
    }
  };

  const controlledItems = [];
  for (let i = 0; i < 5; i++) {
    const item = peopleList[i];
    if (currentSelectedItems!.indexOf(item) === -1) {
      controlledItems.push(peopleList[i]);
    }
  }

  return (
    <div>
      <div>
        <NormalPeoplePicker
          // eslint-disable-next-line react/jsx-no-bind
          onResolveSuggestions={onFilterChanged}
          getTextFromItem={getTextFromItem}
          pickerSuggestionsProps={suggestionProps}
          className={'ms-PeoplePicker'}
          key={'controlled'}
          selectionAriaLabel={'Selected contacts'}
          removeButtonAriaLabel={'Remove'}
          selectedItems={currentSelectedItems}
          // eslint-disable-next-line react/jsx-no-bind
          onChange={onItemsChange}
          inputProps={{
            onBlur: (ev: React.FocusEvent<HTMLInputElement>) => console.log('onBlur called'),
            onFocus: (ev: React.FocusEvent<HTMLInputElement>) => console.log('onFocus called'),
            'aria-label': 'Contacts',
          }}
          componentRef={picker}
          resolveDelay={300}
          disabled={false}
        />
      </div>
    </div>
  );
};

function doesTextStartWith(text: string, filterText: string): boolean {
  return text.toLowerCase().indexOf(filterText.toLowerCase()) === 0;
}

function removeDuplicates(personas: IPersonaProps[], possibleDupes: IPersonaProps[]) {
  return personas.filter(persona => !listContainsPersona(persona, possibleDupes));
}

function listContainsPersona(persona: IPersonaProps, personas: IPersonaProps[]) {
  if (!personas || !personas.length || personas.length === 0) {
    return false;
  }
  return personas.filter(item => item.text === persona.text).length > 0;
}

// This function is used in development to set a 1 second delay on the results from the PeoplePicker to simulate an API call to SharePoint
function convertResultsToPromise(results: IPersonaProps[]): Promise<IPersonaProps[]> {
  return new Promise<IPersonaProps[]>((resolve, reject) => setTimeout(() => resolve(results), 1000));
}

function getTextFromItem(persona: IPersonaProps): string {
  return persona.text as string;
}

// No master list backs the Event Type (event family type), and no earlier
// wizard step collects it — the old (STORY-063-deleted) single-page form had
// its own picker, and nothing in Steps 1-4 replaced it. Same "dropdown +
// custom" convention every other free-text field in this app uses. Shared by
// the Review step and the One Day Event template (DEV-11).
export const EVENT_FAMILY_TYPE_PRESETS = ['Wedding', 'Engagement', 'Corporate', 'Birthday'];
export const CUSTOM_EVENT_FAMILY_TYPE_OPTION = 'Custom…';

export interface EventFamilyTypeSelection {
  option: string;
  custom: string;
}

// A stored type back into the Review step's select + custom-text pair.
export const toEventFamilyTypeOption = (eventFamilyType: string): EventFamilyTypeSelection => {
  if (!eventFamilyType) {
    return { option: '', custom: '' };
  }
  if (EVENT_FAMILY_TYPE_PRESETS.includes(eventFamilyType)) {
    return { option: eventFamilyType, custom: '' };
  }
  return { option: CUSTOM_EVENT_FAMILY_TYPE_OPTION, custom: eventFamilyType };
};

import { Autocomplete, Chip, TextField, createFilterOptions } from '@mui/material';
import { chipStyles, searchFieldStyles } from './menu-item-search.styles';

// id === '' marks a chip that hasn't been resolved to a real Menu Item yet
// — the user typed a name with no match and picked "Add '<name>' as a new
// menu item" (this story's own AC). It's submitted to STORY-032's
// create/update endpoint as `{ name }`, which finds-or-creates it
// server-side; this component never calls POST /menu-items itself.
export interface MenuItemChip {
  id: string;
  name: string;
}

const filter = createFilterOptions<MenuItemChip>();

// De-dupes by id for a resolved Menu Item, or by case-insensitive name for
// a still-pending one — this story's own edge case, decided as: de-dupe,
// not allow. A Meal Item conceptually needs each distinct Menu Item
// referenced at most once; a duplicate ref would just be a meaningless
// extra entry with no quantity field to distinguish it.
const isSameChip = (a: MenuItemChip, b: MenuItemChip): boolean =>
  a.id !== '' && b.id !== '' ? a.id === b.id : a.name.trim().toLowerCase() === b.name.trim().toLowerCase();

interface MenuItemSearchProps {
  // The full known Menu Item master list — fetched once by the caller
  // (ItemsSection) rather than re-queried per keystroke here. Aaradhya's
  // master list is small at its stated scale (~15 users, one property),
  // so a single fetch that's filtered client-side both drives the search
  // box and resolves an already-attached item's stored ids back to
  // display names (GET /menu-items has no "by id" lookup to do that
  // otherwise).
  options: MenuItemChip[];
  value: MenuItemChip[];
  onChange: (chips: MenuItemChip[]) => void;
}

const MenuItemSearch = ({ options, value, onChange }: MenuItemSearchProps) => (
  <Autocomplete<MenuItemChip, true, false, false>
    multiple
    filterSelectedOptions
    options={options}
    value={value}
    onChange={(_event, newValue) => {
      const deduped: MenuItemChip[] = [];
      for (const item of newValue) {
        if (!deduped.some((existing) => isSameChip(existing, item))) {
          deduped.push(item);
        }
      }
      onChange(deduped);
    }}
    getOptionLabel={(option) => option.name}
    isOptionEqualToValue={isSameChip}
    filterOptions={(fetchedOptions, params) => {
      const filtered = filter(fetchedOptions, params);
      const typed = params.inputValue.trim();
      const exactMatch = fetchedOptions.some((option) => option.name.trim().toLowerCase() === typed.toLowerCase());
      if (typed !== '' && !exactMatch) {
        filtered.push({ id: '', name: typed });
      }
      return filtered;
    }}
    renderOption={(props, option) => (
      <li {...props} key={option.id || `new-${option.name}`}>
        {option.id === '' ? `Add "${option.name}" as a new menu item` : option.name}
      </li>
    )}
    renderValue={(selectedValues, getItemProps) =>
      selectedValues.map((option, index) => {
        const { key, ...itemProps } = getItemProps({ index });
        return <Chip key={key} label={option.name} sx={chipStyles} {...itemProps} />;
      })
    }
    renderInput={(params) => (
      <TextField {...params} label="Menu items" placeholder="Search or add a menu item" sx={searchFieldStyles} />
    )}
  />
);

export default MenuItemSearch;

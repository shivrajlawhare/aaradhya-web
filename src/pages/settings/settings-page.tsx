import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { Box, Button, CircularProgress, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { tsr } from '../../api/client';
import AddItemForm, { type AddItemFormSubmitValues } from './add-item-form';
import EditItemDialog, { type EditItemSubmitValues } from './edit-item-dialog';
import MasterListCardList from './master-list-card-list';
import MasterListTable from './master-list-table';
import SectionChipRow from './section-chip-row';
import SectionNavList from './section-nav-list';
import {
  desktopContentStyles,
  desktopPanelStyles,
  mobileSectionStyles,
  pageStyles,
  panelHeaderStyles,
} from './settings-page.styles';
import { SECTIONS, type MasterListRow, type SectionId } from './settings-sections';

// Shared by every create/update mutation below — each route's own 409/404
// apiErrorSchema carries { error: { message } }; anything else (a network
// failure, a 400) falls back to a generic message, same "one place this
// narrowing lives" reasoning NewUserForm's own onError already established,
// just reused here across seven mutations instead of one.
const errorMessageFrom = (error: unknown): string => {
  if (!(error instanceof Error) && typeof error === 'object' && error !== null && 'body' in error) {
    const body = (error as { body?: { error?: { message?: string } } }).body;
    if (body?.error?.message) {
      return body.error.message;
    }
  }
  return 'Something went wrong. Please try again.';
};

const SettingsPage = () => {
  const theme = useTheme();
  // 900px — MUI's own `md` breakpoint, matching AppShell's (STORY-053) and
  // every other responsive screen in this app.
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const [selectedSectionId, setSelectedSectionId] = useState<SectionId>('venues');
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [addFormResetKey, setAddFormResetKey] = useState(0);
  const [addError, setAddError] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<MasterListRow | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const section = SECTIONS.find((candidate) => candidate.id === selectedSectionId);
  if (!section) {
    throw new Error(`Unknown Settings section: ${String(selectedSectionId)}`);
  }

  const venuesQuery = tsr.listVenues.useQuery({ queryKey: ['venues'] });
  const eventTypesQuery = tsr.listEventTypes.useQuery({ queryKey: ['event-types'] });
  const roomTypesQuery = tsr.listRoomTypes.useQuery({ queryKey: ['room-types'] });
  const menuItemsQuery = tsr.listMenuItems.useQuery({ queryKey: ['menu-items'], queryData: { query: {} } });

  const refetchSection = (id: SectionId) => {
    if (id === 'venues') {
      venuesQuery.refetch();
    } else if (id === 'eventTypes') {
      eventTypesQuery.refetch();
    } else if (id === 'roomTypes') {
      roomTypesQuery.refetch();
    } else {
      menuItemsQuery.refetch();
    }
  };

  const handleCreateSuccess = (id: SectionId) => {
    setAddError(null);
    setIsAddFormOpen(false);
    setAddFormResetKey((key) => key + 1);
    refetchSection(id);
  };

  const createVenueMutation = tsr.createVenue.useMutation({
    onSuccess: () => handleCreateSuccess('venues'),
    onError: (error) => setAddError(errorMessageFrom(error)),
  });
  const createEventTypeMutation = tsr.createEventType.useMutation({
    onSuccess: () => handleCreateSuccess('eventTypes'),
    onError: (error) => setAddError(errorMessageFrom(error)),
  });
  const createRoomTypeMutation = tsr.createRoomType.useMutation({
    onSuccess: () => handleCreateSuccess('roomTypes'),
    onError: (error) => setAddError(errorMessageFrom(error)),
  });
  const createMenuItemMutation = tsr.createMenuItem.useMutation({
    onSuccess: () => handleCreateSuccess('menuItems'),
    onError: (error) => setAddError(errorMessageFrom(error)),
  });

  const updateVenueMutation = tsr.updateVenue.useMutation({
    onSuccess: () => refetchSection('venues'),
    onError: (error) => setEditError(errorMessageFrom(error)),
  });
  const updateEventTypeMutation = tsr.updateEventType.useMutation({
    onSuccess: () => refetchSection('eventTypes'),
    onError: (error) => setEditError(errorMessageFrom(error)),
  });
  const updateRoomTypeMutation = tsr.updateRoomType.useMutation({
    onSuccess: () => refetchSection('roomTypes'),
    onError: (error) => setEditError(errorMessageFrom(error)),
  });

  const isInitialLoading =
    venuesQuery.isPending || eventTypesQuery.isPending || roomTypesQuery.isPending || menuItemsQuery.isPending;

  const handleSelectSection = (id: SectionId) => {
    setSelectedSectionId(id);
    setIsAddFormOpen(false);
    setAddError(null);
    setEditingRow(null);
    setEditError(null);
  };

  const handleAdd = (values: AddItemFormSubmitValues) => {
    setAddError(null);
    switch (selectedSectionId) {
      case 'venues':
        createVenueMutation.mutate({ body: { name: values.name, defaultVenueCost: values.cost ?? 0 } });
        break;
      case 'eventTypes':
        createEventTypeMutation.mutate({ body: { name: values.name } });
        break;
      case 'roomTypes':
        createRoomTypeMutation.mutate({ body: { name: values.name, defaultTariff: values.cost ?? 0 } });
        break;
      case 'menuItems':
        createMenuItemMutation.mutate({ body: { name: values.name, defaultCostPerPlate: values.cost } });
        break;
    }
  };

  // Deactivating/reactivating here only ever PATCHes the master-list
  // document itself — nothing about that request touches any Event or
  // Session. A Session's Venue/Room Type field was already copied (name +
  // cost) at selection time (STORY-061's own model comments), not stored as
  // a live reference, so an in-progress wizard elsewhere has nothing to
  // react to: see tests/pages/settings-page.test.tsx's own "does not touch
  // Event/Session data" case for this story's own edge case, made explicit
  // rather than left as an assumption.
  const handleToggleActive = (row: MasterListRow) => {
    const body = { active: !row.active };
    if (selectedSectionId === 'venues') {
      updateVenueMutation.mutate({ params: { id: row.id }, body });
    } else if (selectedSectionId === 'eventTypes') {
      updateEventTypeMutation.mutate({ params: { id: row.id }, body });
    } else if (selectedSectionId === 'roomTypes') {
      updateRoomTypeMutation.mutate({ params: { id: row.id }, body });
    }
    // 'menuItems' is unreachable — supportsStatus is false for that
    // section, so no Switch ever calls this.
  };

  const handleEdit = (row: MasterListRow) => {
    setEditError(null);
    setEditingRow(row);
  };

  const handleEditSave = (values: EditItemSubmitValues) => {
    if (!editingRow) {
      return;
    }
    setEditError(null);
    const onSuccess = () => setEditingRow(null);
    if (selectedSectionId === 'venues') {
      updateVenueMutation.mutate(
        { params: { id: editingRow.id }, body: { name: values.name, defaultVenueCost: values.cost ?? 0 } },
        { onSuccess },
      );
    } else if (selectedSectionId === 'eventTypes') {
      updateEventTypeMutation.mutate({ params: { id: editingRow.id }, body: { name: values.name } }, { onSuccess });
    } else if (selectedSectionId === 'roomTypes') {
      updateRoomTypeMutation.mutate(
        { params: { id: editingRow.id }, body: { name: values.name, defaultTariff: values.cost ?? 0 } },
        { onSuccess },
      );
    }
  };

  if (isInitialLoading) {
    return (
      <Box sx={pageStyles}>
        <CircularProgress aria-label="Loading settings" />
      </Box>
    );
  }

  const rows: MasterListRow[] = (() => {
    if (selectedSectionId === 'venues') {
      return (venuesQuery.data?.body ?? []).map((venue) => ({
        id: venue.id,
        name: venue.name,
        cost: venue.defaultVenueCost,
        active: venue.active,
      }));
    }
    if (selectedSectionId === 'eventTypes') {
      return (eventTypesQuery.data?.body ?? []).map((eventType) => ({
        id: eventType.id,
        name: eventType.name,
        cost: null,
        active: eventType.active,
      }));
    }
    if (selectedSectionId === 'roomTypes') {
      return (roomTypesQuery.data?.body ?? []).map((roomType) => ({
        id: roomType.id,
        name: roomType.name,
        cost: roomType.defaultTariff,
        active: roomType.active,
      }));
    }
    // menuItems — no `active` field on the backend model; always true and
    // never rendered (section.supportsStatus is false).
    return (menuItemsQuery.data?.body ?? []).map((menuItem) => ({
      id: menuItem.id,
      name: menuItem.name,
      cost: menuItem.defaultCostPerPlate,
      active: true,
    }));
  })();

  const isAdding =
    selectedSectionId === 'venues'
      ? createVenueMutation.isPending
      : selectedSectionId === 'eventTypes'
        ? createEventTypeMutation.isPending
        : selectedSectionId === 'roomTypes'
          ? createRoomTypeMutation.isPending
          : createMenuItemMutation.isPending;

  const isMutatingStatus =
    selectedSectionId === 'venues'
      ? updateVenueMutation.isPending
      : selectedSectionId === 'eventTypes'
        ? updateEventTypeMutation.isPending
        : selectedSectionId === 'roomTypes'
          ? updateRoomTypeMutation.isPending
          : false;

  const addForm = isAddFormOpen && (
    <AddItemForm
      key={`${selectedSectionId}-${addFormResetKey}`}
      section={section}
      isPending={isAdding}
      errorMessage={addError}
      onSubmit={handleAdd}
    />
  );

  const editDialog = editingRow && (
    <EditItemDialog
      section={section}
      row={editingRow}
      isPending={isMutatingStatus}
      errorMessage={editError}
      onClose={() => setEditingRow(null)}
      onSave={handleEditSave}
    />
  );

  if (isDesktop) {
    return (
      <Box sx={pageStyles}>
        <Box sx={desktopContentStyles}>
          <SectionNavList selected={selectedSectionId} onSelect={handleSelectSection} />
          <Box sx={desktopPanelStyles}>
            <Box sx={panelHeaderStyles}>
              <Typography variant="titleM" component="h2">
                {section.label}
              </Typography>
              {/* "Add {Section}" (singular), not just "Add" — AddItemForm's
                  own submit button (below, once opened) is labeled plain
                  "Add"; a same-named toggle button would collide with it by
                  accessible name while both are on screen. */}
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsAddFormOpen((open) => !open)}>
                Add {section.label.replace(/s$/, '')}
              </Button>
            </Box>
            {addForm}
            <MasterListTable
              section={section}
              rows={rows}
              isMutating={isMutatingStatus}
              onToggleActive={handleToggleActive}
              onEdit={handleEdit}
            />
          </Box>
        </Box>
        {editDialog}
      </Box>
    );
  }

  return (
    <Box sx={pageStyles}>
      <SectionChipRow selected={selectedSectionId} onSelect={handleSelectSection} />
      <Box sx={mobileSectionStyles}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          fullWidth
          onClick={() => setIsAddFormOpen((open) => !open)}
        >
          Add {section.label.replace(/s$/, '')}
        </Button>
        {addForm}
        <MasterListCardList
          section={section}
          rows={rows}
          isMutating={isMutatingStatus}
          onToggleActive={handleToggleActive}
          onEdit={handleEdit}
        />
      </Box>
      {editDialog}
    </Box>
  );
};

export default SettingsPage;

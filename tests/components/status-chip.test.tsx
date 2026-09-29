import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StatusChip from '../../src/components/ui/status-chip';
import { EventStatus } from '../../src/contract';
import AppThemeProvider from '../../src/theme/app-theme-provider';
import { paletteVar } from '../../src/theme/tokens';

describe('StatusChip', () => {
  it.each([
    [EventStatus.Tentative, 'tentative'],
    [EventStatus.Confirmed, 'confirmed'],
    [EventStatus.Completed, 'completed'],
    [EventStatus.Cancelled, 'cancelled'],
  ])('renders %s in its palette.status pair with a leading dot', (status, key) => {
    render(
      <AppThemeProvider>
        <StatusChip status={status} />
      </AppThemeProvider>
    );

    const chip = screen.getByText(status).closest('.MuiChip-root');
    expect(chip).toHaveStyle({
      backgroundColor: paletteVar(`status-${key}-bg`),
      color: paletteVar(`status-${key}-fg`),
    });
    expect(chip?.querySelector('.MuiChip-icon')).toHaveAttribute('aria-hidden', 'true');
  });
});

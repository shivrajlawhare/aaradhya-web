import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PageLoader from '../../src/components/ui/page-loader';
import AppThemeProvider from '../../src/theme/app-theme-provider';

describe('PageLoader', () => {
  it('announces the caller’s caption as a status', () => {
    render(
      <AppThemeProvider>
        <PageLoader caption="Loading events…" />
      </AppThemeProvider>
    );

    expect(screen.getByRole('status')).toHaveTextContent('Loading events…');
  });

  it('keeps the spinner and logo out of the accessibility tree', () => {
    render(
      <AppThemeProvider>
        <PageLoader caption="Loading events…" />
      </AppThemeProvider>
    );

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(document.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
  });
});

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { COUNT_UP_DURATION_MS, useCountUp } from '../../src/pages/dashboard/use-count-up';
import { mockMatchMedia } from '../support/match-media';

afterEach(() => {
  vi.useRealTimers();
});

describe('useCountUp', () => {
  it('shows the final value straight away under prefers-reduced-motion', () => {
    mockMatchMedia(true);

    const { result } = renderHook(() => useCountUp(12));

    expect(result.current).toBe(12);
  });

  it('counts up from 0 to the value over 600 ms otherwise', () => {
    mockMatchMedia(false);
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });

    const { result } = renderHook(() => useCountUp(12));
    expect(result.current).toBe(0);

    act(() => {
      vi.advanceTimersByTime(COUNT_UP_DURATION_MS / 2);
    });
    expect(result.current).toBeGreaterThan(0);
    expect(result.current).toBeLessThan(12);

    act(() => {
      vi.advanceTimersByTime(COUNT_UP_DURATION_MS);
    });
    expect(result.current).toBe(12);
  });
});

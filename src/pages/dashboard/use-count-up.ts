import { useEffect, useState } from 'react';
import { useMediaQuery } from '@mui/material';

export const COUNT_UP_DURATION_MS = 600;

const easeOutCubic = (progress: number) => 1 - (1 - progress) ** 3;

// Counts a stat tile from 0 up to its value over 600 ms. Under
// prefers-reduced-motion the value shows straight away.
export const useCountUp = (target: number): number => {
  const isReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)', { noSsr: true });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (isReducedMotion) {
      return undefined;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / COUNT_UP_DURATION_MS);
      setValue(Math.round(target * easeOutCubic(progress)));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, isReducedMotion]);

  if (isReducedMotion) {
    return target;
  }
  return value;
};

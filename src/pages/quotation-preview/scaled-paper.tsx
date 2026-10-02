import { type ReactNode, useLayoutEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { PAPER_WIDTH } from './quotation-document.styles';
import { scaledPaperFrameStyles, scaledPaperStyles } from './scaled-paper.styles';

interface ScaledPaperProps {
  children: ReactNode;
}

// The fixed-width A4 sheet, scaled down (never reflowed) to fit a narrow
// screen — the mobile preview's "Pinch to zoom" paper (Figma UI-21). CSS
// `zoom` shrinks the layout box too, so nothing below leaves a gap.
const ScaledPaper = ({ children }: ScaledPaperProps) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame || typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        setScale(Math.min(1, entry.contentRect.width / PAPER_WIDTH));
      }
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return (
    <Box ref={frameRef} sx={scaledPaperFrameStyles}>
      <Box sx={scaledPaperStyles(scale)}>{children}</Box>
    </Box>
  );
};

export default ScaledPaper;

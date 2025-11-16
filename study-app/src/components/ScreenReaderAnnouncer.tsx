import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';

interface ScreenReaderAnnouncerProps {
  message: string;
  ariaLive?: 'polite' | 'assertive';
}

export const ScreenReaderAnnouncer: React.FC<ScreenReaderAnnouncerProps> = ({
  message,
  ariaLive = 'polite'
}) => {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (message) {
      // Clear and then set to ensure announcement
      setAnnouncement('');
      const timer = setTimeout(() => {
        setAnnouncement(message);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <Box
      role="status"
      aria-live={ariaLive}
      aria-atomic="true"
      sx={{
        position: 'absolute',
        left: '-10000px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
    >
      {announcement}
    </Box>
  );
};

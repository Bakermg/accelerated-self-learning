import React from 'react';
import { Box, Card, CardContent, Skeleton } from '@mui/material';

export const QuizLoadingSkeleton: React.FC = () => {
  return (
    <Box>
      {[1, 2, 3].map((index) => (
        <Card key={index} sx={{ mb: 3, borderRadius: 3 }} elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Skeleton variant="rectangular" width={50} height={32} sx={{ borderRadius: 2 }} />
            </Box>
            <Skeleton variant="text" width="90%" height={40} sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

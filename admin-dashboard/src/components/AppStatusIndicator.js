import React from 'react';
import {
  Box,
  Chip,
  Typography,
  Paper,
  Divider,
} from '@mui/material';
import {
  Circle,
  Apps,
  CheckCircle,
} from '@mui/icons-material';
import { useApp } from '../context/AppContext';

const AppStatusIndicator = ({ variant = 'full' }) => {
  const { appConfig, selectedApp, getAppDisplayName } = useApp();

  if (variant === 'minimal') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Circle 
          sx={{ 
            fontSize: 8, 
            color: appConfig?.color || '#1976d2' 
          }} 
        />
        <Typography variant="caption" color="textSecondary">
          {appConfig?.name || 'Unknown'}
        </Typography>
      </Box>
    );
  }

  if (variant === 'chip') {
    return (
      <Chip
        icon={<CheckCircle />}
        label={`Active: ${getAppDisplayName()}`}
        sx={{
          backgroundColor: appConfig?.color || '#1976d2',
          color: 'white',
          fontWeight: 'bold',
          '& .MuiChip-icon': {
            color: 'white',
          },
        }}
      />
    );
  }

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 2, 
        backgroundColor: `${appConfig?.color || '#1976d2'}08`,
        border: `1px solid ${appConfig?.color || '#1976d2'}30`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Apps sx={{ color: appConfig?.color || '#1976d2' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          Current Application
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 1 }} />
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            App Name:
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {appConfig?.displayName || 'Unknown'}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            Package ID:
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
            {selectedApp}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            Status:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
              Active
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default AppStatusIndicator;

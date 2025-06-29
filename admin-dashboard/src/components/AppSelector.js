import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
  Chip,
  Avatar,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  ExpandMore,
  School,
  Language,
  CheckCircle,
} from '@mui/icons-material';
import { useApp } from '../context/AppContext';

const AppSelector = () => {
  const {
    selectedApp,
    appConfig,
    supportedApps,
    switchApp,
    error,
    clearError,
    getAppDisplayName,
    getAppColor,
  } = useApp();

  const [anchorEl, setAnchorEl] = useState(null);
  const [switchError, setSwitchError] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAppSwitch = async (appId) => {
    if (appId === selectedApp) {
      handleClose();
      return;
    }

    try {
      const success = switchApp(appId);
      if (success) {
        handleClose();
        // Show success message
        setSwitchError(null);
        // Optionally reload the page to refresh all data
        window.location.reload();
      } else {
        setSwitchError('Failed to switch app');
      }
    } catch (err) {
      setSwitchError(err.message || 'Failed to switch app');
    }
  };

  const handleCloseError = () => {
    setSwitchError(null);
    clearError();
  };

  const getAppIcon = (appId) => {
    switch (appId) {
      case 'com.gumbo.learning':
        return <School />;
      case 'com.gumbo.english':
        return <Language />;
      default:
        return <School />;
    }
  };

  const getAppAvatarColor = (appId) => {
    return getAppColor(appId);
  };

  return (
    <>
      <Button
        variant="outlined"
        onClick={handleClick}
        endIcon={<ExpandMore />}
        sx={{
          borderColor: appConfig?.color || '#1976d2',
          color: appConfig?.color || '#1976d2',
          '&:hover': {
            borderColor: appConfig?.color || '#1976d2',
            backgroundColor: `${appConfig?.color || '#1976d2'}10`,
          },
          textTransform: 'none',
          minWidth: 200,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            sx={{
              width: 24,
              height: 24,
              bgcolor: appConfig?.color || '#1976d2',
              fontSize: 12,
            }}
          >
            {getAppIcon(selectedApp)}
          </Avatar>
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {appConfig?.name || 'Unknown'}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {appConfig?.description || ''}
            </Typography>
          </Box>
        </Box>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            minWidth: 280,
            mt: 1,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Select Application
          </Typography>
        </Box>
        <Divider />
        
        {Object.values(supportedApps).map((app) => (
          <MenuItem
            key={app.id}
            onClick={() => handleAppSwitch(app.id)}
            selected={app.id === selectedApp}
            sx={{
              py: 1.5,
              '&.Mui-selected': {
                backgroundColor: `${app.color}15`,
                '&:hover': {
                  backgroundColor: `${app.color}25`,
                },
              },
            }}
          >
            <ListItemIcon>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: app.color,
                  fontSize: 16,
                }}
              >
                {getAppIcon(app.id)}
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {app.displayName}
                  </Typography>
                  {app.id === selectedApp && (
                    <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                  )}
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    {app.description}
                  </Typography>
                  <Chip
                    label={app.id}
                    size="small"
                    variant="outlined"
                    sx={{
                      mt: 0.5,
                      fontSize: '0.7rem',
                      height: 20,
                      borderColor: app.color,
                      color: app.color,
                    }}
                  />
                </Box>
              }
            />
          </MenuItem>
        ))}
      </Menu>

      {/* Error Snackbar */}
      <Snackbar
        open={Boolean(switchError || error)}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {switchError || error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AppSelector;

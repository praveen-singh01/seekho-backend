import React, { createContext, useContext } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useApp } from './AppContext';

const ThemeContext = createContext();

export const AppThemeProvider = ({ children }) => {
  const { appConfig } = useApp();

  // Create dynamic theme based on selected app
  const theme = createTheme({
    palette: {
      primary: {
        main: appConfig?.color || '#1976d2',
        light: appConfig?.color ? `${appConfig.color}33` : '#42a5f5',
        dark: appConfig?.color ? `${appConfig.color}cc` : '#1565c0',
      },
      secondary: {
        main: '#dc004e',
      },
      background: {
        default: '#f5f5f5',
        paper: '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          contained: {
            backgroundColor: appConfig?.color || '#1976d2',
            '&:hover': {
              backgroundColor: appConfig?.color ? `${appConfig.color}dd` : '#1565c0',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          filled: {
            backgroundColor: appConfig?.color || '#1976d2',
            color: '#ffffff',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: appConfig?.color || '#1976d2',
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  return context;
};

export default ThemeContext;

import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AppContext = createContext();

// Supported apps configuration
const SUPPORTED_APPS = {
  'com.gumbo.learning': {
    id: 'com.gumbo.learning',
    name: 'Seekho',
    displayName: 'Seekho Learning Platform',
    color: '#1976d2',
    description: 'Original learning platform'
  },
  'com.gumbo.english': {
    id: 'com.gumbo.english',
    name: 'Bolo',
    displayName: 'Bolo English Learning',
    color: '#2e7d32',
    description: 'English learning platform'
  }
};

const DEFAULT_APP = 'com.gumbo.learning';

const initialState = {
  selectedApp: localStorage.getItem('selectedApp') || DEFAULT_APP,
  appConfig: SUPPORTED_APPS[localStorage.getItem('selectedApp') || DEFAULT_APP],
  supportedApps: SUPPORTED_APPS,
  loading: false,
  error: null,
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'SWITCH_APP':
      const newApp = action.payload;
      const newConfig = SUPPORTED_APPS[newApp];
      
      // Persist to localStorage
      localStorage.setItem('selectedApp', newApp);
      
      return {
        ...state,
        selectedApp: newApp,
        appConfig: newConfig,
        error: null,
      };
    case 'RESET_APP':
      localStorage.setItem('selectedApp', DEFAULT_APP);
      return {
        ...state,
        selectedApp: DEFAULT_APP,
        appConfig: SUPPORTED_APPS[DEFAULT_APP],
        error: null,
      };
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    // Validate stored app on mount
    const storedApp = localStorage.getItem('selectedApp');
    if (storedApp && !SUPPORTED_APPS[storedApp]) {
      console.warn('Invalid stored app, resetting to default');
      dispatch({ type: 'RESET_APP' });
    }
  }, []);

  const switchApp = (appId) => {
    if (!SUPPORTED_APPS[appId]) {
      dispatch({
        type: 'SET_ERROR',
        payload: `Unsupported app: ${appId}`,
      });
      return false;
    }

    dispatch({
      type: 'SWITCH_APP',
      payload: appId,
    });
    return true;
  };

  const resetApp = () => {
    dispatch({ type: 'RESET_APP' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const isSeekhoApp = () => {
    return state.selectedApp === 'com.gumbo.learning';
  };

  const isBoloApp = () => {
    return state.selectedApp === 'com.gumbo.english';
  };

  const getAppDisplayName = (appId = null) => {
    const id = appId || state.selectedApp;
    return SUPPORTED_APPS[id]?.displayName || 'Unknown App';
  };

  const getAppColor = (appId = null) => {
    const id = appId || state.selectedApp;
    return SUPPORTED_APPS[id]?.color || '#1976d2';
  };

  const value = {
    ...state,
    switchApp,
    resetApp,
    clearError,
    isSeekhoApp,
    isBoloApp,
    getAppDisplayName,
    getAppColor,
    // Helper constants
    SEEKHO_APP_ID: 'com.gumbo.learning',
    BOLO_APP_ID: 'com.gumbo.english',
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;

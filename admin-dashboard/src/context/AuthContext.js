import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('adminToken'),
  isAuthenticated: false,
  loading: true,
  error: null,
};

const authReducer = (state, action) => {
  console.log('AuthContext: Reducer action:', action.type, action.payload);
  switch (action.type) {
    case 'LOGIN_START':
      const loginStartState = {
        ...state,
        loading: true,
        error: null,
      };
      console.log('AuthContext: LOGIN_START state:', loginStartState);
      return loginStartState;
    case 'LOGIN_SUCCESS':
      const loginSuccessState = {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
      console.log('AuthContext: LOGIN_SUCCESS state:', loginSuccessState);
      return loginSuccessState;
    case 'LOGIN_FAILURE':
      const loginFailureState = {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      };
      console.log('AuthContext: LOGIN_FAILURE state:', loginFailureState);
      return loginFailureState;
    case 'LOGOUT':
      const logoutState = {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };
      console.log('AuthContext: LOGOUT state:', logoutState);
      return logoutState;
    case 'SET_LOADING':
      const setLoadingState = {
        ...state,
        loading: action.payload,
      };
      console.log('AuthContext: SET_LOADING state:', setLoadingState);
      return setLoadingState;
    case 'CLEAR_ERROR':
      const clearErrorState = {
        ...state,
        error: null,
      };
      console.log('AuthContext: CLEAR_ERROR state:', clearErrorState);
      return clearErrorState;
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('AuthContext: Initializing auth');
      const token = localStorage.getItem('adminToken');
      const debugLogin = localStorage.getItem('debugLogin');
      console.log('AuthContext: Token from localStorage:', token ? 'exists' : 'not found');
      console.log('AuthContext: Debug login info:', debugLogin);

      if (token) {
        try {
          console.log('AuthContext: Verifying token with backend');
          localStorage.setItem('debugLogin', (debugLogin || '') + '_VERIFYING_' + Date.now());
          // Verify token with backend
          const response = await authService.verifyToken();
          console.log('AuthContext: Token verification response:', response);

          if (response.success) {
            console.log('AuthContext: Token verification successful');
            localStorage.setItem('debugLogin', (debugLogin || '') + '_VERIFIED_SUCCESS_' + Date.now());
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: {
                user: response.data.user,
                token: token,
              },
            });
          } else {
            console.log('AuthContext: Token verification failed, clearing localStorage');
            localStorage.setItem('debugLogin', (debugLogin || '') + '_VERIFIED_FAILED_' + Date.now());
            localStorage.removeItem('adminToken');
            dispatch({ type: 'LOGOUT' });
          }
        } catch (error) {
          console.log('AuthContext: Token verification error, clearing localStorage:', error.message);
          localStorage.setItem('debugLogin', (debugLogin || '') + '_VERIFY_ERROR_' + Date.now());
          localStorage.removeItem('adminToken');
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        console.log('AuthContext: No token found, setting loading to false');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    console.warn('🔥 AuthContext: Starting login process');
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authService.login(credentials);
      console.warn('🔥 AuthContext: Login API response:', response);

      if (response && response.success) {
        console.warn('🔥 AuthContext: Login successful, storing token');
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('debugLogin', 'SUCCESS_' + Date.now());
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: response.data.user,
            token: response.data.token,
          },
        });
        console.warn('🔥 AuthContext: Login state updated successfully');
        return { success: true };
      } else {
        console.warn('🔥 AuthContext: Login failed with response:', response);
        const message = response?.message || 'Login failed';
        dispatch({
          type: 'LOGIN_FAILURE',
          payload: message,
        });
        return { success: false, message };
      }
    } catch (error) {
      console.error('🔥 AuthContext: Login error:', error);
      const message = error.response?.data?.message || error.message || 'Login failed';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: message,
      });
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

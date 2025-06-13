// Utility to clear authentication data
export const clearAuthData = () => {
  localStorage.removeItem('adminToken');
  console.log('Authentication data cleared');
};

// Call this function if you need to reset authentication
// clearAuthData();

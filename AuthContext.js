import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from './firebaseConfig';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        // User is logged in
        setUser(authUser);
      } else {
        // User is logged out
        setUser(null);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    setUser, // You can use this function to update the user data in the context
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

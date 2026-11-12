// src/context/AuthContext.jsx
import { useEffect, useState } from 'react';
import { onAuth } from '../firebase/auth';
import { AuthContext } from './useAuth';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => onAuth(setUser), []);

  return (
    <AuthContext.Provider value={{ user, loading: user === undefined }}>
      {children}
    </AuthContext.Provider>
  );
};

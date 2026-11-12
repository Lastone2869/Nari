import { createContext, useContext } from 'react';

export const AuthContext = createContext({ user: undefined, loading: true });

export const useAuth = () => useContext(AuthContext);

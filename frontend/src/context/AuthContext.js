import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token,   setToken]   = useState(null);
  const [role,    setRole]    = useState(null); // 'garage_owner' | 'customer'
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const savedToken = await AsyncStorage.getItem('token');
        const savedRole  = await AsyncStorage.getItem('role');
        const savedUser  = await AsyncStorage.getItem('user');
        if (savedToken) {
          setToken(savedToken);
          setRole(savedRole);
          setUser(savedUser ? JSON.parse(savedUser) : null);
        }
      } catch (e) {
        console.error('Auth load error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (token, role, user) => {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('role',  role);
    await AsyncStorage.setItem('user',  JSON.stringify(user));
    setToken(token);
    setRole(role);
    setUser(user);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'role', 'user']);
    setToken(null);
    setRole(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, role, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
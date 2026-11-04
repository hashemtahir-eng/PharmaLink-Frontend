import React, { createContext, useContext, useState, useEffect } from 'react';
import { seedData } from '../mockData/seed';
import { expireRequirements } from '../mockData/logic';
const Context = createContext();
const KEY = 'pharmalink-demo-v1';
export function DataProvider({ children }) {
  const [data, setData] = useState(() => {
    try {
      return expireRequirements(JSON.parse(localStorage.getItem(KEY)) || seedData());
    } catch {
      return seedData();
    }
  });
  const [userId, setUserId] = useState(() => localStorage.getItem('pharmalink-session'));
  const [toast, setToast] = useState('');
  // Save before changing React state so a storage failure never pretends to succeed.
  function update(change) {
    try {
      const next = typeof change === 'function' ? change(data) : change;
      localStorage.setItem(KEY, JSON.stringify(next));
      setData(next);
      return true;
    } catch {
      setToast('Browser storage is full. Try a smaller certificate or free browser storage.');
      return false;
    }
  }
  useEffect(() => {
    const timer = setInterval(() => {
      setData((current) => {
        const next = expireRequirements(current);
        if (next !== current) {
          try {
            localStorage.setItem(KEY, JSON.stringify(next));
          } catch {}
          return next;
        }
        return current;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  function login(id) {
    localStorage.setItem('pharmalink-session', id);
    setUserId(id);
  }
  function logout() {
    localStorage.removeItem('pharmalink-session');
    setUserId(null);
  }
  return (
    <Context.Provider
      value={{
        data,
        update,
        user: data.users.find((u) => u.id === userId),
        login,
        logout,
        notify: setToast,
      }}
    >
      {children}
      {toast && (
        <div className="toast" role="status">
          ✓ {toast}
        </div>
      )}
    </Context.Provider>
  );
}
export const useData = () => useContext(Context);

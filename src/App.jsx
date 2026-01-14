import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CharacterProvider } from './components/CharacterContext';
import LoginPage from './components/LoginPage';

// Layouts
import AppLayout from './layouts/AppLayout';
import PublicLayout from './layouts/PublicLayout';

// Pages
import WikiPage from './pages/WikiPage';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('kor35_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Controllo token al mount
    const storedToken = localStorage.getItem('kor35_token');
    if (storedToken) {
      setToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = (newToken) => {
    localStorage.setItem('kor35_token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('kor35_token');
    localStorage.removeItem('kor35_is_staff');
    localStorage.removeItem('kor35_is_master');
    localStorage.removeItem('kor35_last_char_id');
    setToken(null);
    // Non ricarichiamo la pagina brutalmente, lasciamo fare al router
    window.location.href = '/login'; 
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  // Wrapper per fornire il contesto utente solo se c'è il token
  const AuthProvider = ({ children }) => {
    if (!token) return <>{children}</>;
    return (
      <CharacterProvider onLogout={handleLogout}>
        {children}
      </CharacterProvider>
    );
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* --- ROTTE PUBBLICHE --- */}
          <Route path="/" element={<PublicLayout token={token} />}>
            <Route index element={<WikiPage slug="home" />} />
            <Route path="regolamento/:slug" element={<WikiPage />} />
            <Route 
              path="login" 
              element={
                token ? <Navigate to="/app" replace /> : <LoginPage onLogin={handleLoginSuccess} />
              } 
            />
          </Route>

          {/* --- ROTTE APPLICAZIONE (PROTETTE) --- */}
          <Route 
            path="/app/*" 
            element={
              token ? (
                <AppLayout token={token} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
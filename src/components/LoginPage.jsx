import React, { useState } from 'react';
import { registerUser } from '../api'; // Assicurati che questa funzione esista in api.js

const LoginPage = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false); // Toggle Login/Registrazione
  
  // Stato unificato per il form
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: ''
  });

  const [message, setMessage] = useState({ text: '', type: '' }); // Per errori o successi
  const [isLoading, setIsLoading] = useState(false);

  // Gestione cambio input generico
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setIsLoading(true);

    try {
      const response = await fetch('https://www.kor35.it/auth/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            username: formData.username, 
            password: formData.password 
        }),
      });

      if (!response.ok) {
        throw new Error('Credenziali non valide. Riprova.');
      }

      const data = await response.json();

      if (data.token) {
        localStorage.setItem('kor35_token', data.token);
        localStorage.setItem('kor35_is_staff', data.is_staff);
        localStorage.setItem('kor35_is_master', data.is_superuser);
        
        if (typeof onLoginSuccess === 'function') {
            onLoginSuccess(data.token);
        } else {
            console.error("onLoginSuccess non è una funzione!");
        }
      } else {
         throw new Error('Token non ricevuto.');
      }
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setIsLoading(true);

    try {
        // Chiama la funzione di registrazione importata da api.js
        await registerUser(formData);
        
        setMessage({ 
            text: 'Registrazione completata! Il tuo account è in attesa di approvazione da parte dello staff.', 
            type: 'success' 
        });
        // Reset form o torna al login dopo un po' se vuoi
        setTimeout(() => setIsRegistering(false), 3000);
        
    } catch (err) {
        // Gestione errori backend (es. username già esistente)
        let errorMsg = "Errore durante la registrazione.";
        if (err.message) errorMsg = err.message;
        // Se l'API restituisce un oggetto errori JSON complesso, potresti doverlo parsare qui
        setMessage({ text: errorMsg, type: 'error' });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-2xl">
        <h2 className="text-3xl font-bold text-center text-white">
          {isRegistering ? 'Nuovo Account' : 'Login Kor35'}
        </h2>
        
        {message.text && (
          <div className={`p-3 text-sm text-center rounded ${message.type === 'success' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
            {message.text}
          </div>
        )}

        <form className="space-y-4" onSubmit={isRegistering ? handleRegister : handleLogin}>
          
          {/* Campi visibili solo in registrazione */}
          {isRegistering && (
            <>
                <div className="flex gap-2">
                    <div className="w-1/2">
                        <label htmlFor="first_name" className="block text-sm font-medium text-gray-300">Nome</label>
                        <input
                        id="first_name"
                        type="text"
                        value={formData.first_name}
                        onChange={handleChange}
                        required={isRegistering}
                        className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-200 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="w-1/2">
                        <label htmlFor="last_name" className="block text-sm font-medium text-gray-300">Cognome</label>
                        <input
                        id="last_name"
                        type="text"
                        value={formData.last_name}
                        onChange={handleChange}
                        required={isRegistering}
                        className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-200 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
                    <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required={isRegistering}
                    className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-200 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300">Username</label>
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-200 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-200 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 font-bold text-white bg-indigo-600 rounded-md shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50"
          >
            {isLoading ? 'Elaborazione...' : (isRegistering ? 'Registrati' : 'Accedi')}
          </button>
        </form>

        <div className="text-center mt-4">
            <button
                onClick={() => {
                    setIsRegistering(!isRegistering);
                    setMessage({text:'', type:''});
                }}
                className="text-sm text-indigo-400 hover:text-indigo-300 underline bg-transparent border-0 cursor-pointer"
            >
                {isRegistering ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
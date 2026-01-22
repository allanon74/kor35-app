import React, { useState, useCallback, memo } from 'react';
import TessituraList from './TessituraList';
import TessituraEditor from './TessituraEditor';

const TessituraManager = ({ onBack, onLogout }) => {
  const [view, setView] = useState('list'); // 'list' o 'edit'
  const [editingItem, setEditingItem] = useState(null);

  const handleAdd = useCallback(() => {
    setEditingItem(null);
    setView('edit');
  }, []);

  const handleEdit = useCallback((item) => {
    setEditingItem(item);
    setView('edit');
  }, []);

  const handleBackToList = useCallback(() => {
    setEditingItem(null);
    setView('list');
  }, []);

  if (view === 'edit') {
    return (
      <TessituraEditor 
        initialData={editingItem} 
        onBack={handleBackToList} 
        onLogout={onLogout} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <button 
        onClick={onBack}
        className="text-gray-400 hover:text-white flex items-center gap-2 mb-4 transition-colors"
      >
        ← Torna agli Strumenti Master
      </button>
      
      <TessituraList 
        onAdd={handleAdd} 
        onEdit={handleEdit} 
        onLogout={onLogout} 
      />
    </div>
  );
};

export default memo(TessituraManager);
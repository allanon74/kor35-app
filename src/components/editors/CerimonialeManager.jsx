import React, { useState, useCallback, memo } from 'react';
import CerimonialeList from './CerimonialeList';
import CerimonialeEditor from './CerimonialeEditor';

const CerimonialeManager = ({ onBack, onLogout }) => {
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
      <CerimonialeEditor 
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
      
      <CerimonialeList 
        onAdd={handleAdd} 
        onEdit={handleEdit} 
        onLogout={onLogout} 
      />
    </div>
  );
};

export default memo(CerimonialeManager);
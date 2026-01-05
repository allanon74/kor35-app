import React, { useState } from 'react';
import InfusioneList from './InfusioneList';
import InfusioneEditor from './InfusioneEditor';

const InfusioneManager = ({ onBack, onLogout }) => {
  const [view, setView] = useState('list'); // 'list' o 'edit'
  const [selectedItem, setSelectedItem] = useState(null);

  const handleEdit = (item) => {
    setSelectedItem(item);
    setView('edit');
  };

  const handleNew = () => {
    setSelectedItem(null);
    setView('edit');
  };

  const handleEditorBack = () => {
    setView('list');
    setSelectedItem(null);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <button onClick={onBack} className="text-amber-500 hover:text-amber-400 text-sm font-bold flex items-center gap-1">
          ← TORNA AGLI STRUMENTI MASTER
        </button>
      </div>

      {view === 'list' ? (
        <InfusioneList 
          onSelect={handleEdit} 
          onNew={handleNew} 
          onLogout={onLogout} 
        />
      ) : (
        <InfusioneEditor 
          initialData={selectedItem} 
          onBack={handleEditorBack} 
          onLogout={onLogout} 
        />
      )}
    </div>
  );
};

export default InfusioneManager;
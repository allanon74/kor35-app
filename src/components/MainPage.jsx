import React, { useState } from 'react';
import { Home, QrCode, Square, HelpCircle, LogOut, X } from 'lucide-react';
import HomeTab from './HomeTab.jsx';
import QrTab from './QrTab.jsx';
import PlaceholderTab from './PlaceholderTab.jsx';
import HtmlViewerModal from './HtmlViewerModal.jsx';

const MainPage = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [htmlContent, setHtmlContent] = useState(null);

  const handleScanSuccess = (content) => {
    setHtmlContent(content);
  };

  const closeHtmlViewer = () => {
    setHtmlContent(null);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab />;
      case 'qr':
        return <QrTab onScanSuccess={handleScanSuccess} />;
      case 'tab3':
      case 'tab4':
        return <PlaceholderTab tabName={activeTab} />;
      case 'info':
        return <PlaceholderTab tabName="Info" />;
      default:
        return <HomeTab />;
    }
  };

  /*
    CORREZIONE LAYOUT (DEFINITIVA):
    Usiamo `h-dvh` (Dynamic Viewport Height) invece di `h-screen`.
    `h-dvh` si adatta all'area visibile del browser mobile, 
    anche quando la barra degli indirizzi appare o scompare.
  */
  return (
    <div className="flex flex-col h-dvh bg-gray-900 text-white">
      {/* Header con Logout */}
      <header className="flex justify-between items-center p-4 bg-gray-800 shadow-md shrink-0">
        <h1 className="text-xl font-bold text-indigo-400">KOR-35</h1>
        <button
          onClick={onLogout}
          className="flex items-center text-red-400 hover:text-red-300"
          title="Logout"
        >
          <LogOut size={24} />
        </button>
      </header>

      {/* Area Contenuto Scorrevole */}
      <main className="grow overflow-y-auto">
        {renderTabContent()}
      </main>

      {/* Navigazione in Basso */}
      <nav className="grid grid-cols-5 gap-1 p-2 bg-gray-800 shadow-lg shrink-0">
        <TabButton
          icon={<Home size={28} />}
          label="Home"
          isActive={activeTab === 'home'}
          onClick={() => setActiveTab('home')}
        />
        <TabButton
          icon={<QrCode size={28} />}
          label="QR Code"
          isActive={activeTab === 'qr'}
          onClick={() => setActiveTab('qr')}
        />
        <TabButton
          icon={<Square size={28} />}
          label="Tab 3"
          isActive={activeTab === 'tab3'}
          onClick={() => setActiveTab('tab3')}
        />
        <TabButton
          icon={<Square size={28} />}
          label="Tab 4"
          isActive={activeTab === 'tab4'}
          onClick={() => setActiveTab('tab4')}
        />
        <TabButton
          icon={<HelpCircle size={28} />}
          label="Info"
          isActive={activeTab === 'info'}
          onClick={() => setActiveTab('info')}
        />
      </nav>

      {/* Modale per HTML */}
      {htmlContent && (
        <HtmlViewerModal
          htmlContent={htmlContent}
          onClose={closeHtmlViewer}
        />
      )}
    </div>
  );
};

// Componente bottone tab (helper)
const TabButton = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-2 rounded-lg ${
      isActive
        ? 'bg-indigo-600 text-white'
        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
    } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
  >
    {icon}
    <span className="text-xs mt-1">{label}</span>
  </button>
);

export default MainPage;


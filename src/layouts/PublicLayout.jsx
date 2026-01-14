import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useCharacter } from '../components/CharacterContext';
import { getWikiMenu } from '../api';

export default function PublicLayout({ token }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { character } = token ? useCharacter() : { character: null };
  const location = useLocation();
  
  const [menuTree, setMenuTree] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        // MODIFICA QUI: Usiamo la funzione importata
        const flatList = await getWikiMenu();
        const tree = buildTree(flatList);
        setMenuTree(tree);
      } catch (error) {
        console.error("Errore menu:", error);
      } finally {
        setLoadingMenu(false);
      }
    };
    fetchMenu();
  }, []);

  // Funzione helper per costruire l'albero (Parent -> Children)
  const buildTree = (items) => {
    const map = {};
    const roots = [];
    
    // Inizializza mappa e children array
    items.forEach((item) => {
      map[item.id] = { ...item, children: [] };
    });

    // Collega i nodi
    items.forEach((item) => {
      if (item.parent) {
        if (map[item.parent]) {
          map[item.parent].children.push(map[item.id]);
        }
      } else {
        roots.push(map[item.id]);
      }
    });
    return roots;
  };

  // Componente ricorsivo per renderizzare i link
  const MenuItem = ({ item }) => (
    <li>
      <Link 
        to={item.slug === 'home' ? '/' : `/regolamento/${item.slug}`}
        className={`block px-4 py-2 hover:bg-gray-700 border-b border-gray-700 transition-colors ${
           location.pathname.includes(item.slug) ? 'bg-gray-700 text-white font-bold' : ''
        }`}
        onClick={() => setSidebarOpen(false)}
      >
        {item.titolo}
      </Link>
      {item.children && item.children.length > 0 && (
        <ul className="pl-4 bg-gray-900 bg-opacity-30 border-l border-gray-600">
          {item.children.map(child => <MenuItem key={child.id} item={child} />)}
        </ul>
      )}
    </li>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-100 text-gray-900 font-sans">
      
      {/* HEADER */}
      <header className="bg-red-900 text-white shadow-md flex items-center justify-between px-4 py-3 z-20 relative">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="md:hidden text-2xl focus:outline-none"
          >
            ☰
          </button>
          <Link to="/" className="text-xl font-bold tracking-wider flex items-center gap-2">
            <img src="/Logo Kor-AD_Trasp.png" alt="Logo" className="h-8" />
            KOR35 WIKI
          </Link>
        </div>

        <div>
          {token ? (
            <Link 
              to="/app" 
              className="bg-white text-red-900 px-4 py-2 rounded font-bold hover:bg-gray-200 transition text-sm"
            >
              {character ? `Gioca (${character.nome})` : 'Entra'}
            </Link>
          ) : (
             !location.pathname.includes('login') && 
             <Link to="/login" className="bg-red-700 hover:bg-red-600 px-4 py-2 rounded text-white transition text-sm">
                Login
             </Link>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* SIDEBAR */}
        <aside 
          className={`
            absolute inset-y-0 left-0 w-72 bg-gray-800 text-gray-200 transform transition-transform duration-300 z-10 shadow-xl
            md:relative md:translate-x-0
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="p-4 font-bold text-gray-400 uppercase text-xs tracking-widest border-b border-gray-700">
            Indice Regolamento
          </div>
          <nav className="overflow-y-auto h-full pb-20 scrollbar-thin scrollbar-thumb-gray-600">
            {loadingMenu ? (
               <div className="p-4 text-gray-400 text-sm">Caricamento indice...</div>
            ) : (
               <ul>
                 {menuTree.map(node => <MenuItem key={node.id} item={node} />)}
               </ul>
            )}
          </nav>
        </aside>

        {/* CONTENUTO */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 md:m-0 scroll-smooth">
          <Outlet />
        </main>

        {/* Overlay Mobile */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black opacity-50 z-0 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
      </div>
    </div>
  );
}
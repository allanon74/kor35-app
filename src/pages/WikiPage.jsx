import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import WikiRenderer from '../components/WikiRenderer';
// MODIFICA QUI:
import { getWikiPage } from '../api';

export default function WikiPage({ slug: propSlug }) {
  const { slug } = useParams();
  const currentSlug = propSlug || slug || 'home'; 
  
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      setError(null);
      try {
        // MODIFICA QUI: Chiamata alla funzione specifica
        const data = await getWikiPage(currentSlug);
        setPageData(data);
      } catch (err) {
        console.error("Errore fetch pagina:", err);
        setError("Pagina non trovata.");
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [currentSlug]);

  if (loading) return <div className="p-10 text-center">Caricamento...</div>;

  if (error || !pageData) {
    return (
        <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded shadow text-center">
            <h2 className="text-2xl font-bold text-gray-700 mb-2">404</h2>
            <p className="text-gray-500">{error}</p>
        </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto bg-white min-h-screen shadow-sm md:rounded-lg overflow-hidden">
        {pageData.immagine && (
            <div className="w-full h-48 md:h-64 overflow-hidden relative">
                <img src={pageData.immagine} alt={pageData.titolo} className="w-full h-full object-cover"/>
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>
                <h1 className="absolute bottom-4 left-4 text-3xl font-bold text-white drop-shadow-lg">{pageData.titolo}</h1>
            </div>
        )}
        <div className="p-6 md:p-10">
            {!pageData.immagine && <h1 className="text-3xl font-bold mb-8 text-red-900 border-b pb-4">{pageData.titolo}</h1>}
            <WikiRenderer content={pageData.contenuto} />
        </div>
    </div>
  );
}
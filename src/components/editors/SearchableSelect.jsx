import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

const SearchableSelect = memo(({ 
    options = [], 
    value, 
    onChange, 
    placeholder = "Seleziona...", 
    labelKey = "nome", 
    valueKey = "id",
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const wrapperRef = useRef(null);
    
    // Debounce del search term per migliorare le performance
    const debouncedSearchTerm = useDebounce(searchTerm, 200);

    // 1. Trova l'oggetto selezionato attualmente (memoized)
    const selectedItem = useMemo(() => 
        options.find(opt => String(opt[valueKey]) === String(value)),
        [options, value, valueKey]
    );

    // 2. Filtra e Ordina le opzioni (con debounce)
    const filteredOptions = useMemo(() => {
        return options
            .filter(opt => {
                const label = opt[labelKey] || "";
                return label.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
            })
            .sort((a, b) => (a[labelKey] || "").localeCompare(b[labelKey] || ""));
    }, [options, debouncedSearchTerm, labelKey]);

    // Gestione click fuori per chiudere
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Reset della ricerca quando si chiude/apre
    useEffect(() => {
        if (!isOpen) setSearchTerm("");
    }, [isOpen]);

    const handleSelect = (item) => {
        onChange(item[valueKey]);
        setIsOpen(false);
        setSearchTerm("");
    };

    const clearSelection = (e) => {
        e.stopPropagation();
        onChange(null);
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            {/* INPUT / TRIGGER */}
            <div 
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`
                    w-full bg-gray-950 border rounded px-2 py-1.5 text-sm text-white flex items-center justify-between cursor-pointer transition-colors
                    ${disabled ? 'opacity-50 cursor-not-allowed border-gray-800' : 'border-gray-700 hover:border-gray-500 focus-within:border-indigo-500'}
                `}
            >
                {isOpen ? (
                    <input 
                        autoFocus
                        type="text" 
                        className="bg-transparent outline-none w-full text-white placeholder-gray-500"
                        placeholder="Cerca..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()} 
                    />
                ) : (
                    <span className={`truncate ${!selectedItem ? 'text-gray-500 italic' : ''}`}>
                        {selectedItem ? selectedItem[labelKey] : placeholder}
                    </span>
                )}

                <div className="flex items-center gap-1 shrink-0 ml-2">
                    {selectedItem && !disabled && !isOpen && (
                        <button onClick={clearSelection} className="text-gray-500 hover:text-red-400 p-0.5">
                            <X size={14} />
                        </button>
                    )}
                    <ChevronDown size={14} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* DROPDOWN MENU */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map(opt => {
                            const isSelected = String(opt[valueKey]) === String(value);
                            return (
                                <div 
                                    key={opt[valueKey]} 
                                    onClick={() => handleSelect(opt)}
                                    className={`
                                        px-3 py-2 text-sm cursor-pointer flex justify-between items-center border-b border-gray-800 last:border-0
                                        ${isSelected ? 'bg-indigo-900/40 text-indigo-200 font-bold' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}
                                    `}
                                >
                                    <span>{opt[labelKey]}</span>
                                    {isSelected && <Check size={14} className="text-indigo-400" />}
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-3 text-center text-gray-500 text-xs italic">
                            Nessun risultato.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

SearchableSelect.displayName = 'SearchableSelect';

export default SearchableSelect;
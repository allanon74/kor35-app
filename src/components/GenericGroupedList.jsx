import React from 'react';

// Funzione helper per determinare il colore del testo (Bianco/Nero)
const getContrastYIQ = (hexcolor) => {
    if (!hexcolor) return 'black';
    const hex = hexcolor.replace("#", "");
    if (hex.length !== 6) return 'black';
    
    var r = parseInt(hex.substr(0, 2), 16);
    var g = parseInt(hex.substr(2, 2), 16);
    var b = parseInt(hex.substr(4, 2), 16);
    var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
}

const GenericGroupedList = ({ 
    items, 
    groupByKey, 
    renderItem, 
    renderHeader, // <--- Nuova prop: funzione per renderizzare l'header personalizzato
    titleKey = "nome", 
    colorKey = "colore", 
    iconKey = "icona_url", 
    orderKey = "ordine",
    compact = false 
}) => {

    if (!items || items.length === 0) return null;

    // 1. Raggruppa gli elementi
    const groupedItems = items.reduce((acc, item) => {
        const groupObj = item[groupByKey];
        
        const groupId = groupObj ? groupObj.id : 'no-group';
        const groupName = groupObj ? groupObj[titleKey] : 'Altro';
        const groupColor = groupObj ? groupObj[colorKey] : '#cccccc';
        const groupIcon = groupObj ? groupObj[iconKey] : null;
        const groupOrder = groupObj && groupObj[orderKey] !== undefined ? groupObj[orderKey] : 9999;

        if (!acc[groupId]) {
            acc[groupId] = {
                id: groupId,
                name: groupName,
                color: groupColor,
                icon: groupIcon,
                order: groupOrder,
                items: []
            };
        }
        acc[groupId].items.push(item);
        return acc;
    }, {});

    // 2. Ordina i gruppi
    const sortedGroups = Object.values(groupedItems).sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return a.name.localeCompare(b.name);
    });

    return (
        <div className="space-y-4">
            {sortedGroups.map(group => {
                // Se c'è una funzione custom per l'header, usala. Altrimenti usa il default.
                if (renderHeader) {
                    return (
                        <div 
                            key={group.id} 
                            className="border border-gray-700 rounded-lg overflow-hidden shadow-sm mb-4 bg-gray-800"
                            style={{ borderColor: group.color }}
                        >
                            {/* Header Custom (es. PunteggioDisplay) */}
                            {renderHeader(group)}

                            {/* Lista Elementi */}
                            <div className="p-2">
                                <ul className={`divide-y divide-gray-700 ${compact ? 'text-sm' : ''}`}>
                                    {group.items.map((item, index) => (
                                        <React.Fragment key={index}>
                                            {renderItem(item)}
                                        </React.Fragment>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    );
                }

                // --- DEFAULT HEADER (Fallback) ---
                const textColor = getContrastYIQ(group.color);
                return (
                    <div 
                        key={group.id} 
                        className="border border-gray-700 rounded-lg overflow-hidden shadow-sm mb-4 bg-gray-800"
                        style={{ borderColor: group.color }}
                    >
                        <div 
                            className={`px-3 py-1 flex items-center justify-between font-bold ${compact ? 'text-sm' : 'text-base'}`}
                            style={{ backgroundColor: group.color, color: textColor }}
                        >
                            <div className="flex items-center gap-2">
                                {group.icon && (
                                    <div 
                                        className="w-5 h-5"
                                        style={{
                                            maskImage: `url(${group.icon})`,
                                            WebkitMaskImage: `url(${group.icon})`,
                                            maskSize: 'contain',
                                            WebkitMaskSize: 'contain',
                                            backgroundColor: textColor
                                        }}
                                    />
                                )}
                                <span>{group.name}</span>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full bg-white/20`}>
                                {group.items.length}
                            </span>
                        </div>

                        <div className="p-2">
                            <ul className={`divide-y divide-gray-700 ${compact ? 'text-sm' : ''}`}>
                                {group.items.map((item, index) => (
                                    <React.Fragment key={index}>
                                        {renderItem(item)}
                                    </React.Fragment>
                                ))}
                            </ul>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default GenericGroupedList;
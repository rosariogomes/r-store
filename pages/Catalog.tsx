import React, { useState, useMemo } from 'react';
import { ICONS } from '../constants';
import { useStore } from '../context/StoreContext';

export const Catalog = () => {
  const { products } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Filter products: Must have available stock (Stock - OnBag)
  const availableProducts = useMemo(() => {
    return products.filter(p => {
       const available = p.stock_quantity - p.on_bag_quantity;
       const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
       return available > 0 && matchesSearch;
    });
  }, [products, searchTerm]);

  // Toggle selection for sharing
  const toggleSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedItems.length === availableProducts.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(availableProducts.map(p => p.id));
    }
  };

  // Generate WhatsApp Message
  const handleShare = () => {
    if (selectedItems.length === 0) return;

    const itemsToShare = products.filter(p => selectedItems.includes(p.id));
    
    let message = `✨ *Vitrine R Store* ✨\n\nConfira as peças disponíveis que separei para você:\n\n`;
    
    itemsToShare.forEach(item => {
      message += `👗 *${item.name}*\n`;
      message += `Tamanho: ${item.size} | Cor: ${item.color}\n`;
      message += `💲 R$ ${item.sale_price.toFixed(2)}\n\n`;
    });

    message += `Gostou de algo? Me avise para reservar! ❤️`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Catálogo Digital</h1>
          <p className="text-zinc-400">Selecione peças disponíveis e envie para suas clientes.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
             <button 
                onClick={selectAll}
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl hover:text-white transition-colors text-sm font-medium"
             >
                {selectedItems.length === availableProducts.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
             </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md mb-6">
        <ICONS.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
        <input 
            type="text" 
            placeholder="Buscar peças no catálogo..." 
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-brand-600"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid */}
      {availableProducts.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 bg-zinc-900/50 rounded-2xl border border-zinc-800 border-dashed">
             <ICONS.Inventory size={48} className="mx-auto mb-4 opacity-50" />
             <p>Nenhuma peça disponível no momento.</p>
          </div>
      ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {availableProducts.map(product => {
                const isSelected = selectedItems.includes(product.id);
                return (
                    <div 
                        key={product.id} 
                        onClick={() => toggleSelection(product.id)}
                        className={`group relative rounded-xl overflow-hidden border transition-all cursor-pointer ${
                            isSelected 
                            ? 'border-brand-600 ring-1 ring-brand-600 bg-zinc-900' 
                            : 'border-zinc-800 bg-zinc-950 hover:border-zinc-600'
                        }`}
                    >
                        {/* Image */}
                        <div className="aspect-[3/4] w-full bg-zinc-900 relative">
                             <img src={product.image_url} alt={product.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                             
                             {/* Checkbox Overlay */}
                             <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                                 isSelected ? 'bg-brand-600 border-brand-600' : 'bg-black/50 border-white/50'
                             }`}>
                                 {isSelected && <ICONS.Check size={14} className="text-white" />}
                             </div>
                        </div>

                        {/* Content */}
                        <div className="p-3">
                            <h3 className="text-sm font-medium text-white line-clamp-1">{product.name}</h3>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-zinc-500">{product.size} • {product.color}</span>
                            </div>
                            <p className="text-brand-500 font-bold text-sm mt-2">R$ {product.sale_price.toFixed(2)}</p>
                        </div>
                    </div>
                );
            })}
          </div>
      )}

      {/* Floating Action Button for Sharing */}
      {selectedItems.length > 0 && (
          <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 animate-fade-in z-40">
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 px-6 py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-full shadow-2xl shadow-brand-900/50 transition-transform hover:scale-105 active:scale-95"
              >
                  <ICONS.WhatsApp size={24} />
                  <span>Compartilhar {selectedItems.length} peças</span>
              </button>
          </div>
      )}
    </div>
  );
};
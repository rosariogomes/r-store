import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Search, Share2, Filter, Package, CheckCircle, X } from 'lucide-react';

export const Catalog = () => {
  const { products, storeConfig } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  
  // Lista de IDs dos produtos selecionados
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // 1. Extrair categorias únicas do estoque
  const categories = useMemo(() => {
      const cats = new Set(products.map(p => p.category));
      return ['TODOS', ...Array.from(cats)];
  }, [products]);

  // 2. Filtrar produtos
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'TODOS' || p.category === selectedCategory;
    const hasStock = p.stock_quantity > 0; // Só mostra o que tem estoque
    return matchesSearch && matchesCategory && hasStock;
  });

  // 3. Alternar seleção
  const toggleSelection = (id: string) => {
      if (selectedProductIds.includes(id)) {
          setSelectedProductIds(prev => prev.filter(pid => pid !== id));
      } else {
          setSelectedProductIds(prev => [...prev, id]);
      }
  };

  // 4. Compartilhar no WhatsApp
  const handleShare = () => {
      if (selectedProductIds.length === 0) return;

      const selectedItems = products.filter(p => selectedProductIds.includes(p.id));
      
      // Monta a mensagem
      let message = `Olá! 👋\nOlha essas peças incríveis da *${storeConfig.name}* que separei para você:\n\n`;
      
      selectedItems.forEach(item => {
          message += `▪️ *${item.name}*\n   💰 R$ ${item.sale_price.toFixed(2)}\n   📏 Tam: ${item.size} | Cor: ${item.color}\n\n`;
      });
      
      message += `Total de peças: ${selectedItems.length}\n`;
      message += `\nFicou interessado(a)? Me avise! 😉`;

      // Abre API do WhatsApp (sem número, para o usuário escolher o contato)
      const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
  };

  return (
    <div className="pb-20 p-6 animate-fade-in relative">
      
      {/* Header Fixo/Sticky para Ações Rápidas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sticky top-0 z-10 bg-black/95 backdrop-blur-sm py-4 border-b border-zinc-800 -mx-6 px-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            Catálogo Digital 
            <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full font-normal">
                {filteredProducts.length} itens
            </span>
          </h1>
          <p className="text-zinc-400 text-sm">Selecione as peças e envie para seus clientes.</p>
        </div>

        {/* Botão de Compartilhar (Só aparece se tiver itens selecionados) */}
        <div className="flex items-center gap-3">
             {selectedProductIds.length > 0 && (
                 <span className="text-sm text-purple-400 font-bold animate-pulse">
                     {selectedProductIds.length} selecionados
                 </span>
             )}
             <button 
                onClick={handleShare}
                disabled={selectedProductIds.length === 0}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
                    selectedProductIds.length > 0
                    ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/20 translate-y-0 opacity-100'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
                }`}
            >
                <Share2 size={20} />
                Compartilhar no WhatsApp
            </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="space-y-4 mb-8">
          {/* Busca */}
          <div className="relative">
             <input 
                type="text" 
                placeholder="Buscar peça por nome..." 
                className="w-full bg-zinc-900 border border-zinc-800 text-white p-4 rounded-xl pl-12 focus:outline-none focus:border-brand-500 transition-colors"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
             />
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
             {searchTerm && (
                 <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                     <X size={16} />
                 </button>
             )}
          </div>

          {/* Categorias */}
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
              {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold transition-colors border ${
                        selectedCategory === cat
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                      {cat}
                  </button>
              ))}
          </div>
      </div>

      {/* Grid de Produtos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredProducts.map(product => {
            const isSelected = selectedProductIds.includes(product.id);
            return (
                <div 
                    key={product.id} 
                    onClick={() => toggleSelection(product.id)}
                    className={`relative bg-zinc-900 border rounded-2xl overflow-hidden cursor-pointer transition-all group ${
                        isSelected 
                        ? 'border-purple-500 ring-1 ring-purple-500 shadow-lg shadow-purple-900/20 transform scale-[1.02]' 
                        : 'border-zinc-800 hover:border-zinc-600'
                    }`}
                >
                    {/* Indicador de Seleção */}
                    <div className={`absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected ? 'bg-purple-500 text-white scale-100' : 'bg-black/50 text-transparent border border-white/30 scale-90'
                    }`}>
                        <CheckCircle size={14} fill={isSelected ? "white" : "none"} className={isSelected ? "text-purple-600" : ""} />
                    </div>

                    {/* Imagem */}
                    <div className="aspect-[3/4] bg-zinc-950 relative">
                        {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-700">
                                <Package size={32} />
                            </div>
                        )}
                        {/* Overlay Gradiente */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                        
                        <div className="absolute bottom-2 left-2 right-2">
                             <p className="text-white font-bold text-sm truncate">{product.name}</p>
                             <p className="text-green-400 font-bold text-xs">R$ {product.sale_price.toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Info Extra */}
                    <div className="p-3 flex justify-between items-center text-[10px] text-zinc-400 bg-zinc-900">
                        <span>{product.size}</span>
                        <span>{product.category}</span>
                    </div>
                </div>
            );
        })}
      </div>

      {filteredProducts.length === 0 && (
          <div className="text-center py-20 text-zinc-500">
              <Filter size={48} className="mx-auto mb-4 opacity-20" />
              <p>Nenhum produto encontrado com estes filtros.</p>
          </div>
      )}
    </div>
  );
};
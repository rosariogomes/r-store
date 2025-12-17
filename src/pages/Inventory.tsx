import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Plus, Search, Edit, Trash2, Package, Tag, Shirt, Ruler, Palette, X, Upload } from 'lucide-react';
import { Product } from '../types';
import { supabase } from '../lib/supabase';

export const Inventory = () => {
  // Importando canDelete
  const { products, addProduct, updateProduct, deleteProduct, canDelete } = useStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', category: '', gender: 'UNISEX', size: 'M', color: '',
    cost_price: 0, sale_price: 0, stock_quantity: 0, on_bag_quantity: 0, image_url: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Filter
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (product?: Product) => {
    if (product) {
        setEditingProduct(product);
        setFormData(product);
    } else {
        setEditingProduct(null);
        setFormData({
            name: '', category: '', gender: 'UNISEX', size: 'M', color: '',
            cost_price: 0, sale_price: 0, stock_quantity: 0, on_bag_quantity: 0, image_url: ''
        });
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
      if(window.confirm("Deseja realmente excluir este produto?")) {
          deleteProduct(id);
      }
  };

  const handleImageUpload = async (file: File): Promise<string> => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage.from('products').upload(fileName, file);
      if (error) throw error;
      const { data: publicData } = supabase.storage.from('products').getPublicUrl(fileName);
      return publicData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
        let finalImageUrl = formData.image_url;

        if (imageFile) {
            finalImageUrl = await handleImageUpload(imageFile);
        }

        const productData = {
            ...formData,
            image_url: finalImageUrl || '',
            cost_price: Number(formData.cost_price),
            sale_price: Number(formData.sale_price),
            stock_quantity: Number(formData.stock_quantity),
            on_bag_quantity: Number(formData.on_bag_quantity)
        } as Product;

        if (editingProduct) {
            await updateProduct({ ...productData, id: editingProduct.id });
        } else {
            await addProduct({ ...productData, id: Date.now().toString() });
        }

        setIsModalOpen(false);
    } catch (error) {
        alert("Erro ao salvar produto. Verifique a imagem.");
        console.error(error);
    } finally {
        setIsUploading(false);
    }
  };

  return (
    <div className="pb-20 p-6 animate-fade-in relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Estoque</h1>
          <p className="text-zinc-400">Gerencie seus produtos, preços e fotos.</p>
        </div>
        <button 
            onClick={() => handleOpenModal()}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-brand-900/20"
        >
            <Plus size={20} />
            Novo Produto
        </button>
      </div>

      <div className="mb-8 relative">
          <input 
            type="text" 
            placeholder="Buscar por nome, categoria..." 
            className="w-full bg-zinc-900 border border-zinc-800 text-white p-4 rounded-xl pl-12 focus:outline-none focus:border-brand-500 transition-colors"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
              <div key={product.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden group hover:border-zinc-700 transition-all">
                  <div className="h-48 bg-zinc-950 relative">
                      {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-700">
                              <Package size={48} />
                          </div>
                      )}
                      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">
                          Qtd: {product.stock_quantity}
                      </div>
                  </div>
                  
                  <div className="p-4">
                      <h3 className="font-bold text-white text-lg mb-1 truncate">{product.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 mb-3">
                          <span className="bg-zinc-800 px-2 py-0.5 rounded uppercase">{product.category}</span>
                          <span className="bg-zinc-800 px-2 py-0.5 rounded">{product.size}</span>
                      </div>
                      
                      <div className="flex justify-between items-end">
                          <div>
                              <p className="text-[10px] text-zinc-500 uppercase font-bold">Venda</p>
                              <p className="text-green-500 font-bold text-xl">R$ {product.sale_price.toFixed(2)}</p>
                          </div>
                          
                          <div className="flex gap-2">
                              {/* Botão de Editar (Liberado para todos) */}
                              <button 
                                onClick={() => handleOpenModal(product)}
                                className="p-2 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                              >
                                  <Edit size={18} />
                              </button>

                              {/* Botão de Excluir (Protegido) */}
                              {canDelete() && (
                                <button 
                                    onClick={() => handleDelete(product.id)}
                                    className="p-2 text-zinc-400 hover:text-red-500 bg-zinc-800 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          ))}
      </div>

      {/* Modal de Cadastro */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">
                        {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                    </h2>
                    <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white"><X size={24} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Imagem */}
                    <div className="flex justify-center">
                        <label className="w-32 h-32 bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 hover:text-brand-500 text-zinc-500 transition-all overflow-hidden relative">
                            {imageFile ? (
                                <img src={URL.createObjectURL(imageFile)} className="w-full h-full object-cover" />
                            ) : formData.image_url ? (
                                <img src={formData.image_url} className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <Upload size={24} className="mb-2" />
                                    <span className="text-xs font-bold">Foto</span>
                                </>
                            )}
                            <input type="file" className="hidden" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Nome do Produto</label>
                            <input type="text" required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none"
                                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Categoria</label>
                            <div className="relative">
                                <Tag className="absolute left-3 top-3 text-zinc-500" size={16} />
                                <input type="text" required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 pl-10 text-white focus:border-brand-500 outline-none"
                                    value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Ex: Camisas" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Gênero</label>
                            <select className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none"
                                value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})}>
                                <option value="UNISEX">Unissex</option>
                                <option value="MALE">Masculino</option>
                                <option value="FEMALE">Feminino</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Tamanho</label>
                            <div className="relative">
                                <Ruler className="absolute left-3 top-3 text-zinc-500" size={16} />
                                <input type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 pl-10 text-white focus:border-brand-500 outline-none"
                                    value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} placeholder="P, M, G, 42..." />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Cor</label>
                            <div className="relative">
                                <Palette className="absolute left-3 top-3 text-zinc-500" size={16} />
                                <input type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 pl-10 text-white focus:border-brand-500 outline-none"
                                    value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Preço de Custo</label>
                            <input type="number" step="0.01" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none"
                                value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: Number(e.target.value)})} />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Preço de Venda</label>
                            <input type="number" step="0.01" required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none font-bold text-green-500"
                                value={formData.sale_price} onChange={e => setFormData({...formData, sale_price: Number(e.target.value)})} />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Estoque (Loja)</label>
                            <input type="number" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none"
                                value={formData.stock_quantity} onChange={e => setFormData({...formData, stock_quantity: Number(e.target.value)})} />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Estoque (Sacola)</label>
                            <input type="number" disabled className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-500 cursor-not-allowed"
                                value={formData.on_bag_quantity} />
                        </div>
                    </div>

                    <button type="submit" disabled={isUploading} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-4">
                        {isUploading ? 'Salvando...' : <><Save size={20} /> Salvar Produto</>}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
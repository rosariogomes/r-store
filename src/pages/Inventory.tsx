import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { 
    Search, Plus, Filter, Package, Edit, Trash2, X, 
    Save, Image as ImageIcon, AlertCircle, Upload, Loader2
} from 'lucide-react';
import { Product } from '../types';
import { supabase } from '../lib/supabase'; // Importante para o upload

export const Inventory = () => {
  const { products, addProduct, updateProduct, deleteProduct, canDelete } = useStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Estados para Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado do Formulário
  const [formData, setFormData] = useState({
      name: '',
      category: '',
      gender: 'UNISEX',
      size: '',
      color: '',
      cost_price: '',
      sale_price: '',
      stock_quantity: '',
      image_url: ''
  });

  // Filtros
  const filteredProducts = useMemo(() => {
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  // Abrir Modal
  const handleOpenModal = (product?: Product) => {
      setSelectedFile(null); // Reseta arquivo
      setIsUploading(false);

      if (product) {
          setEditingProduct(product);
          setPreviewUrl(product.image_url || ''); // Mostra a imagem atual
          setFormData({
              name: product.name,
              category: product.category,
              gender: product.gender,
              size: product.size,
              color: product.color,
              cost_price: product.cost_price.toString(),
              sale_price: product.sale_price.toString(),
              stock_quantity: product.stock_quantity.toString(),
              image_url: product.image_url || ''
          });
      } else {
          setEditingProduct(null);
          setPreviewUrl('');
          setFormData({
              name: '', category: '', gender: 'UNISEX', size: '', color: '',
              cost_price: '', sale_price: '', stock_quantity: '', image_url: ''
          });
      }
      setIsModalOpen(true);
  };

  // Selecionar Arquivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setSelectedFile(file);
          // Cria preview local
          const objectUrl = URL.createObjectURL(file);
          setPreviewUrl(objectUrl);
      }
  };

  // Salvar Produto (Com Upload)
  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!formData.name || !formData.sale_price || !formData.stock_quantity) {
          return alert("Preencha os campos obrigatórios!");
      }

      setIsUploading(true);
      let finalImageUrl = formData.image_url;

      try {
          // 1. Se tem arquivo novo, faz o upload primeiro
          if (selectedFile) {
              const fileExt = selectedFile.name.split('.').pop();
              const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
              const filePath = `${fileName}`;

              const { error: uploadError } = await supabase.storage
                  .from('products')
                  .upload(filePath, selectedFile);

              if (uploadError) throw uploadError;

              const { data: { publicUrl } } = supabase.storage
                  .from('products')
                  .getPublicUrl(filePath);

              finalImageUrl = publicUrl;
          }

          // 2. Prepara dados para salvar no banco
          const productData: any = {
              name: formData.name,
              category: formData.category,
              gender: formData.gender as any,
              size: formData.size,
              color: formData.color,
              cost_price: Number(formData.cost_price) || 0,
              sale_price: Number(formData.sale_price) || 0,
              stock_quantity: Number(formData.stock_quantity) || 0,
              image_url: finalImageUrl, // Usa a URL nova (ou a antiga se não mudou)
              on_bag_quantity: editingProduct ? editingProduct.on_bag_quantity : 0
          };

          // 3. Salva no Banco (Insert ou Update)
          if (editingProduct) {
              await updateProduct({ ...productData, id: editingProduct.id });
              alert("Produto atualizado!");
          } else {
              await addProduct({ ...productData, id: crypto.randomUUID() });
              alert("Produto cadastrado!");
          }
          setIsModalOpen(false);

      } catch (error) {
          console.error(error);
          alert("Erro ao salvar produto/imagem.");
      } finally {
          setIsUploading(false);
      }
  };

  const handleDelete = async (id: string) => {
      if (window.confirm("Tem certeza que deseja excluir este produto?")) {
          await deleteProduct(id);
      }
  };

  return (
    <div className="pb-20 p-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Estoque</h1>
          <p className="text-zinc-400">Gerencie seus produtos, preços e quantidades.</p>
        </div>
        <button 
            onClick={() => handleOpenModal()}
            className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-900/20 transition-all active:scale-95"
        >
            <Plus size={20} />
            Novo Produto
        </button>
      </div>

      {/* Barra de Busca */}
      <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 mb-6 flex gap-4">
          <div className="flex-1 relative">
             <input 
                type="text" 
                placeholder="Buscar por nome, categoria..." 
                className="w-full bg-zinc-950 border border-zinc-800 text-white p-3 rounded-xl pl-10 focus:border-brand-500 outline-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
             />
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          </div>
          <button className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-xl border border-zinc-700 transition-colors">
              <Filter size={20} />
          </button>
      </div>

      {/* Lista de Produtos (Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
              <div key={product.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all group">
                  <div className="aspect-video bg-zinc-950 relative overflow-hidden">
                      {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-700">
                              <Package size={48} strokeWidth={1} />
                          </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleOpenModal(product)}
                            className="p-2 bg-zinc-800 text-white rounded-lg hover:bg-brand-600 transition-colors shadow-lg"
                          >
                              <Edit size={16} />
                          </button>
                          {canDelete() && (
                              <button 
                                onClick={() => handleDelete(product.id)}
                                className="p-2 bg-zinc-800 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors shadow-lg"
                              >
                                  <Trash2 size={16} />
                              </button>
                          )}
                      </div>
                  </div>

                  <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                          <div>
                              <h3 className="font-bold text-white text-lg line-clamp-1">{product.name}</h3>
                              <p className="text-zinc-500 text-xs">{product.category} • {product.gender}</p>
                          </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-4 text-sm text-zinc-400">
                          <span className="bg-zinc-800 px-2 py-0.5 rounded text-xs">{product.size}</span>
                          <span className="bg-zinc-800 px-2 py-0.5 rounded text-xs">{product.color}</span>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-zinc-800">
                          <div>
                              <p className="text-xs text-zinc-500 uppercase font-bold">Preço</p>
                              <p className="text-brand-500 font-bold text-lg">R$ {product.sale_price.toFixed(2)}</p>
                          </div>
                          <div className="text-right">
                              <p className="text-xs text-zinc-500 uppercase font-bold">Estoque</p>
                              <p className={`font-bold text-lg ${product.stock_quantity > 0 ? 'text-white' : 'text-red-500'}`}>
                                  {product.stock_quantity} <span className="text-xs font-normal text-zinc-600">un</span>
                              </p>
                          </div>
                      </div>
                      
                      {(product.on_bag_quantity || 0) > 0 && (
                          <div className="mt-3 bg-purple-500/10 border border-purple-500/20 rounded-lg p-2 flex items-center gap-2 text-xs text-purple-300">
                              <AlertTriangle size={14} />
                              <span>{product.on_bag_quantity} itens em malinha</span>
                          </div>
                      )}
                  </div>
              </div>
          ))}
      </div>

      {filteredProducts.length === 0 && (
          <div className="text-center py-20 text-zinc-500">
              <Package size={48} className="mx-auto mb-4 opacity-20" />
              <p>Nenhum produto encontrado.</p>
          </div>
      )}

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                      <h2 className="text-xl font-bold text-white">
                          {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                      </h2>
                      <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white">
                          <X size={24} />
                      </button>
                  </div>
                  
                  <form onSubmit={handleSave} className="p-6 overflow-y-auto custom-scrollbar space-y-4">
                      
                      {/* ÁREA DE UPLOAD DE IMAGEM */}
                      <div className="flex justify-center mb-6">
                          <div 
                            className="relative w-40 h-40 rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-950/50 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-brand-500 hover:bg-zinc-900 transition-all group"
                            onClick={() => fileInputRef.current?.click()}
                          >
                              {previewUrl ? (
                                  <img src={previewUrl} className="w-full h-full object-cover" />
                              ) : (
                                  <div className="flex flex-col items-center text-zinc-500 group-hover:text-brand-500">
                                      <Upload size={32} className="mb-2" />
                                      <span className="text-xs font-bold">Enviar Foto</span>
                                  </div>
                              )}
                              
                              {/* Overlay de troca de imagem */}
                              {previewUrl && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <span className="text-white text-xs font-bold flex items-center gap-1">
                                          <Edit size={14} /> Alterar
                                      </span>
                                  </div>
                              )}
                              
                              <input 
                                type="file" 
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileSelect}
                              />
                          </div>
                      </div>

                      {/* Linha 1: Nome e Categoria */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Nome do Produto *</label>
                              <input 
                                type="text" 
                                required
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Categoria</label>
                              <input 
                                type="text" 
                                list="categories"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none"
                                value={formData.category}
                                onChange={e => setFormData({...formData, category: e.target.value})}
                              />
                              <datalist id="categories">
                                  <option value="Camisetas" />
                                  <option value="Calças" />
                                  <option value="Vestidos" />
                                  <option value="Acessórios" />
                              </datalist>
                          </div>
                      </div>

                      {/* Linha 2: Gênero, Tamanho, Cor */}
                      <div className="grid grid-cols-3 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Gênero</label>
                              <select 
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none"
                                value={formData.gender}
                                onChange={e => setFormData({...formData, gender: e.target.value})}
                              >
                                  <option value="UNISEX">Unissex</option>
                                  <option value="MALE">Masculino</option>
                                  <option value="FEMALE">Feminino</option>
                                  <option value="KIDS">Infantil</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Tamanho</label>
                              <input 
                                type="text" 
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none"
                                placeholder="P, M, G, 38..."
                                value={formData.size}
                                onChange={e => setFormData({...formData, size: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Cor</label>
                              <input 
                                type="text" 
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none"
                                value={formData.color}
                                onChange={e => setFormData({...formData, color: e.target.value})}
                              />
                          </div>
                      </div>

                      {/* Linha 3: Preços */}
                      <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-950/50 rounded-xl border border-zinc-800">
                          <div>
                              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Preço de Custo</label>
                              <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">R$</span>
                                  <input 
                                    type="number" step="0.01"
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 pl-10 text-white focus:border-brand-500 outline-none"
                                    value={formData.cost_price}
                                    onChange={e => setFormData({...formData, cost_price: e.target.value})}
                                  />
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Preço de Venda *</label>
                              <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">R$</span>
                                  <input 
                                    type="number" step="0.01" required
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 pl-10 text-white focus:border-green-500 outline-none font-bold"
                                    value={formData.sale_price}
                                    onChange={e => setFormData({...formData, sale_price: e.target.value})}
                                  />
                              </div>
                          </div>
                      </div>

                      {/* Linha 4: Estoque */}
                      <div>
                          <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Quantidade em Estoque *</label>
                          <input 
                            type="number" required
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none"
                            value={formData.stock_quantity}
                            onChange={e => setFormData({...formData, stock_quantity: e.target.value})}
                          />
                      </div>

                      <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
                          <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors"
                          >
                              Cancelar
                          </button>
                          <button 
                            type="submit"
                            disabled={isUploading}
                            className="px-6 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
                          >
                              {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                              {isUploading ? 'Enviando...' : 'Salvar Produto'}
                          </button>
                      </div>

                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
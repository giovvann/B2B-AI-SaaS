'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  Upload,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Trash2,
  ShoppingCart,
  Package,
  Check,
  Sun,
  Moon,
  Camera,
  Image as ImageIcon,
  Sparkles,
  CheckCheck,
  QrCode,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { syncBoutiqueAction } from '@/app/acciones/sync-boutique';

interface Product {
  id: string;
  name: string;
  brand: string;
  season: string;
  purchase_price: number;
  sale_price: number;
  quantity: number;
  size: string;
  color: string;
  status: 'new' | 'edited';
  sourceImageId: string;
}

interface UploadedImage {
  id: string;
  preview: string;
  file: File;
  productsCount: number;
}

export default function NewIncomePage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [boutiqueId, setBoutiqueId] = useState<string | null>(null);
  const [loadingBoutique, setLoadingBoutique] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualProduct, setManualProduct] = useState({ name: '', brand: '', season: '', size: '', color: '', purchase_price: 0, sale_price: 0, quantity: 1, sale_price_input: 0 });
  const calcSalePrice = (purchase: number) => Math.round(purchase * 2.5 * 100) / 100;

  useEffect(() => {
    const fetchBoutique = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/login');
          return;
        }

        const { data: boutique, error: boutiqueError } = await supabase
          .from('boutiques')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (boutiqueError || !boutique) {
          const res = await syncBoutiqueAction();
          if ('boutiqueId' in res) {
            setBoutiqueId(res.boutiqueId);
            setLoadingBoutique(false);
            return;
          }
          setError('No se encontró tu boutique. Contacta soporte.');
          setLoadingBoutique(false);
          return;
        }

        setBoutiqueId(boutique.id);
      } catch (err) {
        console.error('Error obteniendo boutique:', err);
        setError('Error al cargar tu boutique');
      } finally {
        setLoadingBoutique(false);
      }
    };

    fetchBoutique();
  }, [router]);

  const validateFile = (file: File): string | null => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return `${file.name}: tipo no válido`;
    }
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return `${file.name}: muy grande (máx 10MB)`;
    }
    return null;
  };

  const handleFiles = async (files: FileList | File[]) => {
    setError('');
    setSuccess('');
    const fileArray = Array.from(files);
    const validationErrors: string[] = [];
    const validFiles: File[] = [];

    fileArray.forEach(file => {
      const err = validateFile(file);
      if (err) validationErrors.push(err);
      else validFiles.push(file);
    });

    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
    }

    if (validFiles.length === 0) return;

    const newImages: UploadedImage[] = [];
    for (const file of validFiles) {
      const id = `img_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const preview = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      newImages.push({ id, preview, file, productsCount: 0 });
    }

    setUploadedImages(prev => [...prev, ...newImages]);

    setIsProcessing(true);
    for (const img of newImages) {
      try {
        const formData = new FormData();
        formData.append('image', img.file);
        const response = await fetch('/api/extract-invoice', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (!response.ok) {
          setError(`Error procesando imagen: ${data.error || 'Desconocido'}`);
          continue;
        }
        if (data.products.length === 0) {
          setError(`No se encontraron productos en una de las imágenes`);
          continue;
        }

        const newProducts: Product[] = data.products.map((p: any) => ({
          id: `prod_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          name: p.name,
          brand: p.brand || '',
          season: p.season || '',
          purchase_price: p.purchase_price,
          sale_price: (p.purchase_price * 2.5),
          quantity: p.quantity,
          size: p.size || 'Unitalla',
          color: p.color || 'Único',
          status: 'new',
          sourceImageId: img.id,
        }));

        setProducts(prev => [...prev, ...newProducts]);
        img.productsCount = newProducts.length;
      } catch (err: any) {
        setError(`Error al procesar imagen: ${err.message}`);
      }
    }
    setIsProcessing(false);
    setSuccess(`${newImages.length} imagen(es) procesada(s) correctamente`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const removeImage = (imageId: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
    setProducts(prev => prev.filter(p => p.sourceImageId !== imageId));
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const updateProduct = (id: string, field: keyof Product, value: any) => {
    setProducts(prev => prev.map(p => 
      p.id === id 
        ? { ...p, [field]: value, status: 'edited' }
        : p
    ));
  };

  const removeProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addManualProduct = async () => {
    if (!manualProduct.name.trim() || manualProduct.purchase_price <= 0) return;
    if (!boutiqueId) {
      setError('No se encontró tu boutique. Recarga la página.');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      const supabase = createClient();
      const { error: insertError } = await supabase
        .from('products')
        .insert({
          name: manualProduct.name,
          brand: manualProduct.brand || null,
          season: manualProduct.season || null,
          size: manualProduct.size || 'Unitalla',
          color: manualProduct.color || 'Único',
          purchase_price: manualProduct.purchase_price,
          sale_price: manualProduct.sale_price,
          stock: manualProduct.quantity,
          boutique_id: boutiqueId,
        });

      if (insertError) throw new Error(insertError.message);

      setManualProduct({ name: '', brand: '', season: '', size: '', color: '', purchase_price: 0, sale_price: 0, quantity: 1, sale_price_input: 0 });
      setShowManualForm(false);
      setSuccess('Producto guardado en inventario');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err: any) {
      setError(`Error al guardar: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const acceptAll = () => {
    setProducts(prev => prev.map(p => ({ ...p, status: 'edited' })));
    setSuccess(`${products.length} productos aceptados`);
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleSaveToInventory = async () => {
    if (products.length === 0) {
      setError('No hay productos para guardar');
      return;
    }

    if (!boutiqueId) {
      setError('No se encontró tu boutique. Recarga la página.');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      const supabase = createClient();

      let totalSaved = 0;
      for (const p of products) {
        const { error: productError } = await supabase
          .from('products')
          .insert({
            name: p.name,
            brand: p.brand || null,
            season: p.season || null,
            size: p.size || null,
            color: p.color || null,
            purchase_price: p.purchase_price,
            sale_price: p.sale_price,
            stock: p.quantity,
            boutique_id: boutiqueId,
            created_at: new Date().toISOString(),
          });

        if (productError) {
          throw new Error(`Error al guardar "${p.name}": ${productError.message}`);
        }

        totalSaved++;
      }

      setSuccess(`${totalSaved} producto(s) guardado(s) correctamente`);
      setTimeout(() => {
        router.push('/ingresos');
      }, 1500);
    } catch (err: any) {
      setError(`Error al guardar: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Función cancelar - LLEVA AL INICIO (/)
  const handleCancel = () => {
    if (products.length > 0) {
      if (confirm('¿Estás seguro de que quieres cancelar? Se perderán todos los productos extraídos.')) {
        router.push('/dashboard');
      }
    } else {
      router.push('/dashboard');
    }
  };

  const resetAll = () => {
    setUploadedImages([]);
    setProducts([]);
    setError('');
    setSuccess('');
  };

  const totalInvestment = useMemo(
    () => products.reduce((sum, p) => sum + p.purchase_price * p.quantity, 0),
    [products]
  );

  const totalProducts = useMemo(
    () => products.reduce((sum, p) => sum + p.quantity, 0),
    [products]
  );

  const totalSaleValue = useMemo(
    () => products.reduce((sum, p) => sum + p.sale_price * p.quantity, 0),
    [products]
  );

  const newProductsCount = useMemo(
    () => products.filter(p => p.status === 'new').length,
    [products]
  );

  if (loadingBoutique) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-xl font-semibold text-zinc-700 dark:text-zinc-300">Cargando tu boutique...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] p-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto pb-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
              NUEVO INGRESO
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
              Sube tu ticket (factura) o ingresa productos manualmente
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-4 bg-white dark:bg-[#1a1a1a] rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-800"
              aria-label="Cambiar tema"
            >
              {theme === 'dark' ? (
                <Sun className="w-6 h-6 text-zinc-800 dark:text-zinc-200" />
              ) : (
                <Moon className="w-6 h-6 text-zinc-800 dark:text-zinc-200" />
              )}
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-5 md:px-6 py-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold rounded-2xl transition-colors border border-red-200 dark:border-red-900/50"
            >
              <X className="w-5 h-5" strokeWidth={3} />
              <span className="text-base md:text-lg">CANCELAR</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ============== COLUMNA IZQUIERDA ============== */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* ====== SECCIÓN 1: UPLOAD ====== */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 md:w-6 md:h-6" />
                Subir imágenes
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex items-center justify-center gap-3 min-h-[80px] bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-lg rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all active:scale-[0.98]"
                >
                  <ImageIcon className="w-6 h-6" strokeWidth={2.5} />
                  <span>Galería</span>
                </button>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center justify-center gap-3 min-h-[80px] bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-lg rounded-2xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all active:scale-[0.98]"
                >
                  <Camera className="w-6 h-6" strokeWidth={2.5} />
                  <span>Tomar foto</span>
                </button>
                <button
                  onClick={() => setShowManualForm(!showManualForm)}
                  className={`flex items-center justify-center gap-3 min-h-[80px] font-bold text-lg rounded-2xl shadow-lg transition-all active:scale-[0.98] ${
                    showManualForm
                      ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 shadow-zinc-500/20'
                      : 'bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-emerald-500/20 hover:shadow-emerald-500/40'
                  }`}
                >
                  <Edit3 className="w-6 h-6" strokeWidth={2.5} />
                  <span>Manual</span>
                </button>
              </div>

              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleGalleryChange}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraChange}
                className="hidden"
              />

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => galleryInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-6 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all"
              >
                <Upload className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Arrastra tu ticket aquí
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  JPG, PNG, WebP (máx 10MB c/u)
                </p>
              </div>

              {showManualForm && (
                <div className="mt-4 p-4 bg-zinc-50 dark:bg-[#0a0a0a] rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-3">Nuevo producto manual</h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Nombre *</label>
                      <input type="text" value={manualProduct.name} onChange={(e) => setManualProduct(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ej: Camiseta básica"
                        className="w-full bg-white dark:bg-[#1a1a1a] border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm font-semibold text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none placeholder:text-zinc-400" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Marca</label>
                      <input type="text" value={manualProduct.brand} onChange={(e) => setManualProduct(prev => ({ ...prev, brand: e.target.value }))}
                        className="w-full bg-white dark:bg-[#1a1a1a] border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Temporada</label>
                      <input type="text" value={manualProduct.season} onChange={(e) => setManualProduct(prev => ({ ...prev, season: e.target.value }))}
                        className="w-full bg-white dark:bg-[#1a1a1a] border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Talla</label>
                      <input type="text" value={manualProduct.size} onChange={(e) => setManualProduct(prev => ({ ...prev, size: e.target.value }))}
                        placeholder="Ej: M"
                        className="w-full bg-white dark:bg-[#1a1a1a] border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Color</label>
                      <input type="text" value={manualProduct.color} onChange={(e) => setManualProduct(prev => ({ ...prev, color: e.target.value }))}
                        placeholder="Ej: Rojo"
                        className="w-full bg-white dark:bg-[#1a1a1a] border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none" />
                    </div>
                      <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Precio compra *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">$</span>
                        <input type="number" step="0.01" value={manualProduct.purchase_price || ''} onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setManualProduct(prev => ({ ...prev, purchase_price: val, sale_price: calcSalePrice(val), sale_price_input: calcSalePrice(val) }));
                        }}
                          className="w-full bg-white dark:bg-[#1a1a1a] border-2 border-zinc-200 dark:border-zinc-700 rounded-xl pl-6 pr-3 py-2 text-sm font-semibold text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none text-right" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Precio venta</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">$</span>
                        <input type="number" step="0.01" value={manualProduct.sale_price_input || ''} onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setManualProduct(prev => ({ ...prev, sale_price: val, sale_price_input: val }));
                        }}
                          className="w-full bg-white dark:bg-[#1a1a1a] border-2 border-zinc-200 dark:border-zinc-700 rounded-xl pl-6 pr-3 py-2 text-sm font-semibold text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none text-right" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Cantidad *</label>
                      <input type="number" value={manualProduct.quantity || ''} onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === '') { setManualProduct(prev => ({ ...prev, quantity: 0 })); return; }
                        const num = parseInt(raw);
                        if (!isNaN(num) && num >= 0) setManualProduct(prev => ({ ...prev, quantity: num }));
                      }} min="0"
                        className="w-full bg-white dark:bg-[#1a1a1a] border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm font-semibold text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none text-right" />
                    </div>
                  </div>
                  <button onClick={addManualProduct}
                    disabled={!manualProduct.name.trim() || manualProduct.purchase_price <= 0 || isSaving}
                    className="w-full py-3 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-zinc-300 disabled:to-zinc-400 dark:disabled:from-zinc-700 dark:disabled:to-zinc-800 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" strokeWidth={3} />
                    ) : (
                      <Check className="w-4 h-4" strokeWidth={3} />
                    )}
                    {isSaving ? 'Guardando...' : 'Agregar producto'}
                  </button>
                </div>
              )}

              {isProcessing && (
                <div className="mt-4 flex items-center justify-center gap-3 text-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-semibold">Procesando imagen con IA...</span>
                </div>
              )}
              {error && (
                <div className="mt-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 dark:text-red-400 font-semibold text-sm">{error}</p>
                </div>
              )}
              {success && (
                <div className="mt-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-green-700 dark:text-green-400 font-semibold text-sm">{success}</p>
                </div>
              )}

              {uploadedImages.length > 0 && (
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 tracking-wider uppercase">
                      Imágenes cargadas ({uploadedImages.length})
                    </h3>
                    {uploadedImages.length > 1 && (
                      <button
                        onClick={resetAll}
                        className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-wider"
                      >
                        Limpiar todo
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {uploadedImages.map(img => (
                      <div key={img.id} className="relative group">
                        <img
                          src={img.preview}
                          alt="Preview"
                          className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-xl border-2 border-zinc-200 dark:border-zinc-700"
                        />
                        {img.productsCount > 0 && (
                          <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white dark:border-zinc-900">
                            {img.productsCount}
                          </div>
                        )}
                        <button
                          onClick={() => removeImage(img.id)}
                          className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ====== SECCIÓN 2: CÓDIGO DE BARRAS ====== */}
            <div className="bg-zinc-50 dark:bg-[#0a0a0a] rounded-3xl p-6 border-2 border-dashed border-zinc-300 dark:border-zinc-700 opacity-60">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-zinc-200 dark:bg-zinc-800 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <QrCode className="w-7 h-7 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-500 dark:text-zinc-400">Código de barras</h3>
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">Próximamente — escanea códigos de barras para agregar productos automáticamente</p>
                </div>
              </div>
            </div>

            {/* ====== SECCIÓN 3: PRODUCTOS EXTRAÍDOS ====== */}
            {products.length > 0 && (
              <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                  <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Package className="w-5 h-5 md:w-6 md:h-6" />
                    Productos extraídos
                    <span className="text-base font-normal text-zinc-500 dark:text-zinc-400">
                      ({products.length})
                    </span>
                  </h2>
                  {newProductsCount > 0 && (
                    <button
                      onClick={acceptAll}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl transition-colors"
                    >
                      <CheckCheck className="w-4 h-4" />
                      Aceptar todos
                    </button>
                  )}
                </div>

                {newProductsCount > 0 && (
                  <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3">
                    <Sparkles className="w-4 h-4" />
                    {newProductsCount} producto(s) nuevo(s) sin revisar · edítalos si es necesario
                  </div>
                )}

                <div className="space-y-2">
                  <div className="hidden md:grid md:grid-cols-10 gap-2 px-3 py-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                    <div className="col-span-3">Producto</div>
                    <div className="col-span-1">Talla</div>
                    <div className="col-span-1">Color</div>
                    <div className="col-span-1 text-right">Precio</div>
                    <div className="col-span-1 text-right">Stock</div>
                    <div className="col-span-3 text-right">Acción</div>
                  </div>

                  {products.map(product => (
                    <div
                      key={product.id}
                      className={`rounded-2xl border-2 transition-all ${
                        product.status === 'new'
                          ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/50'
                          : 'bg-zinc-50 dark:bg-[#0a0a0a] border-zinc-200 dark:border-zinc-800'
                      } ${editingId === product.id ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      {/* Mobile layout */}
                      <div className="md:hidden p-3">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Nombre del producto</label>
                            <input
                              type="text"
                              value={product.name}
                              onFocus={() => setEditingId(product.id)}
                              onBlur={() => setEditingId(null)}
                              onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                              placeholder="Ej: Camiseta básica"
                              className="w-full text-base font-bold bg-transparent border-2 border-transparent focus:border-blue-500 rounded-lg px-2 py-1 text-zinc-900 dark:text-white focus:outline-none placeholder:text-zinc-400"
                            />
                          </div>
                          <button onClick={() => removeProduct(product.id)}
                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-lg transition-colors ml-2 mt-5">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          <div>
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Talla</label>
                            <input type="text" value={product.size} placeholder="Ej: M" onChange={(e) => updateProduct(product.id, 'size', e.target.value)}
                              className="w-full bg-white dark:bg-[#1a1a1a] border-2 border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none placeholder:text-zinc-400" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Color</label>
                            <input type="text" value={product.color} placeholder="Ej: Rojo" onChange={(e) => updateProduct(product.id, 'color', e.target.value)}
                              className="w-full bg-white dark:bg-[#1a1a1a] border-2 border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none placeholder:text-zinc-400" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5 text-right">Precio</label>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">$</span>
                              <input type="number" step="0.01" value={product.purchase_price} onChange={(e) => updateProduct(product.id, 'purchase_price', parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                                className="w-full bg-white dark:bg-[#1a1a1a] border-2 border-zinc-200 dark:border-zinc-700 rounded-lg pl-5 pr-2 py-1.5 text-xs text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none placeholder:text-zinc-400 text-right" />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5 text-right">Stock</label>
                            <input type="number" value={product.quantity} placeholder="Cant." onChange={(e) => updateProduct(product.id, 'quantity', parseInt(e.target.value) || 0)}
                              className="w-full bg-white dark:bg-[#1a1a1a] border-2 border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none placeholder:text-zinc-400 text-right" />
                          </div>
                        </div>
                      </div>

                      {/* Desktop layout */}
                      <div className="hidden md:grid md:grid-cols-10 gap-2 items-center px-3 py-2.5">
                        <div className="col-span-3">
                          <input type="text" value={product.name} onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                            className="w-full text-sm font-semibold bg-transparent border-2 border-transparent focus:border-blue-500 rounded-lg px-2 py-1.5 text-zinc-900 dark:text-white focus:outline-none" />
                        </div>
                        <div className="col-span-1">
                          <input type="text" value={product.size} onChange={(e) => updateProduct(product.id, 'size', e.target.value)}
                            className="w-full bg-white dark:bg-[#0a0a0a] border-2 border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none" />
                        </div>
                        <div className="col-span-1">
                          <input type="text" value={product.color} onChange={(e) => updateProduct(product.id, 'color', e.target.value)}
                            className="w-full bg-white dark:bg-[#0a0a0a] border-2 border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none" />
                        </div>
                        <div className="col-span-1 relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">$</span>
                          <input type="number" step="0.01" value={product.purchase_price} onChange={(e) => updateProduct(product.id, 'purchase_price', parseFloat(e.target.value) || 0)}
                            className="w-full bg-white dark:bg-[#0a0a0a] border-2 border-zinc-200 dark:border-zinc-700 rounded-lg pl-5 pr-2 py-1.5 text-xs text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none text-right" />
                        </div>
                        <div className="col-span-1">
                          <input type="number" value={product.quantity} onChange={(e) => updateProduct(product.id, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-full bg-white dark:bg-[#0a0a0a] border-2 border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none text-right" />
                        </div>
                        <div className="col-span-3 flex justify-end">
                          <button onClick={() => removeProduct(product.id)}
                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ============== COLUMNA DERECHA: RESUMEN ============== */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 lg:sticky lg:top-6">
              <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
                Resumen
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center py-3 border-b border-zinc-200 dark:border-zinc-700">
                  <span className="text-zinc-600 dark:text-zinc-400 font-semibold">Productos:</span>
                  <span className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white">
                    {totalProducts}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-zinc-200 dark:border-zinc-700">
                  <span className="text-zinc-600 dark:text-zinc-400 font-semibold">Inversión:</span>
                  <span className="text-xl md:text-2xl font-black text-blue-600 dark:text-blue-400">
                    ${totalInvestment.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-zinc-200 dark:border-zinc-700">
                  <span className="text-zinc-600 dark:text-zinc-400 font-semibold">Valor venta:</span>
                  <span className="text-xl md:text-2xl font-black text-green-600 dark:text-green-400">
                    ${totalSaleValue.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 px-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <span className="text-zinc-700 dark:text-zinc-300 font-bold">Ganancia:</span>
                  <span className="text-xl md:text-2xl font-black text-green-700 dark:text-green-400">
                    ${(totalSaleValue - totalInvestment).toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleSaveToInventory}
                disabled={isSaving || products.length === 0}
                className="w-full min-h-[90px] bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-zinc-300 disabled:to-zinc-400 dark:disabled:from-zinc-700 dark:disabled:to-zinc-800 disabled:cursor-not-allowed text-white font-black text-xl md:text-2xl tracking-wider rounded-2xl shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 disabled:shadow-none flex items-center justify-center gap-3 transition-all duration-150 active:scale-[0.98] px-4"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-7 h-7 animate-spin" />
                    <span>GUARDANDO...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-7 h-7" strokeWidth={3} />
                    <span>GUARDAR EN INVENTARIO</span>
                  </>
                )}
              </button>

              {products.length === 0 && (
                <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-3">
                  Sube una imagen para empezar
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { 
  Upload, 
  X, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Trash2,
  ShoppingCart,
  Package,
  FileText,
  Check,
  ArrowLeft,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from 'next-themes';

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Product {
  name: string;
  brand: string;
  season: string;
  purchase_price: number;
  quantity: number;
  edited?: boolean;
}

export default function NewIncomePage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (file: File) => {
    setError('');
    setSuccess('');
    
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Tipo de archivo no válido. Use JPG, PNG o WebP');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('La imagen es muy grande. Máximo 10MB');
      return;
    }

    setSelectedFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    processImage(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setError('');
    setProducts([]);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/extract-invoice', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la imagen');
      }

      if (data.products.length === 0) {
        setError('No se encontraron productos en la imagen. Intenta con otra foto más clara');
      } else {
        setProducts(data.products);
        setSuccess(`${data.products.length} productos encontrados`);
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar la imagen. Intente de nuevo');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateProduct = (index: number, field: keyof Product, value: any) => {
    const updated = [...products];
    updated[index] = {
      ...updated[index],
      [field]: value,
      edited: true,
    };
    setProducts(updated);
  };

  const removeProduct = (index: number) => {
    const updated = products.filter((_, i) => i !== index);
    setProducts(updated);
  };

  const handleSaveToInventory = async () => {
    if (products.length === 0) {
      setError('No hay productos para guardar');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const productsToInsert = products.map((product) => ({
        name: product.name,
        brand: product.brand,
        season: product.season,
        purchase_price: product.purchase_price,
        quantity: product.quantity,
        created_at: new Date().toISOString(),
      }));

      const { data, error: supabaseError } = await supabase
        .from('products')
        .insert(productsToInsert);

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      setSuccess(`${products.length} productos guardados exitosamente`);
      
      setTimeout(() => {
        router.push('/ingresos');
      }, 2000);
    } catch (err: any) {
      setError(`Error al guardar: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewImage(null);
    setProducts([]);
    setError('');
    setSuccess('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const totalInvestment = useMemo(() => {
    return products.reduce(
      (sum, p) => sum + p.purchase_price * p.quantity,
      0
    );
  }, [products]);

  const totalProducts = useMemo(() => {
    return products.reduce((sum, p) => sum + p.quantity, 0);
  }, [products]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] p-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              NUEVO INGRESO
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-6 h-6 text-zinc-800 dark:text-zinc-200" />
              ) : (
                <Moon className="w-6 h-6 text-zinc-800 dark:text-zinc-200" />
              )}
            </button>
            <button
              onClick={handleCancel}
              className="px-8 py-4 text-xl font-bold bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              CANCELAR
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Upload & Products */}
          <div className="space-y-6">
            {/* Upload Zone */}
            {!previewImage && (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-12 text-center hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors bg-white dark:bg-zinc-900"
              >
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer space-y-4"
                >
                  <div className="flex justify-center">
                    <div className="p-6 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
                      <Upload className="w-10 h-10 text-zinc-800 dark:text-zinc-200" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xl font-medium mb-1">
                      Arrastra una foto de tu factura
                    </p>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-4">
                      o haz clic para seleccionar
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="inline-flex items-center gap-3 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      <FileText className="w-6 h-6" />
                      Usar cámara
                    </button>
                  </div>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              capture="environment"
              onChange={handleInputChange}
              className="hidden"
            />

            {/* Image Preview */}
            {previewImage && (
              <div className="relative bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="w-full max-h-96 object-contain"
                />
                <button
                  onClick={resetForm}
                  className="absolute top-4 right-4 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <X className="w-6 h-6 text-zinc-800 dark:text-zinc-200" />
                </button>
              </div>
            )}

            {/* Processing State */}
            {isProcessing && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center">
                <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-zinc-800 dark:text-zinc-200" />
                <p className="font-medium text-lg">Procesando factura...</p>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                  La IA está extrayendo los productos
                </p>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/50 rounded-2xl p-6 flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-destructive text-lg">{error}</p>
                </div>
              </div>
            )}

            {/* Success Alert */}
            {success && !error && (
              <div className="bg-green-500/10 border border-green-500/50 rounded-2xl p-6 flex items-start gap-4 dark:bg-green-900/20">
                <CheckCircle2 className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-600 dark:text-green-400 text-lg">
                    {success}
                  </p>
                </div>
              </div>
            )}

            {/* Products List */}
            {products.length > 0 && !isProcessing && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold flex items-center gap-3 text-zinc-900 dark:text-white">
                    <Package className="w-6 h-6" />
                    Productos detectados ({products.length})
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                  >
                    Nueva foto
                  </button>
                </div>

                <div className="space-y-4">
                  {products.map((product, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-medium text-zinc-500 dark:text-zinc-400">
                            #{index + 1}
                          </span>
                          {product.edited && (
                            <span className="text-sm text-amber-500">
                              Editado
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => removeProduct(index)}
                          className="p-3 hover:bg-destructive/10 hover:text-destructive rounded-xl transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">
                            Nombre del producto
                          </label>
                          <input
                            type="text"
                            value={product.name}
                            onChange={(e) =>
                              updateProduct(index, 'name', e.target.value)
                            }
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Nombre del producto"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">
                            Marca
                          </label>
                          <input
                            type="text"
                            value={product.brand}
                            onChange={(e) =>
                              updateProduct(index, 'brand', e.target.value)
                            }
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Marca"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">
                            Temporada
                          </label>
                          <input
                            type="text"
                            value={product.season}
                            onChange={(e) =>
                              updateProduct(index, 'season', e.target.value)
                            }
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Temporada"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">
                            Precio de compra
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={product.purchase_price}
                            onChange={(e) =>
                              updateProduct(
                                index,
                                'purchase_price',
                                parseFloat(e.target.value)
                              )
                            }
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">
                            Cantidad
                          </label>
                          <input
                            type="number"
                            value={product.quantity}
                            onChange={(e) =>
                              updateProduct(
                                index,
                                'quantity',
                                parseInt(e.target.value)
                              )
                            }
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="1"
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                        <span className="text-lg text-zinc-500 dark:text-zinc-400">
                          Subtotal:
                        </span>
                        <span className="font-bold text-xl text-zinc-900 dark:text-white">
                          ${(product.purchase_price * product.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between text-lg">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Total de productos:
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-white">{products.length}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Unidades totales:
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-white">{totalProducts}</span>
                  </div>
                  <div className="flex justify-between text-2xl font-bold pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-500 dark:text-zinc-400">Inversión total:</span>
                    <span className="text-zinc-900 dark:text-white">${totalInvestment.toFixed(2)}</span>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveToInventory}
                  disabled={isSaving}
                  className="w-full py-5 bg-gradient-to-br from-green-500 to-green-600 text-white font-bold text-2xl rounded-2xl shadow-xl shadow-green-500/30 flex items-center justify-center gap-3 transition-all duration-150 active:scale-95"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Check className="w-8 h-8" />
                      Guardar en inventario
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Cart/Summary */}
          <div className="lg:sticky lg:top-6 h-fit">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
              <h2 className="text-xl font-semibold flex items-center gap-3 mb-6 text-zinc-900 dark:text-white">
                <ShoppingCart className="w-6 h-6" />
                Resumen
              </h2>

              {products.length === 0 && !isProcessing && (
                <div className="text-center py-12">
                  <div className="inline-flex p-6 bg-zinc-100 dark:bg-zinc-800 rounded-2xl mb-4">
                    <FileText className="w-10 h-10 text-zinc-800 dark:text-zinc-200" />
                  </div>
                  <p className="font-medium text-xl mb-1 text-zinc-900 dark:text-white">
                    Sin productos
                  </p>
                  <p className="text-lg text-zinc-500 dark:text-zinc-400">
                    Sube una foto de tu factura para comenzar
                  </p>
                </div>
              )}

              {products.length > 0 && (
                <div className="space-y-4">
                  <div className="space-y-3 max-h-96 overflow-auto">
                    {products.map((product, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between gap-3 py-3 border-b border-zinc-200 dark:border-zinc-800 last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-lg text-zinc-900 dark:text-white truncate">
                            {product.name}
                          </p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {product.brand} • Cant: {product.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-lg text-zinc-900 dark:text-white">
                            ${(product.purchase_price * product.quantity).toFixed(2)}
                          </p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            ${product.purchase_price.toFixed(2)} c/u
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                    <div className="flex justify-between text-lg">
                      <span className="text-zinc-500 dark:text-zinc-400">Productos:</span>
                      <span className="text-zinc-900 dark:text-white">{products.length}</span>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span className="text-zinc-500 dark:text-zinc-400">Unidades totales:</span>
                      <span className="text-zinc-900 dark:text-white">{totalProducts}</span>
                    </div>
                    <div className="flex justify-between text-2xl font-bold pt-2 border-t border-zinc-200 dark:border-zinc-800">
                      <span className="text-zinc-500 dark:text-zinc-400">Total:</span>
                      <span className="text-zinc-900 dark:text-white">${totalInvestment.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
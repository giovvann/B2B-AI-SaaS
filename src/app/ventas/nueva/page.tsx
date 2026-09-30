'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { db, uuid } from '@/lib/db';
import { writeLocal } from '@/lib/sync';
import { data } from '@/lib/data';
import { ShoppingCart, Plus, Minus, Trash2, Search, CreditCard, Banknote, Wallet, CheckCircle, Sun, Moon, X, Ruler, Palette } from 'lucide-react';
import { useTheme } from 'next-themes';
import { displaySize, displayColor } from '@/lib/product-utils';
import { useToast } from '@/components/toast';

interface Product {
  id: string;
  name: string;
  brand: string | null;
  season: string | null;
  size: string | null;
  color: string | null;
  purchase_price: number;
  sale_price: number;
  stock: number;
}

interface CartItem {
  id: string;
  productId: string;
  name: string;
  purchase_price: number;
  sale_price: number;
  quantity: number;
  maxStock: number;
}

export default function NuevaVentaPage() {
  const router = useRouter();
  const { error, success } = useToast();
  const { theme, setTheme } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia'>('Efectivo');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [boutiqueId, setBoutiqueId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchBoutiqueAndProducts();
  }, []);

  const fetchBoutiqueAndProducts = async () => {
    try {
      setLoadingProducts(true);
      const { data: { user } } = await createClient().auth.getUser();
      if (!user) return;

      const boutique = await data.getBoutique();
      if (!boutique) return;
      setBoutiqueId(boutique.id);

      const products = await data.getProducts(boutique.id);
      setProducts(products as any);
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);
      if (existingItem) {
        if (existingItem.quantity < product.stock) {
          return prevCart.map(item =>
            item.id === existingItem.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return prevCart;
      }
      return [...prevCart, {
        id: `cart_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        productId: product.id,
        name: displaySize(product.size) || displayColor(product.color)
          ? `${product.name}${displaySize(product.size) ? ' (' + displaySize(product.size) : ''}${displayColor(product.color) ? ' ' + displayColor(product.color) : ''}${displaySize(product.size) || displayColor(product.color) ? ')' : ''}`
          : product.name,
        purchase_price: product.purchase_price,
        sale_price: product.sale_price,
        quantity: 1,
        maxStock: product.stock,
      }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === itemId) {
          const newQuantity = Math.max(1, Math.min(item.quantity + delta, item.maxStock));
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const total = useMemo(() =>
    cart.reduce((sum, item) => sum + (item.sale_price * item.quantity), 0),
    [cart]
  );

  const completeSale = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const { data: { user } } = await createClient().auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      let bid = boutiqueId;
      if (!bid) {
        const { data: boutique } = await createClient()
          .from('boutiques')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();
        if (!boutique) throw new Error('No se encontro la boutique');
        bid = boutique.id;
      }

      const saleId = uuid();
      const now = new Date().toISOString();

      // Escribir venta localmente
      await writeLocal('sales', 'insert', {
        id: saleId,
        boutique_id: bid,
        total_amount: total,
        payment_method: paymentMethod,
        created_at: now,
        updated_at: now,
      });

      // Escribir items localmente
      const itemRows = cart.map(item => ({
        id: uuid(),
        sale_id: saleId,
        product_id: item.productId,
        quantity: item.quantity,
        price_at_sale: item.sale_price,
        cost_at_sale: item.purchase_price,
      }));
      for (const it of itemRows) {
        await writeLocal('sale_items', 'insert', it);
      }

      // Ajustar stock localmente (lee stock actual de Dexie)
      for (const item of cart) {
        const p = await db.products.get(item.productId);
        if (p) {
          await writeLocal('products', 'update', {
            id: item.productId,
            stock: Math.max(0, (p.stock ?? 0) - item.quantity),
          });
        }
      }

      const charged = total;
      setShowSuccess(true);
      setTimeout(() => {
        setCart([]);
        setShowSuccess(false);
        success(`Venta $${charged.toFixed(2)} guardada`, 'Lista para la siguiente clienta');
      }, 1200);
    } catch (err) {
      console.error('Error completando venta:', err);
      error('Error al completar la venta', (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() =>
    products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.size || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.color || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.season || '').toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [products, searchTerm]
  );

  if (!mounted) {
    return (
      <div className="min-h-screen bg-espresso-50 dark:bg-[#0d0b09] p-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between pr-20">
            <div className="h-12 w-48 bg-espresso-200 dark:bg-[#262019] rounded-2xl animate-pulse"></div>
            <div className="h-12 w-40 bg-espresso-200 dark:bg-[#262019] rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gold-500 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-32 h-32 text-white mx-auto mb-6" strokeWidth={2} />
          <h1 className="text-5xl font-black text-white mb-4">VENTA COMPLETADA</h1>
          <p className="text-2xl text-white">Venta guardada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-espresso-50 dark:bg-[#0d0b09] p-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between pr-20">
          <h1 className="text-4xl font-extrabold tracking-tight text-espresso-900 dark:text-white">NUEVA VENTA</h1>
          <div className="flex items-center gap-4">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-4 bg-espresso-100 dark:bg-[#201b16] rounded-2xl hover:bg-espresso-200 dark:hover:bg-espresso-700 transition-colors">
              {theme === 'dark' ? <Sun className="w-6 h-6 text-espresso-800 dark:text-espresso-200" /> : <Moon className="w-6 h-6 text-espresso-800 dark:text-espresso-200" />}
            </button>
            <button onClick={() => router.push('/ingresos/nuevo')}
              className="flex items-center gap-2 px-5 md:px-6 py-4 bg-gold-50 dark:bg-gold-900/20 hover:bg-gold-100 dark:hover:bg-gold-900/30 text-gold-600 dark:text-gold-400 font-bold rounded-2xl transition-colors border border-gold-200 dark:border-gold-800/50">
              <ShoppingCart className="w-5 h-5" />
              <span className="text-base md:text-lg">AGREGAR PRODUCTO</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-espresso-400" />
              <input type="text" placeholder="Buscar por nombre, marca, talla, color..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-5 text-lg border-2 rounded-2xl focus:border-gold-400 focus:outline-none bg-white dark:bg-[#16130f] border-espresso-300 dark:border-espresso-700" />
            </div>

            <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto">
              {loadingProducts ? (
                <div className="text-center py-16 text-espresso-600 dark:text-espresso-500">
                  <div className="animate-spin w-12 h-12 border-4 border-espresso-300 dark:border-espresso-700 border-t-gold-400 rounded-full mx-auto mb-4"></div>
                  <p className="text-xl font-semibold">Cargando productos...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16 text-espresso-600 dark:text-espresso-500">
                  <ShoppingCart className="w-20 h-20 mx-auto mb-4 opacity-50" />
                  <p className="text-xl font-semibold">No hay productos</p>
                  <p className="text-sm mt-1">Agrega productos desde &quot;Nuevo Ingreso&quot; para empezar a vender</p>
                  <button onClick={() => router.push('/ingresos/nuevo')}
                    className="mt-6 px-6 py-4 bg-espresso-900 dark:bg-white text-white dark:text-espresso-900 font-bold rounded-2xl transition-all active:scale-[0.98]">
                    Agregar producto ahora
                  </button>
                </div>
              ) : (
                filteredProducts.map(product => (
                  <button key={product.id} onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                    className={`p-5 rounded-2xl font-bold text-left transition-all ${
                      product.stock === 0
                        ? 'bg-espresso-100 dark:bg-[#16130f] text-espresso-400 cursor-not-allowed'
                        : 'bg-white dark:bg-[#16130f] hover:bg-gold-50 dark:hover:bg-espresso-800 border-2 border-espresso-200 dark:border-espresso-700 hover:border-gold-400 shadow-sm hover:shadow-md'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="text-xl text-espresso-900 dark:text-white truncate">{product.name}</div>
                        {(displaySize(product.size) || displayColor(product.color)) && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {displaySize(product.size) && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gold-50 dark:bg-gold-900/20 text-gold-700 dark:text-gold-300 text-[10px] font-bold rounded">
                                <Ruler className="w-2.5 h-2.5" /> {displaySize(product.size)}
                              </span>
                            )}
                            {displayColor(product.color) && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gold-50 dark:bg-gold-900/30 text-gold-700 dark:text-gold-300 text-[10px] font-bold rounded">
                                <Palette className="w-2.5 h-2.5" /> {displayColor(product.color)}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="text-xs text-espresso-600 dark:text-espresso-400 mt-1">Stock: {product.stock}</div>
                      </div>
                      <div className="text-2xl font-black text-gold-600 dark:text-gold-400 flex-shrink-0 ml-3">
                        ${product.sale_price.toFixed(2)}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-[#16130f] rounded-3xl shadow-xl p-6 space-y-6 border border-espresso-200 dark:border-[rgba(200,164,118,0.16)] h-fit">
            <h2 className="text-3xl font-extrabold tracking-tight text-espresso-900 dark:text-white flex items-center gap-3">
              <ShoppingCart className="w-8 h-8" /> CARRITO
            </h2>

            {cart.length === 0 ? (
              <div className="text-center py-12 text-espresso-400">
                <ShoppingCart className="w-24 h-24 mx-auto mb-4 opacity-50" />
                <p className="text-xl font-semibold">El carrito está vacío</p>
                <p className="text-sm">Haz clic en un producto para agregarlo</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.id} className="bg-espresso-50 dark:bg-[#0d0b09] rounded-xl p-4 flex items-center justify-between border border-espresso-200 dark:border-[rgba(200,164,118,0.16)]">
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="font-bold text-lg text-espresso-900 dark:text-white truncate">{item.name}</div>
                        <div className="text-espresso-600 dark:text-espresso-400">${item.sale_price.toFixed(2)} c/u</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => updateQuantity(item.id, -1)}
                          className="w-10 h-10 bg-espresso-200 dark:bg-[#262019] hover:bg-espresso-300 dark:hover:bg-espresso-600 rounded-lg flex items-center justify-center transition-colors">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-xl font-black w-8 text-center text-espresso-900 dark:text-white">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)}
                          disabled={item.quantity >= item.maxStock}
                          className="w-10 h-10 bg-espresso-700 hover:bg-espresso-800 disabled:bg-espresso-300 dark:disabled:bg-espresso-700 text-white rounded-lg flex items-center justify-center transition-colors">
                          <Plus className="w-4 h-4" />
                        </button>
                        <button onClick={() => removeFromCart(item.id)}
                          className="ml-1 w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-espresso-600 dark:text-espresso-400 tracking-wider">METODO DE PAGO</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => setPaymentMethod('Efectivo')}
                      className={`min-h-[80px] rounded-xl font-bold text-sm flex flex-col items-center justify-center gap-2 transition-all ${
                        paymentMethod === 'Efectivo'
                          ? 'bg-gold-400 text-white shadow-lg shadow-gold-400/40 ring-2 ring-gold-500/20'
                          : 'bg-espresso-100 dark:bg-[#0d0b09] text-espresso-700 dark:text-espresso-300 hover:bg-espresso-200 dark:hover:bg-espresso-800 border border-espresso-200 dark:border-espresso-700'
                      }`}>
                      <Banknote className="w-6 h-6" />
                      <span>Efectivo</span>
                    </button>
                    <button onClick={() => setPaymentMethod('Tarjeta')}
                      className={`min-h-[80px] rounded-xl font-bold text-sm flex flex-col items-center justify-center gap-2 transition-all ${
                        paymentMethod === 'Tarjeta'
                          ? 'bg-gold-400 text-white shadow-lg shadow-gold-400/40 ring-2 ring-gold-500/20'
                          : 'bg-espresso-100 dark:bg-[#0d0b09] text-espresso-700 dark:text-espresso-300 hover:bg-espresso-200 dark:hover:bg-espresso-800 border border-espresso-200 dark:border-espresso-700'
                      }`}>
                      <CreditCard className="w-6 h-6" />
                      <span>Tarjeta</span>
                    </button>
                    <button onClick={() => setPaymentMethod('Transferencia')}
                      className={`min-h-[80px] rounded-xl font-bold text-sm flex flex-col items-center justify-center gap-2 transition-all ${
                        paymentMethod === 'Transferencia'
                          ? 'bg-gold-400 text-white shadow-lg shadow-gold-400/40 ring-2 ring-gold-500/20'
                          : 'bg-espresso-100 dark:bg-[#0d0b09] text-espresso-700 dark:text-espresso-300 hover:bg-espresso-200 dark:hover:bg-espresso-800 border border-espresso-200 dark:border-espresso-700'
                      }`}>
                      <Wallet className="w-6 h-6" />
                      <span>Transfer.</span>
                    </button>
                  </div>
                </div>

                <div className="bg-espresso-100 dark:bg-[#0d0b09] rounded-2xl p-6 border border-espresso-200 dark:border-[rgba(200,164,118,0.16)]">
                  <div className="text-4xl font-extrabold tracking-tight text-espresso-900 dark:text-white text-center">
                    ${total.toFixed(2)}
                  </div>
                  <div className="text-center text-xs text-espresso-600 dark:text-espresso-400 mt-1 font-semibold tracking-wider">TOTAL A COBRAR</div>
                </div>

                <button onClick={completeSale} disabled={loading || cart.length === 0}
                  className="w-full min-h-[90px] bg-gradient-to-br from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 disabled:from-espresso-300 disabled:to-espresso-400 dark:disabled:from-espresso-700 dark:disabled:to-espresso-800 text-white font-black text-2xl tracking-wider rounded-2xl shadow-xl shadow-gold-500/30 flex items-center justify-center gap-3 transition-all duration-150 active:scale-[0.98]">
                  {loading ? (
                    <><div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full"></div><span>PROCESANDO...</span></>
                  ) : (
                    <><CheckCircle className="w-8 h-8" strokeWidth={2.5} /><span>COBRAR</span></>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

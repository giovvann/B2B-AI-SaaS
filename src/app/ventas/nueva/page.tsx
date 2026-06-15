'use client';
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Plus, Minus, Trash2, Search, CreditCard, Banknote, Wallet, CheckCircle, Sun, Moon, ArrowLeft } from 'lucide-react';
import { useTheme } from 'next-themes';
interface Product {
  id: string;
  name: string;
  sale_price: number;
  stock: number;
}
interface CartItem extends Product {
  quantity: number;
}
export default function NuevaVentaPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia'>('Efectivo');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const { data, error } = await createClient()
        .from('products')
        .select('id, name, sale_price, stock')
        .order('name');
      
      if (error) throw error;
      if (data) setProducts(data);
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity < product.stock) {
          return prevCart.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return prevCart;
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === productId) {
          const newQuantity = Math.max(1, Math.min(item.quantity + delta, item.stock));
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

      const { data: boutique, error: boutiqueError } = await createClient()
        .from('boutiques')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (boutiqueError || !boutique) {
        throw new Error('No se encontró la boutique');
      }

      const { data: sale, error: saleError } = await createClient()
        .from('sales')
        .insert({
          boutique_id: boutique.id,
          total_amount: total,
          payment_method: paymentMethod,
        })
        .select()
        .single();

      if (saleError || !sale) throw saleError || new Error('Error creando venta');

      const saleItems = cart.map(item => ({
        sale_id: sale.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_sale: item.sale_price,
        cost_at_sale: 0,
      }));

      const { error: itemsError } = await createClient()
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      setShowSuccess(true);
      setTimeout(() => {
        setCart([]);
        setShowSuccess(false);
        router.push('/');
      }, 2000);

    } catch (error) {
      console.error('Error completando venta:', error);
      alert('Error al completar la venta: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() =>
    products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [products, searchTerm]
  );

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] p-4 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between pr-20">
            <div className="h-12 w-48 bg-zinc-200 dark:bg-zinc-700 rounded-2xl animate-pulse"></div>
            <div className="h-12 w-40 bg-zinc-200 dark:bg-zinc-700 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-green-500 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-32 h-32 text-white mx-auto mb-6" strokeWidth={2} />
          <h1 className="text-5xl font-black text-white mb-4">¡VENTA COMPLETADA!</h1>
          <p className="text-2xl text-white">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] p-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between pr-20">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            NUEVA VENTA
          </h1>
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
              onClick={() => router.push('/')}
              className="px-8 py-4 text-xl font-bold bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              CANCELAR
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de productos */}
          <div className="space-y-4">
            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-5 text-lg border-2 rounded-2xl focus:border-blue-500 focus:outline-none bg-white dark:bg-[#1a1a1a] border-zinc-300 dark:border-zinc-700"
              />
            </div>

            {/* Productos */}
            <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto">
              {loadingProducts ? (
                <div className="text-center py-16 text-zinc-400 dark:text-zinc-500">
                  <div className="animate-spin w-12 h-12 border-4 border-zinc-300 dark:border-zinc-700 border-t-blue-500 rounded-full mx-auto mb-4"></div>
                  <p className="text-xl font-semibold">Cargando productos...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16 text-zinc-400 dark:text-zinc-500">
                  <ShoppingCart className="w-20 h-20 mx-auto mb-4 opacity-50" />
                  <p className="text-xl font-semibold">No hay productos</p>
                  <p className="text-sm mt-1">Agrega productos desde Supabase para empezar a vender</p>
                </div>
              ) : (
                filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                    className={`
                      p-5 rounded-2xl font-bold text-left transition-all
                       ${product.stock === 0
                        ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed'
                        : 'bg-white dark:bg-[#1a1a1a] hover:bg-blue-50  dark:hover:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 hover:border-blue-500 shadow-sm hover:shadow-md'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xl text-zinc-900 dark:text-white">{product.name}</div>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                          Stock: {product.stock}
                        </div>
                      </div>
                      <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                        ${product.sale_price.toFixed(2)}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Carrito */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-xl p-6 space-y-6 border border-zinc-200 dark:border-zinc-800 h-fit">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
              <ShoppingCart className="w-8 h-8" />
              CARRITO
            </h2>

            {cart.length === 0 ? (
              <div className="text-center py-12 text-zinc-400">
                <ShoppingCart className="w-24 h-24 mx-auto mb-4 opacity-50" />
                <p className="text-xl font-semibold">El carrito está vacío</p>
                <p className="text-sm">Haz clic en un producto para agregarlo</p>
              </div>
            ) : (
              <>
                {/* Items del carrito */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.id} className="bg-zinc-50 dark:bg-[#0a0a0a] rounded-xl p-4 flex items-center justify-between border border-zinc-200 dark:border-zinc-800">
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="font-bold text-lg text-zinc-900 dark:text-white truncate">{item.name}</div>
                        <div className="text-zinc-600 dark:text-zinc-400">${item.sale_price.toFixed(2)} c/u</div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-10 h-10 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded-lg flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        
                        <span className="text-xl font-black w-8 text-center text-zinc-900 dark:text-white">
                          {item.quantity}
                        </span>
                        
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          disabled={item.quantity >= item.stock}
                          className="w-10 h-10 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white rounded-lg flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="ml-1 w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Método de pago */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 tracking-wider">MÉTODO DE PAGO</label>
                  <div className="grid grid-cols-3 gap-3">
                    <PaymentButton
                      icon={<Banknote className="w-6 h-6" />}
                      label="Efectivo"
                      selected={paymentMethod === 'Efectivo'}
                      onClick={() => setPaymentMethod('Efectivo')}
                    />
                    <PaymentButton
                      icon={<CreditCard className="w-6 h-6" />}
                      label="Tarjeta"
                      selected={paymentMethod === 'Tarjeta'}
                      onClick={() => setPaymentMethod('Tarjeta')}
                    />
                    <PaymentButton
                      icon={<Wallet className="w-6 h-6" />}
                      label="Transfer."
                      selected={paymentMethod === 'Transferencia'}
                      onClick={() => setPaymentMethod('Transferencia')}
                    />
                  </div>
                </div>

                {/* Total */}
                <div className="bg-zinc-100 dark:bg-[#0a0a0a] rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white text-center">
                    ${total.toFixed(2)}
                  </div>
                  <div className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-semibold tracking-wider">TOTAL A COBRAR</div>
                </div>

                {/* Botón cobrar */}
                <button
                  onClick={completeSale}
                  disabled={loading || cart.length === 0}
                  className="w-full min-h-[90px] bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-zinc-300 disabled:to-zinc-400 dark:disabled:from-zinc-700 dark:disabled:to-zinc-800 text-white font-black text-2xl tracking-wider rounded-2xl shadow-xl shadow-green-500/30 flex items-center justify-center gap-3 transition-all duration-150 active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full"></div>
                      <span>PROCESANDO...</span>
                    </div>
                  ) : (
                    <>
                      <CheckCircle className="w-8 h-8" strokeWidth={2.5} />
                      <span>COBRAR</span>
                    </>
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

interface PaymentButtonProps {
  icon: React.ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
}

function PaymentButton({ icon, label, selected, onClick }: PaymentButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[80px] rounded-xl font-bold text-sm flex flex-col items-center justify-center gap-2 transition-all ${selected ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40 ring-2 ring-blue-500/20' : 'bg-zinc-100 dark:bg-[#0a0a0a] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700'}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
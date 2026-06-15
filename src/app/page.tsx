'use client';
import { ShoppingBag, ScanLine, BarChart3, Sun, Moon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

export default function Home() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [clickedId, setClickedId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAction = (id: string, path: string) => {
    setClickedId(id);
    setTimeout(() => router.push(path), 200);
  };

  if (!mounted) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl space-y-6">
          <h1 className="text-center text-5xl font-black text-slate-900 dark:text-white mb-12 tracking-tight">
            MI TIENDA
          </h1>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex flex-col items-center justify-center p-6 transition-colors duration-300">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-center text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            MI TIENDA
          </h1>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-8 h-8 text-slate-800 dark:text-slate-200" />
            ) : (
              <Moon className="w-8 h-8 text-slate-800 dark:text-slate-200" />
            )}
          </button>
        </div>

        <GiantButton
          id="venta"
          onClick={() => handleAction('venta', '/ventas/nueva')}
          color="emerald"
          icon={<ShoppingBag className="w-16 h-16" strokeWidth={2.5} />}
          label="NUEVA VENTA"
          active={clickedId === 'venta'}
        />

        <GiantButton
          id="ia"
          onClick={() => handleAction('ia', '/ingresos/nuevo')}
          color="blue"
          icon={<ScanLine className="w-16 h-16" strokeWidth={2.5} />}
          label="INGRESO EXPRES (IA)"
          active={clickedId === 'ia'}
        />

        <GiantButton
          id="negocio"
          onClick={() => handleAction('negocio', '/metricas')}
          color="violet"
          icon={<BarChart3 className="w-16 h-16" strokeWidth={2.5} />}
          label="VER MI NEGOCIO"
          active={clickedId === 'negocio'}
        />
      </div>
    </main>
  );
}

type ButtonColor = 'emerald' | 'blue' | 'violet';
interface GiantButtonProps {
  id: string;
  onClick: () => void;
  color: ButtonColor;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

const colorMap: Record<ButtonColor, string> = {
  emerald: 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/40',
  blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/40',
  violet: 'from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 shadow-violet-500/40',
};

function GiantButton({ onClick, color, icon, label, active }: GiantButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full min-h-[140px] md:min-h-[160px] bg-gradient-to-br ${colorMap[color]} text-white font-black text-2xl md:text-3xl tracking-wider rounded-3xl shadow-2xl flex items-center justify-center gap-5 transition-all duration-150 ease-out active:scale-95 active:shadow-lg ${active ? 'scale-95 cash-register-flash' : 'hover:scale-[1.02]'}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
-- Agregar columnas para toggles de configuración del dueño
ALTER TABLE boutiques
ADD COLUMN IF NOT EXISTS auto_accept_employees BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS pin_required BOOLEAN DEFAULT true;

-- ============================================
-- MIGRACIÓN: Actualizar tablas de Finanzas
-- Fecha: 2026-01-18
-- Descripción: Agrega campos adicionales a purchases y quotes
-- ============================================

-- ============================================
-- ACTUALIZAR TABLA: purchases
-- ============================================

-- Agregar campo description
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS description TEXT;

-- Agregar campo payment_method
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20)
  CHECK (payment_method IN ('efectivo', 'transferencia', 'tarjeta', 'credito'));

-- Agregar campo invoice_number
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);

-- Índice para búsquedas por proveedor
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier);

-- Índice para búsquedas por estado
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);

-- Índice para búsquedas por fecha
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchased_at);

-- ============================================
-- ACTUALIZAR TABLA: quotes
-- ============================================

-- Agregar campo description
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS description TEXT;

-- Actualizar constraint de status para incluir 'vencida'
-- Primero eliminamos el constraint existente y creamos uno nuevo
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_status_check;
ALTER TABLE quotes ADD CONSTRAINT quotes_status_check
  CHECK (status IN ('pendiente', 'aprobada', 'rechazada', 'vencida'));

-- Índice para búsquedas por proveedor
CREATE INDEX IF NOT EXISTS idx_quotes_supplier ON quotes(supplier);

-- Índice para búsquedas por estado
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);

-- Índice para búsquedas por fecha de vigencia
CREATE INDEX IF NOT EXISTS idx_quotes_valid_until ON quotes(valid_until);

-- ============================================
-- FUNCIÓN: Auto-vencer cotizaciones expiradas
-- ============================================
CREATE OR REPLACE FUNCTION check_expired_quotes()
RETURNS TRIGGER AS $$
BEGIN
  -- Si la cotización tiene fecha de vigencia y ya pasó, marcarla como vencida
  IF NEW.valid_until IS NOT NULL
     AND NEW.valid_until < NOW()
     AND NEW.status = 'pendiente' THEN
    NEW.status := 'vencida';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para verificar expiración al actualizar
DROP TRIGGER IF EXISTS check_quote_expiration ON quotes;
CREATE TRIGGER check_quote_expiration
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION check_expired_quotes();

-- ============================================
-- NOTAS:
-- ============================================
-- 1. Esta migración agrega campos nuevos a las tablas existentes
-- 2. Los campos son opcionales (permiten NULL) para no romper datos existentes
-- 3. Se agregó el status 'vencida' para cotizaciones
-- 4. El trigger auto-vence cotizaciones pendientes cuya fecha pasó
-- ============================================

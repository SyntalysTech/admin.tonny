-- ============================================
-- MIGRACIÓN: Mejorar tabla invoices con campos detallados
-- Fecha: 2026-01-21
-- Descripción: Agrega campos estructurados para datos extraídos de facturas
-- ============================================

-- Campos para datos extraídos de la factura
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS supplier VARCHAR(255),
  ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS invoice_date DATE,
  ADD COLUMN IF NOT EXISTS subtotal DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS tax DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS total DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'MXN',
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
  ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'compras',
  ADD COLUMN IF NOT EXISTS items JSONB;

-- Índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_invoices_supplier ON invoices(supplier);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_category ON invoices(category);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Comentarios descriptivos
COMMENT ON COLUMN invoices.supplier IS 'Nombre del proveedor extraído de la factura';
COMMENT ON COLUMN invoices.invoice_number IS 'Número de factura o folio';
COMMENT ON COLUMN invoices.invoice_date IS 'Fecha de la factura';
COMMENT ON COLUMN invoices.subtotal IS 'Subtotal antes de impuestos';
COMMENT ON COLUMN invoices.tax IS 'Monto de impuestos (IVA, etc.)';
COMMENT ON COLUMN invoices.total IS 'Total de la factura';
COMMENT ON COLUMN invoices.currency IS 'Moneda (MXN, USD, etc.)';
COMMENT ON COLUMN invoices.payment_method IS 'Método de pago detectado';
COMMENT ON COLUMN invoices.category IS 'Categoría: compras, finanzas, gastos, etc.';
COMMENT ON COLUMN invoices.items IS 'Array JSON de items/productos de la factura [{sku, description, quantity, unit_price, total}]';

-- ============================================
-- MIGRACIÓN: Crear tabla invoices
-- Fecha: 2026-01-19
-- Descripción: Tabla para almacenar metadatos de archivos de facturas
-- ============================================

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid REFERENCES purchases(id) ON DELETE SET NULL,
  file_path text,
  public_url text,
  file_name text,
  mime_type text,
  extracted_text text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_purchase_id ON invoices(purchase_id);

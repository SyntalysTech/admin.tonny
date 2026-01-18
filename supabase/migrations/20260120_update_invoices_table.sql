-- ============================================
-- MIGRACIÓN: Actualizar tabla invoices para estado y respuesta AI
-- Fecha: 2026-01-20
-- Descripción: Agrega columnas para seguimiento del procesamiento por IA
-- ============================================

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS ai_response JSONB,
  ADD COLUMN IF NOT EXISTS processed_at timestamptz;

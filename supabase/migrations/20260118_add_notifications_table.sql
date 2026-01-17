-- ============================================
-- MIGRACION: Agregar tabla de notifications
-- Fecha: 2026-01-18
-- ============================================

-- Crear tabla de notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_date ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Habilitar RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politicas RLS
CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Authenticated users can insert notifications" ON notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Actualizar funcion handle_new_user para incluir notificacion de bienvenida
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Crear perfil del usuario
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'admin'
  );

  -- Crear notificacion de bienvenida
  INSERT INTO public.notifications (user_id, title, message, type, read)
  VALUES (
    NEW.id,
    'Bienvenido a Admin Tonny',
    'Tu sistema de inventario esta listo. Usa TonnyAI para gestionar tu inventario con comandos de voz o texto.',
    'info',
    FALSE
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear notificacion de bienvenida para usuarios existentes que no tienen una
INSERT INTO notifications (user_id, title, message, type, read)
SELECT id, 'Bienvenido a Admin Tonny', 'Tu sistema de inventario esta listo. Usa TonnyAI para gestionar tu inventario con comandos de voz o texto.', 'info', FALSE
FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE notifications.user_id = auth.users.id);

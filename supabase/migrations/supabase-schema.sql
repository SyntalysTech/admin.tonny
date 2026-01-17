-- ============================================
-- ADMIN TONNY - SCHEMA DE BASE DE DATOS
-- Sistema de Inventario y Control de Materiales
-- ============================================

-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: profiles (Perfiles de Usuario)
-- Vinculada a auth.users de Supabase
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice para busquedas por email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Indice para busquedas por rol
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================
-- TABLA: products (Productos/Inventario)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'material_remodelacion',
    'herramienta_remodelacion',
    'material_plomeria',
    'herramienta_plomeria'
  )),
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 5,
  unit VARCHAR(50) NOT NULL DEFAULT 'unidad',
  price DECIMAL(10, 2),
  supplier VARCHAR(255),
  location VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice para busquedas por categoria
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Indice para busquedas por nombre
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- ============================================
-- TABLA: stock_movements (Movimientos de Stock)
-- ============================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('entrada', 'salida', 'ajuste')),
  responsible VARCHAR(50) CHECK (responsible IN ('jordi', 'gustavo', 'david', 'taurus') OR responsible IS NULL),
  notes TEXT,
  original_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice para busquedas por producto
CREATE INDEX IF NOT EXISTS idx_movements_product ON stock_movements(product_id);

-- Indice para busquedas por fecha
CREATE INDEX IF NOT EXISTS idx_movements_date ON stock_movements(created_at);

-- ============================================
-- TABLA: deliveries (Entregas por Responsable)
-- ============================================
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  responsible VARCHAR(50) NOT NULL CHECK (responsible IN ('jordi', 'gustavo', 'david', 'taurus')),
  notes TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice para busquedas por responsable
CREATE INDEX IF NOT EXISTS idx_deliveries_responsible ON deliveries(responsible);

-- Indice para busquedas por fecha
CREATE INDEX IF NOT EXISTS idx_deliveries_date ON deliveries(delivered_at);

-- ============================================
-- TABLA: purchases (Registro de Compras - Segunda Etapa)
-- ============================================
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier VARCHAR(255) NOT NULL,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'completada', 'cancelada')),
  notes TEXT,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLA: quotes (Registro de Cotizaciones - Segunda Etapa)
-- ============================================
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier VARCHAR(255) NOT NULL,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'aprobada', 'rechazada')),
  valid_until TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLA: notifications (Notificaciones del Sistema)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice para busquedas por usuario
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- Indice para busquedas por fecha
CREATE INDEX IF NOT EXISTS idx_notifications_date ON notifications(created_at);

-- Indice para filtrar no leidas
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- ============================================
-- FUNCION: Actualizar updated_at automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para products
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCION: Crear perfil automaticamente al registrar usuario
-- ============================================
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

-- Trigger para crear perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politicas para profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- Politicas para products (usuarios autenticados pueden todo)
CREATE POLICY "Authenticated users can view products" ON products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert products" ON products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update products" ON products
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete products" ON products
  FOR DELETE USING (auth.role() = 'authenticated');

-- Politicas para stock_movements
CREATE POLICY "Authenticated users can view movements" ON stock_movements
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert movements" ON stock_movements
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Politicas para deliveries
CREATE POLICY "Authenticated users can view deliveries" ON deliveries
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert deliveries" ON deliveries
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Politicas para purchases
CREATE POLICY "Authenticated users can manage purchases" ON purchases
  FOR ALL USING (auth.role() = 'authenticated');

-- Politicas para quotes
CREATE POLICY "Authenticated users can manage quotes" ON quotes
  FOR ALL USING (auth.role() = 'authenticated');

-- Politicas para notifications (usuarios ven sus propias notificaciones o globales)
CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Authenticated users can insert notifications" ON notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- DATOS DE EJEMPLO (Opcional)
-- ============================================

-- Insertar algunos productos de ejemplo
INSERT INTO products (name, description, category, stock, min_stock, unit, price, supplier, location) VALUES
  ('Pintura eg shel gris Bear Home Depot 225', 'Pintura color gris marca Bear', 'material_remodelacion', 50, 10, 'galon', 225.00, 'Home Depot', 'Bodega A'),
  ('Lija grano 120', 'Lija para acabados', 'material_remodelacion', 200, 50, 'unidad', 5.50, 'Ferreteria Central', 'Bodega A'),
  ('Chapa con seguro', 'Chapa de seguridad para puertas', 'material_remodelacion', 75, 20, 'unidad', 180.00, 'Home Depot', 'Bodega B'),
  ('Taladro DeWalt 20V', 'Taladro inalambrico profesional', 'herramienta_remodelacion', 3, 1, 'unidad', 2500.00, 'Home Depot', 'Herramientas'),
  ('Tubo PVC 4 pulgadas', 'Tubo de drenaje PVC', 'material_plomeria', 30, 10, 'metro', 85.00, 'Plomeria Express', 'Bodega C'),
  ('Llave Stillson 18 pulgadas', 'Llave para tuberia', 'herramienta_plomeria', 5, 2, 'unidad', 450.00, 'Ferreteria Central', 'Herramientas');

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. Ejecutar este script en Supabase SQL Editor
-- 2. PRIMERO habilita Email Auth en Supabase Dashboard:
--    Authentication > Providers > Email
-- 3. Los usuarios registrados seran asignados como 'admin' por defecto
-- 4. Cambia el rol a 'super_admin' manualmente para el usuario principal (Tonny)
-- 5. Ejemplo para hacer super_admin:
--    UPDATE profiles SET role = 'super_admin' WHERE email = 'tonny@email.com';
-- ============================================

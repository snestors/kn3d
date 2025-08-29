-- Optimización de consultas para KN3D
-- Índices para mejorar performance

-- Productos: consultas por filtros más comunes
CREATE INDEX IF NOT EXISTS idx_product_active_featured ON "Product"("isActive", "isFeatured");
CREATE INDEX IF NOT EXISTS idx_product_category_active ON "Product"("categoryId", "isActive");
CREATE INDEX IF NOT EXISTS idx_product_material_active ON "Product"("material", "isActive");
CREATE INDEX IF NOT EXISTS idx_product_brand_active ON "Product"("brand", "isActive");
CREATE INDEX IF NOT EXISTS idx_product_color_active ON "Product"("color", "isActive");
CREATE INDEX IF NOT EXISTS idx_product_price_active ON "Product"("price", "isActive");
CREATE INDEX IF NOT EXISTS idx_product_stock_active ON "Product"("stock", "isActive");
CREATE INDEX IF NOT EXISTS idx_product_created_active ON "Product"("createdAt", "isActive");

-- Búsqueda de texto en productos
CREATE INDEX IF NOT EXISTS idx_product_name_gin ON "Product" USING gin (to_tsvector('spanish', "name"));
CREATE INDEX IF NOT EXISTS idx_product_description_gin ON "Product" USING gin (to_tsvector('spanish', "description"));

-- Orders: consultas más comunes
CREATE INDEX IF NOT EXISTS idx_order_status_created ON "Order"("status", "createdAt");
CREATE INDEX IF NOT EXISTS idx_order_user_created ON "Order"("userId", "createdAt");

-- Usuarios
CREATE INDEX IF NOT EXISTS idx_user_role_created ON "User"("role", "createdAt");

-- Categorías
CREATE INDEX IF NOT EXISTS idx_category_slug ON "Category"("slug");
CREATE INDEX IF NOT EXISTS idx_category_parent ON "Category"("parentId");

-- Carrito
CREATE INDEX IF NOT EXISTS idx_cart_user_product ON "CartItem"("userId", "productId");

-- Order items
CREATE INDEX IF NOT EXISTS idx_orderitem_order ON "OrderItem"("orderId");
CREATE INDEX IF NOT EXISTS idx_orderitem_product ON "OrderItem"("productId");
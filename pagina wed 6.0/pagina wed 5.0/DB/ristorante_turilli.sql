CREATE TABLE categorias (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE platillos (
    id_platillo SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10, 3) NOT NULL,
    id_categoria INT REFERENCES categorias(id_categoria) ON DELETE CASCADE
);

CREATE TABLE pedidos (
    id_pedido SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    numero_contacto VARCHAR(50) NOT NULL,
    metodo_entrega VARCHAR(50) NOT NULL,
    direccion_entrega TEXT NOT NULL,
    barrio_zona VARCHAR(100),
    fecha_deseada DATE,
    hora_deseada TIME,
    indicaciones_observaciones TEXT,
    medio_pago VARCHAR(50) NOT NULL,
    total NUMERIC(10, 3) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE detalle_pedido (
    id_detalle SERIAL PRIMARY KEY,
    id_pedido INT REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    id_platillo INT REFERENCES platillos(id_platillo),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10, 3) NOT NULL
);

INSERT INTO categorias (nombre) VALUES 
('Ensaladas'), 
('Pasta'), 
('Pizza'), 
('Postres');

INSERT INTO platillos (nombre, descripcion, precio, id_categoria) VALUES 
('Insalata Caprese', 'tomate, mozzarella fresca, albahaca, aceite de oliva', 22.000, 1),
('Insalata Mista', 'mezcla de lechugas, zanahoria, cebolla morada, aceitunas', 15.000, 1),
('Insalata di Mare', 'mariscos frescos, apio, limon, aceite de oliva', 24.000, 1),
('pasta clasica', '..........', 34.000, 2),
('pasta exclusiva', 'Quinoa, cerezas, tomate, aceitunas, cereal.', 41.500, 2),
('pasta premium', 'Quinoa, cerezas, tomate, aceitunas, cereal.', 55.000, 2),
('Pizza Diavola', 'Salsa de Tomate, mozzarella, pepperoni y aceitunas.', 45.000, 3),
('Pizza Salame e Formaggio', 'mozzarella, salami y oregano.', 42.000, 3),
('Pizza Margherita', 'Salsa de Tomate, mozzarella y albahaca.', 38.000, 3),
('Tiramisu', 'Bizcocho, cafe, mascarpone y cacao.', 35.000, 4),
('Mousse al Cioccolato', 'Mousse de chocolate con frambuesas.', 30.000, 4),
('Crostatine ai Frutti di bosco', 'Tartaletas con crema y frutos rojos.', 32.000, 4);
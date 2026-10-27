from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2 import Error

app = Flask(__name__)
CORS(app) 

DB_CONFIG = {
    "database": "ristorante_turilli",
    "user": "postgres",      
    "password": "1945", 
    "host": "localhost",
    "port": "5432"
}

def obtener_conexion():
    return psycopg2.connect(**DB_CONFIG)

@app.route('/api/pedidos', methods=['POST'])
def crear_pedido():
    data = request.get_json()
    
    if not data:
        return jsonify({"success": False, "message": "Datos no proporcionados"}), 400

    datos_cliente = data.get('cliente', {})
    items_carrito = data.get('carrito', [])

    conexion = None
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        cursor.execute("""
            INSERT INTO pedidos (
                nombre_completo, numero_contacto, metodo_entrega, 
                direccion_entrega, barrio_zona, fecha_deseada, 
                hora_deseada, indicaciones_observaciones, medio_pago, total
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id_pedido;
        """, (
            datos_cliente.get('nombre_completo'),
            datos_cliente.get('numero_contacto'),
            datos_cliente.get('metodo_entrega'),
            datos_cliente.get('direccion_entrega'),
            datos_cliente.get('barrio_zona'),
            datos_cliente.get('fecha_deseada') or None,
            datos_cliente.get('hora_deseada') or None,
            datos_cliente.get('indicaciones_observaciones'),
            datos_cliente.get('medio_pago'),
            datos_cliente.get('total')
        ))

        id_pedido = cursor.fetchone()[0]

        for item in items_carrito:
            cursor.execute("""
                INSERT INTO detalle_pedido (id_pedido, id_platillo, cantidad, precio_unitario)
                VALUES (%s, %s, %s, %s);
            """, (
                id_pedido,
                item['id_platillo'],
                item['cantidad'],
                item['precio_unitario']
            ))

        conexion.commit()
        cursor.close()

        return jsonify({
            "success": True, 
            "message": "Pedido registrado exitosamente", 
            "id_pedido": id_pedido
        }), 201

    except Error as e:
        if conexion:
            conexion.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if conexion:
            conexion.close()

if __name__ == '__main__':
    
    app.run(port=5000, debug=True)
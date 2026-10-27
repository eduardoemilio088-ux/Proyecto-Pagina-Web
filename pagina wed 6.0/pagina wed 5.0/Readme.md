# Ristorante Turilli

## Iniciar el sitio y el asistente

Las preguntas frecuentes básicas sobre catálogo, pedidos y pagos se pueden responder en el navegador. Para respuestas del modelo de IA real, la página debe servirse desde el backend Node.js existente (versión 18 o posterior, con `fetch` integrado); GitHub Pages por sí solo no ejecuta la API:

1. Copia `.env.example` a `.env`.
2. Para habilitar respuestas generales del modelo, añade una clave válida a `OPENAI_API_KEY` en `.env`. No la pongas en HTML ni en JavaScript del navegador y no subas `.env` al repositorio.
3. Si el proveedor compatible con OpenAI o el modelo difiere del predeterminado, configura `OPENAI_BASE_URL` y `OPENAI_MODEL`.
4. Desde la carpeta del proyecto, inicia `node server.js` y abre `http://localhost:3000`.

No abras `index.html` directamente como archivo si quieres usar el modelo real. Si falta la clave, el chat sigue contestando algunas preguntas frecuentes localmente; para conversación general se requiere el backend activo y configurar `OPENAI_API_KEY`.

## Medios de pago

Configura en `.env` las instrucciones oficiales en `PUBLIC_PAYMENT_BANCOLOMBIA`, `PUBLIC_PAYMENT_NEQUI`, `PUBLIC_PAYMENT_DAVIPLATA` o `PUBLIC_PAYMENT_TRANSFERENCIA`. Solo se muestran como texto en el checkout; verifica titular, cuenta y número antes de publicarlos. Esos datos son visibles para los clientes por diseño. No incluyas claves, PIN ni códigos de verificación.

El efectivo está oculto inicialmente. Actívalo solo si el negocio lo ofrece con `PAYMENT_CASH_ENABLED=true` y configura las indicaciones en `PUBLIC_PAYMENT_EFECTIVO`. Los nombres de las entidades se presentan en tipografía, sin imágenes de marca no verificadas.

El costo de entrega no está configurado y por eso se muestra como pendiente de confirmar con el restaurante; no se suma un costo inventado al total. El pago permanece pendiente de verificación. WhatsApp abre un borrador revisable, pero no confirma ni almacena el pedido.

## Límites de seguridad y operación

La API envía al proveedor mensajes de chat y un contexto público del menú; no escribas datos personales o sensibles en el chat. Se bloquean los formatos comunes de credenciales de pago antes de llamar al proveedor, y se quitan teléfonos y correos del historial en memoria. El historial vive en memoria durante un máximo de una hora; se limita el tamaño y la frecuencia de solicitudes. El modelo no tiene herramientas, acceso a comandos, archivos, secretos, datos de pago ni funciones para cambiar el catálogo o procesar pedidos. La defensa principal frente a prompt injection es que la solicitud no ofrece capacidades ni datos privados que el modelo pueda usar; las instrucciones del sistema no son una garantía absoluta sobre el contenido generado.

La limitación de solicitudes y las sesiones se guardan en la memoria del proceso. Para operar en producción, usa HTTPS, protege `.env`, configura límites persistentes en el proxy o servicio de alojamiento y considera una política de privacidad adecuada al proveedor de IA. Los pedidos se registran mediante el API Flask de `DB/app.py` en `http://localhost:5000/api/pedidos`; para usar el formulario, inicia ese servicio y configura la conexión a PostgreSQL. El registro no verifica automáticamente los pagos.

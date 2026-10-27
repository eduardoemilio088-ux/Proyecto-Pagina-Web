const carrito = new Map();
const numeroWhatsApp = '573117542371';
const idsPlatillos = new Map([
    ['Insalata Caprese', 1],
    ['Insalata Mista', 2],
    ['Insalata di Mare', 3],
    ['pasta clasica', 4],
    ['pasta exclusiva', 5],
    ['pasta premium', 6],
    ['Pizza Diavola', 7],
    ['Pizza Salame e Formaggio', 8],
    ['Pizza Margherita', 9],
    ['Tiramisu', 10],
    ['Mousse al Cioccolato', 11],
    ['Crostatine ai Frutti di bosco', 12]
]);
const moneda = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
});

const nombresPago = {
    bancolombia: 'Bancolombia',
    nequi: 'Nequi',
    daviplata: 'Daviplata',
    transferencia: 'Transferencia bancaria',
    efectivo: 'Pago en efectivo',
    otro: 'Otro medio de pago'
};

const listaCarrito = document.querySelector('#lista-carrito');
const totalCarrito = document.querySelector('#total-carrito');
const formularioPedido = document.querySelector('#formulario-pedido');
const metodoPago = document.querySelector('#metodo-pago');
const instruccionesPagoElemento = document.querySelector('#instrucciones-pago');
const pantallaFinalizar = document.querySelector('#finalizar-pedido');
const resumenFinalizar = document.querySelector('#resumen-finalizar');
const contenedorPlatillos = document.querySelector('.platillos');
const productosCatalogo = Array.from(document.querySelectorAll('.platillo'));
const contadorCarrito = document.querySelector('#contador-carrito');
let notificacionTimer;
let cerrarChatTimer;

document.addEventListener('DOMContentLoaded', () => {
    restaurarCarrito();
    agregarEventosCarrito();
    configurarFiltros();
    configurarPedido();
    configurarPagos();
    configurarAsistente();
    configurarMenuMovil();
    renderCarrito();
});

const parsePrecio = (texto) => {
    const digitos = texto.replace(/[^\d]/g, '');
    return Number(digitos) || 0;
};

const obtenerTotal = () => Array.from(carrito.values())
    .reduce((total, item) => total + item.precio * item.cantidad, 0);

const guardarCarrito = () => {
    try {
        sessionStorage.setItem('turilli-carrito', JSON.stringify(Array.from(carrito.values())));
    } catch (error) {
        console.error('No se pudo guardar el carrito en esta sesión.', error);
    }
};

const restaurarCarrito = () => {
    try {
        const guardado = JSON.parse(sessionStorage.getItem('turilli-carrito') || '[]');
        if (!Array.isArray(guardado)) return;
        guardado.forEach((item) => {
            const producto = productosCatalogo.find((elemento) =>
                elemento.querySelector('h2')?.textContent.trim() === item.nombre);
            const precioReal = producto
                ? parsePrecio(producto.querySelector('.precio p')?.textContent || '')
                : 0;
            if (precioReal && Number.isSafeInteger(item.cantidad) && item.cantidad > 0 && item.cantidad <= 99) {
                carrito.set(item.nombre, { nombre: item.nombre, precio: precioReal, cantidad: item.cantidad });
            }
        });
    } catch (error) {
        sessionStorage.removeItem('turilli-carrito');
        console.error('No se pudo restaurar el carrito guardado.', error);
    }
};

const agregarEventosCarrito = () => {
    document.querySelectorAll('.precio button').forEach((boton) => {
        boton.addEventListener('click', () => {
            const platillo = boton.closest('.platillo');
            if (!platillo) return;

            const nombre = platillo.querySelector('h2')?.textContent.trim();
            const precioTexto = platillo.querySelector('.precio p')?.textContent || '';
            if (!nombre || !parsePrecio(precioTexto)) return;

            const item = carrito.get(nombre) || {
                nombre,
                precio: parsePrecio(precioTexto),
                cantidad: 0
            };
            if (item.cantidad >= 99) {
                mostrarNotificacion('El máximo por producto es 99 unidades.');
                return;
            }
            item.cantidad += 1;
            carrito.set(nombre, item);
            guardarCarrito();
            renderCarrito();
            boton.classList.remove('animacion-agregado');
            requestAnimationFrame(() => boton.classList.add('animacion-agregado'));
            mostrarNotificacion(`${nombre} se agregó al carrito.`);
        });
    });
};

const renderCarrito = () => {
    if (!listaCarrito || !totalCarrito) return;

    listaCarrito.replaceChildren();
    if (carrito.size === 0) {
        const vacio = document.createElement('li');
        vacio.textContent = 'Tu carrito está vacío';
        listaCarrito.appendChild(vacio);
        totalCarrito.textContent = moneda.format(0);
        if (contadorCarrito) contadorCarrito.textContent = '0 productos';
        renderResumenFinalizar();
        return;
    }

    carrito.forEach((item) => {
        const linea = document.createElement('li');
        linea.className = 'linea-carrito';

        const detalle = document.createElement('div');
        detalle.className = 'detalle-carrito';
        const nombre = document.createElement('strong');
        nombre.textContent = item.nombre;
        const precio = document.createElement('span');
        precio.textContent = `${moneda.format(item.precio)} c/u · Subtotal ${moneda.format(item.precio * item.cantidad)}`;
        detalle.append(nombre, precio);

        const controles = document.createElement('div');
        controles.className = 'controles-cantidad';
        const disminuir = document.createElement('button');
        disminuir.type = 'button';
        disminuir.dataset.accion = 'disminuir';
        disminuir.dataset.producto = item.nombre;
        disminuir.setAttribute('aria-label', `Disminuir ${item.nombre}`);
        disminuir.textContent = '−';
        const cantidad = document.createElement('span');
        cantidad.textContent = item.cantidad;
        cantidad.setAttribute('aria-label', 'Cantidad');
        const aumentar = document.createElement('button');
        aumentar.type = 'button';
        aumentar.dataset.accion = 'aumentar';
        aumentar.dataset.producto = item.nombre;
        aumentar.setAttribute('aria-label', `Aumentar ${item.nombre}`);
        aumentar.textContent = '+';
        controles.append(disminuir, cantidad, aumentar);
        linea.append(detalle, controles);
        listaCarrito.appendChild(linea);
    });

    totalCarrito.textContent = moneda.format(obtenerTotal());
    const cantidadTotal = Array.from(carrito.values())
        .reduce((cantidad, item) => cantidad + item.cantidad, 0);
    if (contadorCarrito) {
        contadorCarrito.textContent = `${cantidadTotal} ${cantidadTotal === 1 ? 'producto' : 'productos'}`;
    }
    guardarCarrito();
    renderResumenFinalizar();
};

const mostrarNotificacion = (texto) => {
    const notificacion = document.querySelector('#notificacion-carrito');
    if (!notificacion) return;
    window.clearTimeout(notificacionTimer);
    notificacion.textContent = texto;
    notificacion.classList.add('visible');
    notificacionTimer = window.setTimeout(() => {
        notificacion.classList.remove('visible');
    }, 2200);
};

listaCarrito?.addEventListener('click', (evento) => {
    const boton = evento.target.closest('button[data-accion]');
    if (!boton) return;

    const item = carrito.get(boton.dataset.producto);
    if (!item) return;
    cambiarCantidad(item.nombre, boton.dataset.accion);
});

const configurarPedido = () => {
    const botonHacerPedido = document.querySelector('#btn-hacer-pedido');
    if (!formularioPedido || !botonHacerPedido) return;

    const campoFecha = document.querySelector('#pedido-fecha');
    const campoHora = document.querySelector('#pedido-hora');
    if (campoFecha && campoHora) {
        const ahora = new Date();
        const fechaLocal = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000)
            .toISOString().slice(0, 10);
        campoFecha.min = fechaLocal;
        campoFecha.addEventListener('change', () => {
            if (campoFecha.value === fechaLocal) {
                campoHora.min = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
            } else {
                campoHora.removeAttribute('min');
            }
        });
    }

    botonHacerPedido.addEventListener('click', () => {
        if (carrito.size === 0) {
            mostrarNotificacion('Agrega al menos un producto antes de finalizar el pedido.');
            return;
        }
        abrirFinalizarPedido();
    });

    document.querySelector('#volver-carrito')?.addEventListener('click', cerrarFinalizarPedido);
    document.querySelector('#editar-carrito')?.addEventListener('click', () => {
        cerrarFinalizarPedido('#pedido');
    });

    document.querySelector('#metodo-entrega')?.addEventListener('change', actualizarCamposEntrega);
    document.querySelector('#resumen-finalizar')?.addEventListener('click', (evento) => {
        const boton = evento.target.closest('button[data-accion]');
        if (!boton) return;
        cambiarCantidad(boton.dataset.producto, boton.dataset.accion);
        if (carrito.size === 0) cerrarFinalizarPedido();
    });

    formularioPedido.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        if (carrito.size === 0) {
            mostrarErrorPedido('Tu carrito está vacío. Regresa al menú y agrega productos.');
            return;
        }

        if (!formularioPedido.reportValidity()) return;
        const datosPago = metodosPago.find((item) => item.id === metodoPago.value);
        if (!datosPago) {
            mostrarErrorPedido('Selecciona un medio de pago para continuar.');
            document.querySelector('#tarjetas-pago')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const tipoEntrega = document.querySelector('#metodo-entrega').value;
        const datos = {
            nombre: document.querySelector('#pedido-nombre').value.trim(),
            telefono: document.querySelector('#pedido-telefono').value.trim(),
            entrega: tipoEntrega === 'recogida' ? 'Recogida en el establecimiento' : 'Domicilio',
            direccion: tipoEntrega === 'domicilio' ? document.querySelector('#pedido-direccion').value.trim() : '',
            barrio: tipoEntrega === 'domicilio' ? document.querySelector('#pedido-barrio').value.trim() : '',
            fecha: document.querySelector('#pedido-fecha').value,
            hora: document.querySelector('#pedido-hora').value,
            observaciones: document.querySelector('#pedido-observaciones').value.trim(),
            metodo: metodoPago.value
        };

        const itemsCarrito = Array.from(carrito.values());
        const productosPedido = itemsCarrito.map((item) => ({
            id_platillo: idsPlatillos.get(item.nombre),
            cantidad: item.cantidad,
            precio_unitario: item.precio
        }));
        if (productosPedido.some((item) => !item.id_platillo)) {
            mostrarErrorPedido('No se pudo identificar uno de los platillos. Actualiza el menú e inténtalo de nuevo.');
            return;
        }

        const datosPedido = {
            cliente: {
                nombre_completo: datos.nombre,
                numero_contacto: datos.telefono,
                metodo_entrega: datos.entrega,
                direccion_entrega: datos.direccion,
                barrio_zona: datos.barrio,
                fecha_deseada: datos.fecha || null,
                hora_deseada: datos.hora || null,
                indicaciones_observaciones: datos.observaciones,
                medio_pago: nombresPago[datos.metodo] || datos.metodo,
                total: obtenerTotal()
            },
            carrito: productosPedido
        };

        const productos = Array.from(carrito.values())
            .map((item) => `- ${item.nombre} x${item.cantidad} (${moneda.format(item.precio)} c/u = ${moneda.format(item.precio * item.cantidad)})`)
            .join('\n');

        const botonEnviar = formularioPedido.querySelector('.btn-enviar-pedido');
        const estabaDeshabilitado = botonEnviar?.disabled || false;
        const ventanaWhatsApp = window.open('about:blank', '_blank');
        if (ventanaWhatsApp) ventanaWhatsApp.opener = null;
        if (botonEnviar) botonEnviar.disabled = true;

        try {
            const respuesta = await fetch('http://localhost:5000/api/pedidos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosPedido)
            });
            const resultado = await respuesta.json();

            if (!respuesta.ok || !resultado.success || resultado.id_pedido == null) {
                throw new Error(resultado.message || resultado.error || 'El servidor no pudo registrar el pedido.');
            }

            const mensaje = [
                `Hola, quiero confirmar el pedido #${resultado.id_pedido} que acabo de registrar:`,
                '',
                productos,
                '',
                `Total productos: ${moneda.format(datosPedido.cliente.total)}.`,
                ...(tipoEntrega === 'domicilio' ? ['Costo de domicilio: por confirmar con el restaurante.'] : []),
                `Nombre: ${datos.nombre}.`,
                `Teléfono: ${datos.telefono}.`,
                `Entrega: ${datos.entrega}.`,
                ...(datos.direccion ? [`Dirección: ${datos.direccion}.`] : []),
                ...(datos.barrio ? [`Barrio/zona: ${datos.barrio}.`] : []),
                ...(datos.fecha ? [`Fecha deseada: ${datos.fecha}.`] : []),
                ...(datos.hora ? [`Hora deseada: ${datos.hora}.`] : []),
                `Medio de pago seleccionado: ${datosPago.name}.`,
                `Observaciones: ${datos.observaciones || 'Ninguna'}.`,
                'Pago pendiente de verificación. Quedo atento a la confirmación del restaurante.'
            ].join('\n');
            const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;

            if (ventanaWhatsApp) {
                ventanaWhatsApp.location.href = url;
            } else {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
            const errorPedido = document.querySelector('#error-pedido');
            if (errorPedido) errorPedido.hidden = true;
        } catch (error) {
            ventanaWhatsApp?.close();
            console.error('No se pudo registrar el pedido en el servidor local.', error);
            mostrarErrorPedido('No se pudo registrar el pedido. Verifica que el servidor de pedidos esté activo e inténtalo de nuevo.');
        } finally {
            if (botonEnviar) botonEnviar.disabled = estabaDeshabilitado;
        }
    });
};

const cambiarCantidad = (nombre, accion) => {
    const item = carrito.get(nombre);
    if (!item) return;
    if (accion === 'aumentar' && item.cantidad >= 99) {
        mostrarNotificacion('El máximo por producto es 99 unidades.');
        return;
    }
    item.cantidad += accion === 'aumentar' ? 1 : -1;
    if (item.cantidad <= 0) carrito.delete(nombre);
    guardarCarrito();
    renderCarrito();
};

const renderResumenFinalizar = () => {
    if (!resumenFinalizar) return;
    resumenFinalizar.replaceChildren();
    carrito.forEach((item) => {
        const linea = document.createElement('li');
        linea.className = 'linea-finalizar';
        const detalle = document.createElement('div');
        const nombre = document.createElement('strong');
        nombre.textContent = item.nombre;
        const precio = document.createElement('span');
        precio.textContent = `${moneda.format(item.precio)} c/u · ${moneda.format(item.precio * item.cantidad)}`;
        detalle.append(nombre, precio);
        const controles = document.createElement('div');
        controles.className = 'controles-cantidad';
        [['disminuir', '−'], ['aumentar', '+']].forEach(([accion, texto]) => {
            const boton = document.createElement('button');
            boton.type = 'button';
            boton.dataset.accion = accion;
            boton.dataset.producto = item.nombre;
            boton.setAttribute('aria-label', `${accion === 'aumentar' ? 'Aumentar' : 'Disminuir'} ${item.nombre}`);
            boton.textContent = texto;
            controles.appendChild(boton);
        });
        const cantidad = document.createElement('span');
        cantidad.textContent = item.cantidad;
        controles.insertBefore(cantidad, controles.lastChild);
        linea.append(detalle, controles);
        resumenFinalizar.appendChild(linea);
    });
    const total = document.querySelector('#total-finalizar');
    if (total) total.textContent = moneda.format(obtenerTotal());
};

const abrirFinalizarPedido = () => {
    if (!pantallaFinalizar) return;
    renderResumenFinalizar();
    pantallaFinalizar.hidden = false;
    document.body.classList.add('checkout-open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelector('#titulo-finalizar')?.focus({ preventScroll: true });
};

const cerrarFinalizarPedido = (destino = '#menu') => {
    if (!pantallaFinalizar) return;
    pantallaFinalizar.hidden = true;
    document.body.classList.remove('checkout-open');
    document.querySelector(destino)?.scrollIntoView({ behavior: 'smooth' });
};

const actualizarCamposEntrega = () => {
    const esDomicilio = document.querySelector('#metodo-entrega')?.value !== 'recogida';
    const campoDireccion = document.querySelector('#pedido-direccion');
    const campoBarrio = document.querySelector('#pedido-barrio');
    const envolturaDireccion = document.querySelector('#campo-direccion');
    const envolturaBarrio = document.querySelector('#campo-barrio');
    if (campoDireccion) {
        campoDireccion.required = esDomicilio;
        campoDireccion.disabled = !esDomicilio;
        campoDireccion.value = esDomicilio ? campoDireccion.value : '';
    }
    if (campoBarrio) {
        campoBarrio.disabled = !esDomicilio;
        campoBarrio.value = esDomicilio ? campoBarrio.value : '';
    }
    if (envolturaDireccion) envolturaDireccion.hidden = !esDomicilio;
    if (envolturaBarrio) envolturaBarrio.hidden = !esDomicilio;
};

let metodosPago = [
    { id: 'bancolombia', name: 'Bancolombia', hint: 'Transferencia bancaria', instructions: '' },
    { id: 'nequi', name: 'Nequi', hint: 'Billetera digital', instructions: '' },
    { id: 'daviplata', name: 'Daviplata', hint: 'Billetera digital', instructions: '' },
    { id: 'transferencia', name: 'Transferencia bancaria', hint: 'Consulta las instrucciones', instructions: '' }
];

const configurarPagos = () => {
    renderTarjetasPago();
    cargarMetodosPago();
};

const cargarMetodosPago = async () => {
    let errorConfiguracion = false;
    try {
        const response = await fetch('/api/payment-methods', { headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data.methods)) throw new Error('Respuesta de medios de pago inválida.');
        const permitidos = new Set(['bancolombia', 'nequi', 'daviplata', 'transferencia', 'efectivo']);
        metodosPago = data.methods.filter((metodo) => permitidos.has(metodo.id))
            .map((metodo) => ({ ...metodo, name: nombresPago[metodo.id] }));
    } catch (error) {
        errorConfiguracion = true;
        console.error('No se pudieron cargar los medios de pago del servidor.', error);
    }
    renderTarjetasPago();
    if (errorConfiguracion) {
        mostrarInstruccionPago('No se pudo conectar con el servidor para cargar las instrucciones oficiales. Confirma los datos con el restaurante antes de pagar.');
    }
};

const renderTarjetasPago = () => {
    const contenedor = document.querySelector('#tarjetas-pago');
    if (!contenedor) return;
    contenedor.replaceChildren();
    metodosPago.forEach((metodo) => {
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'tarjeta-pago';
        boton.dataset.metodo = metodo.id;
        boton.setAttribute('aria-pressed', 'false');
        const marca = document.createElement('span');
        marca.className = `marca-pago marca-${metodo.id}`;
        marca.textContent = metodo.name;
        const indicacion = document.createElement('small');
        indicacion.textContent = metodo.hint || 'Selecciona para ver instrucciones';
        boton.append(marca, indicacion);
        boton.addEventListener('click', () => seleccionarPago(metodo.id));
        contenedor.appendChild(boton);
    });
};

const seleccionarPago = (metodo) => {
    const seleccionado = metodosPago.find((opcion) => opcion.id === metodo);
    if (!seleccionado || !instruccionesPagoElemento) return;
    if (metodoPago) metodoPago.value = metodo;
    const error = document.querySelector('#error-pedido');
    if (error) error.hidden = true;
    document.querySelectorAll('.tarjeta-pago').forEach((boton) => {
        const activo = boton.dataset.metodo === metodo;
        boton.classList.toggle('seleccionado', activo);
        boton.setAttribute('aria-pressed', String(activo));
    });
    mostrarInstruccionPago(seleccionado.instructions ||
        'Las instrucciones oficiales no están configuradas. Solicítalas al restaurante por WhatsApp antes de pagar.');
};

const mostrarInstruccionPago = (contenido) => {
    instruccionesPagoElemento.replaceChildren();
    const icono = document.createElement('i');
    icono.className = 'fas fa-info-circle';
    const texto = document.createElement('p');
    texto.textContent = contenido;
    instruccionesPagoElemento.append(icono, texto);
};

const mostrarErrorPedido = (texto) => {
    const error = document.querySelector('#error-pedido');
    if (!error) return;
    error.textContent = texto;
    error.hidden = false;
};

const configurarAsistente = () => {
    const formulario = document.querySelector('#formulario-chat');
    const entrada = document.querySelector('#entrada-chat');
    const mensajes = document.querySelector('#mensajes-chat');
    const ventana = document.querySelector('#ventana-asistente');
    const botonAsistente = document.querySelector('#boton-asistente');
    const botonCerrar = document.querySelector('#cerrar-chat');
    const enlaceNav = document.querySelector('#abrir-chat-nav');
    if (!formulario || !entrada || !mensajes || !ventana || !botonAsistente || !botonCerrar) return;

    const abrir = () => {
        window.clearTimeout(cerrarChatTimer);
        ventana.hidden = false;
        requestAnimationFrame(() => {
            ventana.classList.add('abierto');
            ventana.setAttribute('aria-hidden', 'false');
        });
        botonAsistente.setAttribute('aria-expanded', 'true');
        botonAsistente.setAttribute('aria-label', 'Cerrar asistente virtual');
        botonAsistente.querySelector('i').className = 'fas fa-times';
        entrada.focus({ preventScroll: true });
    };

    const cerrar = () => {
        ventana.classList.remove('abierto');
        ventana.setAttribute('aria-hidden', 'true');
        botonAsistente.setAttribute('aria-expanded', 'false');
        botonAsistente.setAttribute('aria-label', 'Abrir asistente virtual');
        botonAsistente.querySelector('i').className = 'fas fa-comment-dots';
        cerrarChatTimer = window.setTimeout(() => {
            if (!ventana.classList.contains('abierto')) ventana.hidden = true;
        }, 230);
        botonAsistente.focus({ preventScroll: true });
    };

    botonAsistente.addEventListener('click', () => {
        if (botonAsistente.getAttribute('aria-expanded') === 'true') cerrar();
        else abrir();
    });
    botonCerrar.addEventListener('click', cerrar);
    enlaceNav?.addEventListener('click', (evento) => {
        evento.preventDefault();
        abrir();
    });
    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape' && botonAsistente.getAttribute('aria-expanded') === 'true') cerrar();
    });

    const botonEnviar = formulario.querySelector('button[type="submit"]');
    let ultimoTemaLocal = '';
    const idSesionChat = () => {
        let id = sessionStorage.getItem('turilli-chat-session');
        if (!id) {
            const bytes = crypto.getRandomValues(new Uint8Array(16));
            bytes[6] = (bytes[6] & 0x0f) | 0x40;
            bytes[8] = (bytes[8] & 0x3f) | 0x80;
            id = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
                .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
            sessionStorage.setItem('turilli-chat-session', id);
        }
        return id;
    };
    const enviar = async (texto) => {
        agregarMensaje(texto, 'mensaje-cliente');
        const indicador = agregarMensaje('La IA está escribiendo…', 'mensaje-asistente indicador-escribiendo');
        entrada.disabled = true;
        if (botonEnviar) botonEnviar.disabled = true;
        let statusRespuesta;
        try {
            const respuestaLocal = responderPreguntaLocal(texto, ultimoTemaLocal);
            if (respuestaLocal) {
                ultimoTemaLocal = respuestaLocal.tema;
                indicador.textContent = respuestaLocal.texto;
                indicador.classList.remove('indicador-escribiendo');
                return;
            }

            let response;
            try {
                response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Chat-Session': idSesionChat()
                    },
                    body: JSON.stringify({ message: texto })
                });
            } catch {
                const falloConexion = new Error('No se pudo alcanzar el endpoint del asistente.');
                falloConexion.name = 'NetworkConnectionError';
                throw falloConexion;
            }
            statusRespuesta = response.status;
            let data;
            try {
                data = await response.json();
            } catch {
                throw new Error(`El servidor respondió con HTTP ${response.status} en un formato no válido.`);
            }
            if (!response.ok) {
                statusRespuesta = response.status;
                throw new Error(data?.error || 'No se pudo completar la respuesta.');
            }
            if (typeof data?.reply !== 'string' || !data.reply.trim()) {
                throw new Error('El servidor no devolvió una respuesta válida. Vuelve a intentarlo.');
            }
            indicador.textContent = data.reply;
            indicador.classList.remove('indicador-escribiendo');
        } catch (error) {
            console.warn('El modelo de IA no está disponible para este mensaje.');
            const falloRed = error.name === 'NetworkConnectionError';
            let mensajeError = 'No pude obtener una respuesta ahora. Inténtalo de nuevo en unos segundos.';
            if (falloRed) {
                mensajeError = 'Puedo responder dudas del menú, los pedidos, los pagos y la entrega. Para preguntas generales, el servicio de IA no está disponible ahora.';
            } else if (statusRespuesta === 503) {
                mensajeError = 'Puedo responder dudas de la pizzería, pero la IA para preguntas generales aún no está configurada.';
            } else if (statusRespuesta === 429) {
                mensajeError = 'El asistente está ocupado. Espera un momento y vuelve a intentarlo.';
            }
            indicador.textContent = mensajeError;
            indicador.classList.remove('indicador-escribiendo');
            indicador.classList.add('mensaje-error-chat');
            entrada.value = texto;
        } finally {
            entrada.disabled = false;
            if (botonEnviar) botonEnviar.disabled = false;
            entrada.focus({ preventScroll: true });
        }
    };

    formulario.addEventListener('submit', (evento) => {
        evento.preventDefault();
        const texto = entrada.value.trim();
        if (!texto || entrada.disabled) return;
        entrada.value = '';
        entrada.style.height = 'auto';
        void enviar(texto);
    });

    entrada.addEventListener('keydown', (evento) => {
        if (evento.key === 'Enter' && !evento.shiftKey) {
            evento.preventDefault();
            formulario.requestSubmit();
        }
    });
    entrada.addEventListener('input', () => {
        entrada.style.height = 'auto';
        entrada.style.height = `${Math.min(entrada.scrollHeight, 120)}px`;
    });

    function agregarMensaje(texto, clase) {
        const mensaje = document.createElement('p');
        mensaje.className = clase;
        mensaje.textContent = texto;
        mensajes.appendChild(mensaje);
        mensajes.scrollTop = mensajes.scrollHeight;
        return mensaje;
    }
};

const responderPreguntaLocal = (pregunta, temaAnterior) => {
    const texto = pregunta.toLocaleLowerCase('es');
    const whatsapp = ' Si necesitas confirmación, escríbenos por WhatsApp al 311 754 2371.';
    const productos = productosCatalogo.map((platillo) => ({
        nombre: platillo.querySelector('h2')?.textContent.trim() || '',
        precio: platillo.querySelector('.precio p')?.textContent.trim() || '',
        descripcion: platillo.querySelector(':scope > p')?.textContent.trim() || ''
    }));
    const pizzas = productosCatalogo
        .filter((platillo) => platillo.dataset.platillo === 'pizza')
        .map((platillo) => {
            const nombre = platillo.querySelector('h2')?.textContent.trim();
            const precio = platillo.querySelector('.precio p')?.textContent.trim();
            const descripcion = platillo.querySelector(':scope > p')?.textContent.trim();
            return `${nombre}: ${precio}${descripcion ? ` (${descripcion})` : ''}`;
        });

    if (/^(hola|holi|buenas|buenos d[ií]as|buenas tardes|buenas noches|hey|hello)\b/.test(texto)) {
        return { tema: 'saludo', texto: '¡Hola! 😊 ¿Te ayudo con el menú, los precios o cómo hacer tu pedido?' };
    }
    if (/gracias|muchas gracias|perfecto|listo/.test(texto)) {
        return { tema: temaAnterior || 'general', texto: '¡Con gusto! ¿Quieres consultar algo más del menú o de tu pedido?' };
    }
    if (/precio|men[uú]|producto|platillo|pizza|ingrediente|disponib|ensalada|pasta|postre/.test(texto) ||
        (temaAnterior === 'menu' && /^(y |¿?y |cu[aá]nto|cu[aá]les|esa|ese|la otra|la segunda|la primera)/.test(texto))) {
        return {
            tema: 'menu',
            texto: `Estos son los productos y precios publicados: ${productos.map((item) =>
                `${item.nombre}: ${item.precio}${item.descripcion && item.descripcion !== '.........' ? ` (${item.descripcion})` : ''}`
            ).join('; ')}. Nuestras pizzas son ${pizzas.join('; ')}.`
        };
    }
    if (/pago|banco|nequi|daviplata|transferencia|efectivo|bancolombia/.test(texto) ||
        (temaAnterior === 'pago' && /^(y |¿?y |cu[aá]l|c[oó]mo|ese|esa|la otra)/.test(texto))) {
        const metodos = Array.from(document.querySelectorAll('.tarjeta-pago'))
            .map((tarjeta) => tarjeta.querySelector('.marca-pago')?.textContent.trim() || tarjeta.textContent.trim())
            .filter(Boolean);
        return {
            tema: 'pago',
            texto: `En el checkout aparecen estos medios de pago: ${metodos.length ? metodos.join(', ') : 'Bancolombia, Nequi, Daviplata y transferencia bancaria'}. Las instrucciones verificadas se muestran al elegir el medio. Nunca compartas claves ni PIN.`
        };
    }
    if (/pedido|compr|orden|agend|carrito|agreg|confirm/.test(texto) ||
        (temaAnterior === 'pedido' && /^(y |¿?y |c[oó]mo|despu[eé]s|luego)/.test(texto))) {
        return {
            tema: 'pedido',
            texto: 'Agrega los productos desde el menú con el botón del carrito, revisa las cantidades en “Tu pedido” y pulsa “Finalizar pedido”. Completa los datos, elige un medio de pago y revisa el mensaje antes de enviarlo por WhatsApp. El restaurante debe confirmar el pedido.'
        };
    }
    if (/entrega|domicilio|direcci[oó]n|recoger|recogida|barrio/.test(texto) ||
        (temaAnterior === 'entrega' && /^(y |¿?y |cu[aá]nto|d[oó]nde|llega)/.test(texto))) {
        return {
            tema: 'entrega',
            texto: `El checkout permite domicilio o recogida en el establecimiento. La cobertura y el costo de domicilio deben confirmarse con el restaurante.${whatsapp}`
        };
    }
    if (/horario|hora|abren|cierran/.test(texto)) {
        const bloqueHorario = Array.from(document.querySelectorAll('.pie-pagina .info'))
            .find((bloque) => bloque.querySelector('h3')?.textContent.toLocaleLowerCase('es').includes('horario'));
        const horario = bloqueHorario?.innerText.replace(/\s+/g, ' ').trim();
        return {
            tema: 'contacto',
            texto: horario ? `El horario publicado es: ${horario}.${whatsapp}` : `No hay un horario detallado publicado. Consulta por WhatsApp al 311 754 2371.${whatsapp}`
        };
    }
    if (/ubicaci[oó]n|direcci[oó]n|contacto|tel[eé]fono/.test(texto)) {
        const datosContacto = document.querySelector('.informacion-contacto')?.innerText
            .replace(/\s+/g, ' ').trim();
        return {
            tema: 'contacto',
            texto: datosContacto
                ? `La información de contacto publicada es: ${datosContacto}${whatsapp}`
                : `Puedes comunicarte con el restaurante por WhatsApp al 311 754 2371.${whatsapp}`
        };
    }
    if (/^(cu[aá]nto es )?\d+\s*[\+\-*\/x]\s*\d+\??$/.test(texto)) {
        const operacion = texto.match(/(\d+)\s*([\+\-*\/x])\s*(\d+)/);
        if (operacion) {
            const [, a, operador, b] = operacion;
            const calculo = { '+': () => +a + +b, '-': () => +a - +b, '*': () => +a * +b, x: () => +a * +b, '/': () => +a / +b }[operador];
            if (calculo && Number.isFinite(calculo())) {
                return { tema: 'general', texto: `${a} ${operador} ${b} = ${calculo()}. ¿Te ayudo con algo del menú o de tu pedido?` };
            }
        }
    }
    if (/javascript/.test(texto)) {
        return { tema: 'general', texto: 'JavaScript es un lenguaje de programación muy usado para hacer páginas web interactivas. Por ejemplo, permite responder al pulsar un botón o actualizar un carrito. ¿Te ayudo con algo de la pizzería?' };
    }
    if (temaAnterior) {
        const respuestaSeguimiento = {
            menu: `Claro, seguimos con el menú. Nuestras pizzas son ${pizzas.join('; ')}. ¿Cuál te interesa?`,
            pago: `Seguimos con los medios de pago. Elige uno en el checkout para ver las instrucciones verificadas.${whatsapp}`,
            pedido: 'Puedes revisar las cantidades en “Tu pedido” y continuar con “Finalizar pedido”. ¿En qué paso necesitas ayuda?',
            entrega: `Para la entrega puedes elegir domicilio o recogida. Cobertura y costo se confirman con el restaurante.${whatsapp}`,
            contacto: `El número de atención publicado es 311 754 2371.${whatsapp}`
        }[temaAnterior];
        if (respuestaSeguimiento) return { tema: temaAnterior, texto: respuestaSeguimiento };
    }
    return null;
};

const configurarFiltros = () => {
    const contenedor = document.querySelector('.platillos');
    if (!contenedor) return;

    const filtros = {
        todos: () => true,
        ensaladas: (producto) => producto.dataset.platillo === 'ensalada',
        pasta: (producto) => producto.dataset.platillo === 'pasta',
        pizza: (producto) => producto.dataset.platillo === 'pizza',
        postres: (producto) => producto.dataset.platillo === 'postre'
    };

    Object.entries(filtros).forEach(([clase, coincide]) => {
        document.querySelector(`.${clase}`)?.addEventListener('click', () => {
            contenedor.replaceChildren(...productosCatalogo.filter(coincide));
        });
    });
};

const configurarMenuMovil = () => {
    const menu = document.querySelector('.hamburguesa');
    const navegacion = document.querySelector('.navegacion');
    if (!menu || !navegacion) return;

    menu.addEventListener('click', () => navegacion.classList.toggle('ocultar'));
    navegacion.querySelectorAll('a').forEach((enlace) => {
        enlace.addEventListener('click', () => navegacion.classList.add('ocultar'));
    });
};

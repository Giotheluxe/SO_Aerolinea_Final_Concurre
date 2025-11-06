import {API, fetchJSON, el, Auth} from './common.js';
import {API, fetchJSON, el, Auth} from './common.js';

function generateTicketHTML(p) {
    const totalAmount = (p.total_amount + p.extras_amount).toLocaleString('es-MX');
    const seatsList = p.items.map(i => `
        <div class="flex justify-between">
            <span>Asiento ${i.seat_code} (${i.category})</span>
            <span>$${parseInt(i.price).toLocaleString('es-MX')}</span>
        </div>
    `).join('');
    const extrasList = p.extras.map(e => `
        <div class="flex justify-between">
            <span>${e.label} (x${e.qty})</span>
            <span>$${parseInt(e.subtotal).toLocaleString('es-MX')}</span>
        </div>
    `).join('');

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>Boleto de Vuelo ${p.flight_number}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Source+Code+Pro&display=swap');
            body { font-family: 'Inter', sans-serif; }
            .ticket { max-width: 800px; margin: 40px auto; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .barcode { font-family: 'Source Code Pro', monospace; }
        </style>
    </head>
    <body class="bg-gray-100">
        <div class="ticket bg-white">
            <header class="bg-blue-600 text-white p-6 rounded-t-xl">
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-2xl font-bold">Agencia de Vuelos</h1>
                        <p class="text-blue-200">Pase de Abordar</p>
                    </div>
                    <div class="text-right">
                        <p class="font-semibold text-lg">${p.reservation_code}</p>
                        <p class="text-xs opacity-80">Código de Reservación</p>
                    </div>
                </div>
            </header>
            <main class="p-8">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div class="md:col-span-2">
                        <h2 class="text-xl font-bold text-gray-800">${p.flight_number}</h2>
                        <p class="text-lg text-gray-600">${p.origin} → ${p.destination}</p>
                        <div class="mt-6 grid grid-cols-3 gap-4">
                            <div>
                                <p class="text-sm text-gray-500">Fecha</p>
                                <p class="font-semibold">${p.date}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500">Hora</p>
                                <p class="font-semibold">${p.time}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500">Asientos</p>
                                <p class="font-semibold">${p.items.map(i=>i.seat_code).join(', ')}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500">Terminal</p>
                                <p class="font-semibold">${p.terminal}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500">Puerta</p>
                                <p class="font-semibold">${p.gate}</p>
                            </div>
                        </div>
                    </div>
                    <div class="text-center self-center">
                        <p class="barcode text-4xl tracking-widest">${p.flight_number.split('-')[0]}</p>
                        <p class="barcode text-2xl tracking-widest">${p.flight_number.split('-')[1]}</p>
                    </div>
                </div>
                <div class="mt-8 border-t pt-6">
                    <h3 class="text-lg font-semibold mb-4">Desglose de Pago</h3>
                    <div class="space-y-2 text-gray-700">
                        ${seatsList}
                        ${extrasList}
                        <div class="border-t my-2"></div>
                        <div class="flex justify-between font-bold text-xl">
                            <span>Total Pagado</span>
                            <span>$${totalAmount}</span>
                        </div>
                    </div>
                    <p class="text-xs text-gray-400 mt-4">Pagado con ${p.payment_method}. Precios en MXN.</p>
                </div>
            </main>
            <footer class="text-center p-4 border-t text-sm text-gray-500">
                <p>Gracias por volar con nosotros. ¡Buen viaje!</p>
            </footer>
        </div>
        <div class="text-center my-8">
            <button onclick="window.print()" class="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg hover:bg-blue-700">Imprimir o Guardar como PDF</button>
        </div>
    </body>
    </html>`;
}


async function init(){
  const me = await Auth.me(); 
  const root = document.getElementById('list');

  if(!me){ 
    root.innerHTML=`
      <div class="neumorphic-panel text-center p-12">
        <h3 class="text-2xl font-bold text-gray-800">Acceso Requerido</h3>
        <p class="text-gray-600 mt-2">Por favor, inicia sesión para ver tu historial de vuelos.</p>
      </div>
    `; 
    return; 
  }

  const res = await fetchJSON(`${API}/my_purchases.php`);
  if(res.purchases.length === 0){ 
    root.innerHTML=`
      <div class="neumorphic-panel text-center p-12">
        <h3 class="text-2xl font-bold text-gray-800">Sin Vuelos Aún</h3>
        <p class="text-gray-600 mt-2">No tienes compras registradas en tu cuenta.</p>
      </div>
    `; 
    return; 
  }

  res.purchases.forEach(p => {
    const extrasList = p.extras.length 
      ? p.extras.map(e => `${e.label} x${e.qty} ($${e.subtotal.toLocaleString('es-MX')})`).join(' • ') 
      : 'Ninguno';

    const card = el(`
        <div class="neumorphic-panel p-6 mb-6">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h3 class="text-2xl font-bold text-gray-800">${p.flight_number}</h3>
                    <p class="text-lg text-gray-600">${p.origin} → ${p.destination}</p>
                </div>
                <div class="text-left md:text-right mt-2 md:mt-0">
                    <p class="font-semibold text-blue-600 text-lg">${p.reservation_code || '-'}</p>
                    <p class="text-sm text-gray-500">${p.date} ${p.time}</p>
                </div>
            </div>
            <div class="mt-4 border-t border-gray-300/50 pt-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p><strong>Asientos:</strong> <span class="font-mono bg-gray-200/50 px-2 py-1 rounded-md text-sm">${p.items.map(i=>i.seat_code).join(', ')}</span></p>
                        <p class="mt-1"><strong>Detalles:</strong> ${p.terminal} / ${p.gate}</p>
                        <p class="mt-1"><strong>Extras:</strong> ${extrasList}</p>
                    </div>
                    <div class="md:text-right flex flex-col justify-between items-end">
                        <div>
                            <p class="text-gray-600">Pagado con ${p.payment_method}</p>
                            <p class="text-2xl font-bold text-gray-800 mt-1">$${(p.total_amount + p.extras_amount).toLocaleString('es-MX')}</p>
                        </div>
                        <button class="bg-blue-600 text-white font-bold py-2 px-5 rounded-xl shadow-lg hover:bg-blue-700 transition-colors mt-4 view-ticket-btn">
                            Ver Boleto
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `);
    
    card.querySelector('.view-ticket-btn').addEventListener('click', () => {
        const ticketWindow = window.open('', '_blank');
        ticketWindow.document.write(generateTicketHTML(p));
        ticketWindow.document.close();
    });

    root.appendChild(card);
  });
}
init();

// Guardar progreso al entrar a Mis Vuelos
(async()=>{ try{ const me=await Auth.me(); if(me){ await fetchJSON(`${API}/save_progress.php`, {method:'POST', body: JSON.stringify({route:'mis_vuelos', params:{}, state:{}})}); } }catch(e){} })();

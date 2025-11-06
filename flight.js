import {API, fetchJSON, el, PRICES, token, Auth, toast} from './common.js';

const params = new URLSearchParams(location.search);
const flight_code = params.get('code');
const state = { flight:null, seats:[], selected:new Map(), extras:{bag25:0, bagExtra:0} };

async function saveProgress(extra={}){
  try{
    const me = await Auth.me(); if(!me) return;
    const payload = {
      route: 'flight',
      params: { code: flight_code },
      state: { selected: Array.from(state.selected.entries()) }
    };
    Object.assign(payload.state, extra);
    await fetchJSON(`${API}/save_progress.php`, {method:'POST', body: JSON.stringify(payload)});
  }catch(e){/* ignore */}
}
async function loadProgress(){
  try{
    const me = await Auth.me(); if(!me) return null;
    const r = await fetchJSON(`${API}/get_progress.php`);
    return r.progress || null;
  }catch(e){ return null; }
}


async function refreshAuthUI(){
  try{
    const me = await Auth.me();
    document.getElementById('navMisVuelos').style.display = me ? '' : 'none';
    document.getElementById('navLogout').style.display = me ? '' : 'none';
  }catch(e){}
}

function renderDetail(){
  const f = state.flight;
  document.getElementById('title').textContent = `Vuelo ${f.flight_number}`;
  const detailCard = el(`
    <div class="neumorphic-panel p-6">
        <div class="flex flex-col md:flex-row justify-between items-start">
            <div>
                <h2 class="text-3xl font-bold text-gray-800">${f.origin} → ${f.destination}</h2>
                <p class="text-lg text-gray-500">${f.flight_number}</p>
            </div>
            <div class="text-left md:text-right mt-2 md:mt-0">
                <p class="font-semibold text-lg">${f.date}</p>
                <p class="text-gray-600">${f.time} hrs</p>
            </div>
        </div>
        <div class="mt-4 border-t pt-4 text-sm text-gray-600 grid grid-cols-2 md:grid-cols-4 gap-2">
            <span><strong>Terminal:</strong> ${f.terminal}</span>
            <span><strong>Puerta:</strong> ${f.gate}</span>
            <span><strong>Tipo:</strong> ${f.type}</span>
        </div>
    </div>
  `);
  document.getElementById('detail').appendChild(detailCard);
}

function seatTile(s){ 
    const div = el(`<div class="seat ${s.status} ${s.class}" data-code="${s.seat_code}">${s.seat_code}</div>`); 
    div.onclick=()=>seatClick(s); 
    return div; 
}

function renderSeats(){
  const first=document.getElementById('gridFirst'), eco=document.getElementById('gridEco'); 
  first.innerHTML=''; 
  eco.innerHTML='';
  state.seats.forEach(s=> (s.class==='first'?first:eco).appendChild(seatTile(s))); 
  updateCart();
}

function updateCart(){
  const cartContainer = document.getElementById('cart');
  cartContainer.innerHTML = '';
  let seatsTotal = 0;

  if (state.selected.size === 0) {
      cartContainer.innerHTML = '<p class="text-gray-500 text-center">Selecciona un asiento para comenzar.</p>';
  }

  for(const [code,cat] of state.selected.entries()){
    const s = state.seats.find(x=>x.seat_code===code);
    const price = (s.class==='first')? PRICES.primera : PRICES[cat];
    seatsTotal += price;

    const row = el(`
        <div class="py-3 border-b border-gray-200/60">
            <div class="flex justify-between items-center">
                <div>
                    <strong class="font-mono bg-gray-200/50 px-2 py-1 rounded-md text-sm">${code}</strong>
                    <span class="ml-2">${(s.class==='first')?'Primera Clase':'Clase Turista'}</span>
                </div>
                <div class="font-semibold text-lg">$${price.toLocaleString('es-MX')}</div>
            </div>
            ${s.class==='economy' ? '<div class="cat-chips mt-2 flex gap-2"></div>' : ''}
        </div>
    `);

    if (s.class === 'economy') {
        const host = row.querySelector('.cat-chips');
        ['adulto', 'nino', 'tercera'].forEach(k => {
            const isActive = k === cat;
            const chip = el(`
                <button class="text-xs font-semibold py-1 px-3 rounded-full transition-colors capitalize
                    ${isActive 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'neumorphic-button text-gray-700'
                    }">
                    ${k}
                </button>
            `);
            chip.onclick = () => {
                state.selected.set(code, k);
                updateCart();
            };
            host.appendChild(chip);
        });
    }
    cartContainer.appendChild(row);
  }

  const extrasBox = el(`
        <div class="mt-6">
            <h4 class="font-bold mb-3 text-gray-700">Añadir Equipaje</h4>
            <div class="space-y-3">
                <div class="flex items-center justify-between neumorphic-panel-inset p-3 rounded-xl">
                    <label for="exBag25" class="text-gray-700 text-sm">Documentado 25kg ($800)</label>
                    <input id="exBag25" type="number" min="0" max="5" value="${state.extras.bag25}" class="neumorphic-input rounded-lg w-20 p-2 text-center">
                </div>
                <div class="flex items-center justify-between neumorphic-panel-inset p-3 rounded-xl">
                    <label for="exBagExtra" class="text-gray-700 text-sm">Maleta adicional ($1200)</label>
                    <input id="exBagExtra" type="number" min="0" max="5" value="${state.extras.bagExtra}" class="neumorphic-input rounded-lg w-20 p-2 text-center">
                </div>
            </div>
        </div>
    `);
    
    extrasBox.querySelector('#exBag25').onchange = (e)=>{ state.extras.bag25 = parseInt(e.target.value||'0',10); updateCart(); };
    extrasBox.querySelector('#exBagExtra').onchange = (e)=>{ state.extras.bagExtra = parseInt(e.target.value||'0',10); updateCart(); };

    if(state.selected.size > 0) {
        cartContainer.appendChild(extrasBox);
    }
    
    const extrasTotal = (state.extras.bag25 * 800) + (state.extras.bagExtra * 1200);
    const grandTotal = seatsTotal + extrasTotal;

    const summary = el(`
        <div class="mt-6 border-t pt-4 space-y-2">
            <div class="flex justify-between text-gray-600">
                <span>Subtotal Asientos (${state.selected.size})</span>
                <span>$${seatsTotal.toLocaleString('es-MX')}</span>
            </div>
            <div class="flex justify-between text-gray-600">
                <span>Subtotal Extras</span>
                <span>$${extrasTotal.toLocaleString('es-MX')}</span>
            </div>
            <div class="flex justify-between font-bold text-2xl mt-2 text-gray-800">
                <span>Total</span>
                <span>$${grandTotal.toLocaleString('es-MX')}</span>
            </div>
        </div>
    `);
    
    if (state.selected.size > 0) {
        cartContainer.appendChild(summary);
    }
}

async function seatClick(seat){
  const ticketCount = parseInt(document.getElementById('ticketCount').value||'1',10);
  if (!state.selected.has(seat.seat_code) && state.selected.size >= ticketCount){ toast('Ya alcanzaste el número de boletos indicado.'); return; }
  if (seat.status==='purchased') return;
  try{
    if (state.selected.has(seat.seat_code)){
      await fetchJSON(`${API}/release_seat.php`, {method:'POST', body: JSON.stringify({flight_code, seat_code:seat.seat_code, token})});
      state.selected.delete(seat.seat_code);
    } else {
      await fetchJSON(`${API}/hold_seat.php`, {method:'POST', body: JSON.stringify({flight_code, seat_code:seat.seat_code, token})});
      const cat = (seat.class==='economy') ? 'adulto' : 'primera';
      state.selected.set(seat.seat_code, cat);
    }
    await refreshSeats(); await saveProgress();
  }catch(err){ alert(err.message); }
}

async function refreshSeats(){ 
    const res = await fetchJSON(`${API}/get_seats.php?code=${encodeURIComponent(flight_code)}`); 
    state.seats=res.seats; 
    renderSeats(); 
}

function openAuth(kind='login'){
  const dlg = document.getElementById('authModal');
  const form = document.getElementById('authForm');
  const title = document.getElementById('authTitle');
  const pass = document.getElementById('authPass');
  const nameBox = document.getElementById('nameBox');
  const nameInput = document.getElementById('authName');
  const switchP = document.getElementById('authSwitch');
  const passConfirmBox = document.getElementById('passConfirmBox');

  function applyMode(){
    const signup = (kind==='signup');
    title.textContent = signup ? 'Crear cuenta' : 'Iniciar sesión';
    nameBox.style.display = signup ? 'block' : 'none';
    nameInput.required = signup;
    passConfirmBox.style.display = signup ? 'block' : 'none';
    passConfirmBox.querySelector('input').required = signup;
    switchP.innerHTML = signup ? '¿Ya tienes cuenta? <a href="#" class="text-blue-600 hover:underline">Inicia sesión</a>' : '¿No tienes cuenta? <a href="#" class="text-blue-600 hover:underline">Crear una</a>';
  }
  
  applyMode();
  dlg.showModal();

  form.onsubmit = async (e)=>{
    e.preventDefault();
    try{
      if(kind==='signup'){
        const pass1 = pass.value;
        const pass2 = document.getElementById('authPass2').value;
        const rules=/^(?=.*[A-Z])(?=.*\d).{8,}$/;
        if(pass1 !== pass2){ alert('Las contraseñas no coinciden.'); return;}
        if(!rules.test(pass1)){ alert('La contraseña debe tener mínimo 8 caracteres, 1 mayúscula y 1 número.'); return;}
        await Auth.signup(nameInput.value.trim(), document.getElementById('authEmail').value.trim(), pass1);
        toast('Cuenta registrada con éxito');
      }else{
        await Auth.login(document.getElementById('authEmail').value.trim(), pass.value);
        toast('Sesión iniciada');
      }
      dlg.close();
      await refreshAuthUI();
      bindLogoutOnce();
    }catch(err){ alert(err.message); }
  };

  switchP.querySelector('a').onclick = (e)=>{ e.preventDefault(); kind = (kind==='signup'?'login':'signup'); applyMode(); };
  form.querySelector('button[value="cancel"]')?.addEventListener('click', ()=> dlg.close(), {once:true});
  dlg.addEventListener('close', () => form.reset());
}

function ensurePaymentIfNeeded(method){
  if (method!=='tarjeta') return Promise.resolve(true);
  const dlg=document.getElementById('payModal'); dlg.showModal();
  return new Promise((resolve)=>{
    document.getElementById('paySubmit').onclick = (e)=>{
      e.preventDefault();
      const name = document.getElementById('cardName').value.trim();
      const num = document.getElementById('cardNumber').value.trim();
      const exp = document.getElementById('cardExp').value.trim();
      const cvv = document.getElementById('cardCVV').value.trim();
      if(!name || num.length<12 || cvv.length<3){ toast('Completa los datos de tarjeta.'); return; }
      dlg.close(); resolve(true);
    };
    dlg.addEventListener('cancel', ()=> { dlg.close(); resolve(false); }, {once:true});
  });
}

document.getElementById('btnClear').onclick = async ()=>{
  for (const code of Array.from(state.selected.keys())){ 
      try { 
          await fetchJSON(`${API}/release_seat.php`, {method:'POST', body: JSON.stringify({flight_code, seat_code:code, token})}); 
      } catch(e) { console.error(e); } 
  }
  state.selected.clear();
  await refreshSeats(); await saveProgress();
};

document.getElementById('btnCheckout').onclick = async ()=>{
  if (!Auth.user){ openAuth('login'); return; }
  if (state.selected.size===0){ toast('No hay asientos seleccionados.'); return; }
  const method = document.getElementById('paymentMethod').value;
  if (!await ensurePaymentIfNeeded(method)) return;
  
  const seat_codes = Array.from(state.selected.keys());
  const categories = Object.fromEntries(state.selected.entries());
  try{
    const res = await fetchJSON(`${API}/checkout.php`, {method:'POST', body: JSON.stringify({flight_code, seat_codes, categories, token, payment_method:method, extras: state.extras})});
    const r = res.receipt; const dlg = document.getElementById('receiptModal');
    document.getElementById('receipt').innerHTML = `
      <h3 class="text-2xl font-bold mb-4">¡Compra Exitosa!</h3>
      <p><strong>Código de reservación:</strong> <span class="font-mono text-blue-600">${r.reservation_code}</span></p>
      <p><strong>Vuelo:</strong> ${r.flight_number}</p>
      <p><strong>Ruta:</strong> ${r.origin} → ${r.destination}</p>
      <p><strong>Fecha/Hora:</strong> ${r.date} ${r.time}</p>
      <p><strong>Terminal/Puerta:</strong> ${r.terminal} / ${r.gate}</p>
      <p><strong>Asientos:</strong> ${r.seat_codes.join(', ')}</p>
      <p><strong>Extras:</strong> $${r.extras_total.toLocaleString('es-MX')}</p>
      <p class="text-xl font-bold mt-2"><strong>Total:</strong> $${r.total.toLocaleString('es-MX')}</p>`;
    dlg.showModal(); 
    toast('Pago realizado con éxito'); 
    state.selected.clear();
    state.extras = {bag25:0, bagExtra:0};
    await refreshSeats(); await saveProgress();
  }catch(err){ alert(err.message); }
};

function bindLogoutOnce(){
  const o = document.getElementById('navLogout'); 
  if(!o || o.dataset.bound) return; 
  o.dataset.bound = '1'; 
  o.onclick=async(e)=>{ 
      e.preventDefault(); 
      await Auth.logout(); 
      await refreshAuthUI(); 
      toast('Sesión cerrada'); 
  }; 
}

(function dialogCancelCloser(){ 
    document.querySelectorAll('dialog button[value="cancel"]').forEach(btn=>{ 
        btn.addEventListener('click', ()=>{ 
            const d=btn.closest('dialog'); 
            if(d) d.close(); 
        }); 
    }); 
})();


async function init(){ 
    await refreshAuthUI();
    bindLogoutOnce();
    try {
        const fr=await fetchJSON(`${API}/get_flight.php?code=${encodeURIComponent(flight_code)}`); 
        state.flight=fr.flight; 
        renderDetail();
        /* restore progress */
        const p = await loadProgress();
        if(p && p.route==='flight' && p.params && p.params.code===flight_code && Array.isArray(p.state?.selected)){
          // Try to re-hold seats for the user
          for(const [sc,cat] of p.state.selected){
            try{ await fetchJSON(`${API}/hold_seat.php`, {method:'POST', body: JSON.stringify({flight_code, seat_code:sc, token})}); state.selected.set(sc,cat||'adulto'); }catch(e){}
          }
        }
 
        await refreshSeats(); await saveProgress(); 
        setInterval(refreshSeats, 3000); // Check for changes every 15s
    } catch(e) {
        document.querySelector('main').innerHTML = `<div class="neumorphic-panel text-center p-12"><h2 class="text-2xl font-bold text-red-600">Error</h2><p class="mt-2">No se pudo cargar la información del vuelo. Es posible que el código de vuelo sea incorrecto.</p></div>`;
    }
}

init();


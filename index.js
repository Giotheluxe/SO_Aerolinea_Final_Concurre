import {API, fetchJSON, el, Auth, toast} from './common.js';

/* === Imagen acorde al vuelo (por ciudad y/o IATA) === */
function imageForFlight(f){
  // CORRECCIÓN: Ahora solo busca en el destino para asegurar la imagen correcta.
  const text = (f.destination||f.destino||'').toLowerCase();

  const picks = [
    // --- Destinos Nacionales (México) ---
    {k:['cancún','cancun','cun'], url:'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?q=80&w=1100&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'},
    {k:['ciudad de méxico','ciudad de mexico','mexico city','mex','cdmx'], url:'https://images.unsplash.com/photo-1652073175063-402b831cc9b7?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'},
    {k:['puebla','pbc'], url:'https://images.unsplash.com/photo-1582110159423-f1c74147c4df?q=80&w=1600&auto=format&fit=crop'},
    {k:['tijuana','tij'], url:'https://images.unsplash.com/photo-1563609814792-9efc6f4a36a4?q=80&w=869&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'},
    {k:['guadalajara','gdl'], url:'https://images.unsplash.com/photo-1708733968596-b5a5b1cdfdd0?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'},
    {k:['querétaro','queretaro','qro'], url:'https://images.unsplash.com/photo-1582125712818-f03e1e9987a2?q=80&w=1600&auto=format&fit=crop'},
    {k:['monterrey','mty'], url:'https://images.unsplash.com/photo-1444222362538-bfeab10e1282?q=80&w=1032&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'},
    {k:['mérida','merida','mid'], url:'https://images.unsplash.com/photo-1620021632212-054b834e3223?q=80&w=1600&auto=format&fit=crop'},
    
    // --- Destinos Internacionales (NUEVAS URLs VERIFICADAS) ---
    {k:['los ángeles','los angeles','lax'], url:'https://images.unsplash.com/photo-1544413660-299165566b1d?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'},
    {k:['parís','paris','cdg'], url:'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=873&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'},
    {k:['dubái','dubai','dxb'], url:'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'},
    {k:['doha','doh','qatar'], url:'https://images.unsplash.com/photo-1604433203862-93bc73b0f1e9?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'},
    {k:['tokio','tokyo','nrt','hnd'], url:'https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=1600&auto=format&fit=crop'},
    {k:['londres','london','lhr','lgw'], url:'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'},
    {k:['madrid','mad'], url:'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?q=80&w=1600&auto=format&fit=crop'},
    {k:['nueva york','new york','nyc','jfk'], url:'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=1600&auto=format&fit=crop'}
  ];
  for(const p of picks){ if(p.k.some(k=>text.includes(k))) return p.url; }
  // Imagen por defecto si no se encuentra ninguna coincidencia
  return 'https://images.unsplash.com/photo-1525490102-3121b53fa455?q=80&w=1600&auto=format&fit=crop';
}

/* === AUTH UI === */
async function refreshAuthUI(){
  try{
    const me = await Auth.me();
    // Botones de escritorio
    document.getElementById('navLogin').style.display = me ? 'none' : '';
    document.getElementById('navSignup').style.display = me ? 'none' : '';
    document.getElementById('navMisVuelos').style.display = me ? '' : 'none';
    document.getElementById('navLogout').style.display = me ? '' : 'none';
    // Botones de móvil
    document.getElementById('mobileNavLogin').style.display = me ? 'none' : '';
    document.getElementById('mobileNavSignup').style.display = me ? 'none' : '';
    document.getElementById('mobileNavMisVuelos').style.display = me ? '' : 'none';
    document.getElementById('mobileNavLogout').style.display = me ? '' : 'none';
  }catch(e){}
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

function bindLogoutOnce(){
  document.querySelectorAll('#navLogout, #mobileNavLogout').forEach(btn => {
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = '1';
      btn.addEventListener('click', async (e)=>{
        e.preventDefault();
        await Auth.logout();
        await refreshAuthUI();
        toast('Sesión cerrada');
      });
    }
  });
}

/* === FLIGHTS === */
async function loadFlights(q=''){
  const url = q ? `${API}/search_flights.php?q=${encodeURIComponent(q)}` : `${API}/get_flights.php`;
  try {
    const data = await fetchJSON(url);
    const flights = data.flights || [];
    const list = document.getElementById('flights');
    list.innerHTML = '';
    if(flights.length===0){
      list.innerHTML = `<p class="text-gray-500 col-span-full text-center">No se encontraron vuelos que coincidan con la búsqueda.</p>`;
      return;
    }
    
    document.getElementById('flights').classList.add('active');
    flights.forEach(f=>{
      const dest = f.destination || f.destino || '';
      const origin = f.origin || f.origen || '';
      const img = imageForFlight(f);
      const when = [f.date||f.fecha, f.time||f.hora].filter(Boolean).join(' &middot; ');
      const terminal = f.terminal ? `Terminal ${f.terminal}` : '';
      const gate = f.gate ? `Puerta ${f.gate}` : '';
      const meta = [when, terminal, gate].filter(Boolean).join(' &middot; ');

      const card = el(`
        <article class="neumorphic-panel rounded-2xl overflow-hidden shadow-lg reveal flex flex-col">
          <div class="relative h-48">
            <img src="${img}" alt="Destino: ${dest}" class="w-full h-full object-cover transition-transform duration-300 hover:scale-105">
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            <div class="absolute bottom-0 left-0 p-4">
                <h3 class="text-xl font-bold text-white">${dest}</h3>
                <p class="text-sm text-white opacity-90">${origin}</p>
            </div>
          </div>
          <div class="p-5 flex-grow flex flex-col justify-between">
            <div>
              <p class="font-semibold text-gray-800">${f.flight_number}</p>
              <p class="text-sm text-gray-600 mt-1">${meta}</p>
            </div>
            <div class="mt-4">
              <a class="block w-full text-center bg-blue-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all"
                 href="flight.html?code=${encodeURIComponent(f.flight_number)}">Ver detalles y asientos</a>
            </div>
          </div>
        </article>
      `);
      list.appendChild(card);
    });

  } catch (error) {
    document.getElementById('flights').innerHTML = `<p class="text-red-500 col-span-full text-center">Error al cargar los vuelos. Por favor, intenta de nuevo más tarde.</p>`;
    console.error("Error en loadFlights:", error);
  }
}

/* === Events === */
document.getElementById('btnSearch')?.addEventListener('click', ()=> loadFlights(document.getElementById('q').value.trim()));
document.getElementById('btnClear')?.addEventListener('click', ()=>{ document.getElementById('q').value=''; loadFlights(); });
document.getElementById('q')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loadFlights(document.getElementById('q').value.trim());
    }
});

// Eventos para botones de escritorio
document.getElementById('navLogin')?.addEventListener('click', (e)=>{ e.preventDefault(); openAuth('login'); });
document.getElementById('navSignup')?.addEventListener('click', (e)=>{ e.preventDefault(); openAuth('signup'); });

// Eventos para botones de móvil
document.getElementById('mobileNavLogin')?.addEventListener('click', (e)=>{ e.preventDefault(); openAuth('login'); });
document.getElementById('mobileNavSignup')?.addEventListener('click', (e)=>{ e.preventDefault(); openAuth('signup'); });

/* === Init === */
(async ()=>{
  try{ const me = await Auth.me(); if(me){ /*toast('Sesión activa: '+me.email);*/ } }catch(_){}
  await refreshAuthUI();
  bindLogoutOnce();
  await loadFlights();
})();


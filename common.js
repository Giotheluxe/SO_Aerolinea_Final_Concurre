export const API = './api';
export async function fetchJSON(url, opts){
  const r = await fetch(url, Object.assign({headers:{'Content-Type':'application/json'}, credentials:'include'}, opts||{}));
  const text = await r.text(); let data=null; try{ data = text ? JSON.parse(text) : {}; }catch(e){ throw new Error('Respuesta no-JSON: '+text); }
  if(!r.ok) throw new Error(data.error || 'Error'); return data;
}
export function el(html){ const t=document.createElement('template'); t.innerHTML=html.trim(); return t.content.firstChild; }
export const PRICES = { adulto:65950, nino:60500, tercera:50000, primera:120000 };
export const token = localStorage.getItem('reservation_token') || (()=>{ const t=crypto.randomUUID(); localStorage.setItem('reservation_token',t); return t; })();
export const Auth = {
  user:null, async me(){ const r=await fetchJSON(`${API}/auth_me.php`); Auth.user=r.user; return Auth.user; },
  async login(email,password){ const r=await fetchJSON(`${API}/auth_login.php`,{method:'POST',body:JSON.stringify({email,password})}); Auth.user=r.user; return r.user; },
  async signup(name,email,password){ const r=await fetchJSON(`${API}/auth_signup.php`,{method:'POST',body:JSON.stringify({name,email,password})}); Auth.user=r.user; return r.user; },
  async logout(){ await fetchJSON(`${API}/auth_logout.php`); Auth.user=null; }
};
export function toast(msg){ let t=document.getElementById('toast'); if(!t){ t=document.createElement('div'); t.id='toast'; document.body.appendChild(t);
  Object.assign(t.style,{position:'fixed',bottom:'18px',right:'18px',background:'#0f3558',color:'#fff',padding:'12px 14px',borderRadius:'12px',zIndex:9999,boxShadow:'0 8px 24px rgba(15,53,88,.35)'}); }
  t.textContent=msg; t.style.opacity='1'; setTimeout(()=>{ t.style.transition='opacity .6s'; t.style.opacity='0'; },1800);
}

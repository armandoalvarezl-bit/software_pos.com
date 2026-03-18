<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FarmaPOS Cloud</title>

<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">

<style>
:root{
--bg-deep:#071726;
--bg-mid:#0b2537;
--panel:#f3f6fa;
--ink:#0f172a;
--muted:#64748b;
--line:#d7e0eb;
--brand:#0d8a6a;
--brand-2:#0a6f56;
--focus:rgba(13,138,106,.22);
}

*{
margin:0;
padding:0;
box-sizing:border-box;
font-family:'Poppins',sans-serif;
}

html{
background:var(--bg-deep);
}

body{
min-height:100vh;
display:grid;
grid-template-columns:minmax(0,1fr) 450px;
width:100%;
margin:0;
background:
radial-gradient(1300px 560px at 8% -12%, #2dd4bf26 0%, transparent 58%),
radial-gradient(900px 480px at 100% 14%, #22c55e1f 0%, transparent 54%),
linear-gradient(145deg, var(--bg-deep) 0%, var(--bg-mid) 46%, #0c1f34 100%);
color:var(--ink);
line-height:1.35;
overflow-x:hidden;
}

.intro-screen{
position:fixed;
inset:0;
z-index:12000;
display:flex;
align-items:center;
justify-content:center;
padding:20px;
background:
radial-gradient(circle at 30% 18%, #34d39933 0%, transparent 35%),
radial-gradient(circle at 70% 75%, #2dd4bf2b 0%, transparent 32%),
linear-gradient(140deg,#022c22 0%, #064e3b 48%, #0f766e 100%);
transition:opacity .45s ease, visibility .45s ease;
}

.intro-screen.hide{
opacity:0;
visibility:hidden;
pointer-events:none;
}

.intro-card{
width:min(620px,100%);
text-align:center;
color:#ecfdf5;
padding:34px 28px;
border-radius:22px;
border:1px solid #bbf7d044;
background:linear-gradient(165deg,#ffffff1a 0%, #ffffff0d 100%);
box-shadow:0 24px 60px rgba(2,6,23,.38);
backdrop-filter:blur(4px);
}

.intro-logo{
font-size:42px;
font-weight:700;
letter-spacing:.2px;
margin-bottom:8px;
}

.intro-logo span{
color:#86efac;
}

.intro-sub{
font-size:15px;
line-height:1.45;
opacity:.95;
max-width:480px;
margin:0 auto 22px;
}

.intro-enter{
width:auto;
min-width:210px;
padding:12px 22px;
border:1px solid #86efac66;
border-radius:11px;
background:linear-gradient(135deg,#047857,#059669);
color:#ecfdf5;
font-weight:700;
font-size:13px;
letter-spacing:.3px;
cursor:pointer;
box-shadow:0 10px 22px rgba(2,6,23,.30);
transition:transform .15s ease, filter .2s ease;
display:inline-flex;
justify-content:center;
align-items:center;
margin:0 auto;
}

.intro-enter:hover{
transform:translateY(-1px);
filter:brightness(1.04);
}

.left{
position:relative;
display:flex;
align-items:center;
padding:56px 66px;
overflow:hidden;
}

.left::before{
content:'';
position:absolute;
inset:0;
background:
linear-gradient(112deg, #ffffff17 0%, transparent 46%),
radial-gradient(circle at 16% 24%, #ffffff2b 0%, transparent 31%),
radial-gradient(circle at 80% 78%, #99f6e42e 0%, transparent 34%);
pointer-events:none;
}

.hero-copy{
position:relative;
z-index:2;
max-width:640px;
padding:30px 30px 28px;
border-radius:22px;
background:linear-gradient(160deg, #ffffff1f 0%, #ffffff0c 100%);
border:1px solid #ffffff30;
box-shadow:0 16px 38px rgba(2,6,23,.22);
}

.hero-tag{
display:inline-flex;
align-items:center;
gap:8px;
padding:7px 12px;
font-size:11px;
font-weight:700;
letter-spacing:.45px;
text-transform:uppercase;
border-radius:999px;
color:#dcfce7;
border:1px solid #86efac88;
background:#064e3b77;
margin-bottom:16px;
}

.left h1{
font-size:48px;
line-height:1;
margin-bottom:14px;
max-width:580px;
letter-spacing:-.7px;
color:#f0fdf4;
}

.left p{
font-size:19px;
opacity:.96;
max-width:560px;
line-height:1.35;
color:#e6fff5;
}

.floating{
position:absolute;
border-radius:999px;
background:#ffffff1e;
animation:float 12s infinite ease-in-out;
z-index:1;
}

.f1{top:8%;left:8%;width:160px;height:160px;}
.f2{bottom:8%;right:16%;width:146px;height:146px;}
.f3{top:40%;right:7%;width:124px;height:124px;}

@keyframes float{
0%,100%{transform:translateY(0);}
50%{transform:translateY(-20px);}
}

.right{
position:relative;
display:flex;
align-items:center;
justify-content:center;
padding:34px 26px;
background:linear-gradient(180deg,#eff4f9 0%, #e7edf5 100%);
border-left:1px solid #cfd8e5;
}

.login-box{
width:100%;
max-width:372px;
background:#ffffff;
border:1px solid var(--line);
border-radius:20px;
padding:24px 20px;
box-shadow:0 20px 44px rgba(9,20,35,.12);
transition:transform .35s ease, opacity .35s ease, filter .35s ease;
}

body.prelogin .login-box{
opacity:0;
transform:translateY(10px) scale(.98);
filter:blur(2px);
pointer-events:none;
}

body.form-ready .login-box{
opacity:1;
transform:translateY(0) scale(1);
filter:none;
pointer-events:auto;
}

.logo{
font-size:34px;
font-weight:700;
line-height:1;
color:var(--brand-2);
letter-spacing:.2px;
}

.logo span{
color:#22c55e;
}

.subtitle{
font-size:13px;
color:var(--muted);
margin-top:3px;
margin-bottom:16px;
padding-bottom:12px;
border-bottom:1px solid #e5ebf2;
}

.input-group{
margin-bottom:12px;
}

.password-wrap{
position:relative;
}

input{
width:100%;
padding:12px 12px;
border-radius:10px;
border:1px solid #c6d3e0;
font-size:13px;
outline:none;
transition:border-color .2s, box-shadow .2s, background .2s;
background:#f8fbff;
color:#0f172a;
}

input::placeholder{
color:#7b8ba0;
}

input:focus{
border-color:var(--brand);
background:#fff;
box-shadow:0 0 0 4px var(--focus);
}

.toggle-pass{
position:absolute;
right:8px;
top:50%;
transform:translateY(-50%);
border:none;
background:transparent;
color:#31465e;
font-size:11px;
font-weight:700;
letter-spacing:.25px;
cursor:pointer;
padding:6px 8px;
border-radius:7px;
box-shadow:none;
width:auto;
}

.toggle-pass:hover{
background:#edf3f8;
transform:translateY(-50%);
}

#btnLogin{
width:100%;
padding:12px;
background:linear-gradient(135deg,var(--brand),var(--brand-2));
border:none;
border-radius:10px;
color:#fff;
font-weight:700;
font-size:13px;
letter-spacing:.3px;
cursor:pointer;
transition:transform .15s, box-shadow .2s, filter .2s;
margin-top:6px;
display:flex;
justify-content:center;
align-items:center;
box-shadow:0 10px 20px rgba(6,95,70,.28);
}

#btnLogin:hover{
filter:brightness(1.03);
transform:translateY(-1px);
}

#btnLogin.loading{
opacity:.72;
pointer-events:none;
}

.spinner{
width:16px;
height:16px;
border:2px solid rgba(255,255,255,0.35);
border-top:2px solid white;
border-radius:50%;
animation:spin 1s linear infinite;
margin-left:8px;
display:none;
}

@keyframes spin{
to{transform:rotate(360deg);}
}

.message{
margin-top:9px;
font-size:12px;
display:none;
}

.error{
color:#dc2626;
}

.success{
color:#15803d;
}

.domain-preview{
font-size:11px;
color:#64748b;
margin-top:4px;
padding-left:1px;
}

.caps-warning{
font-size:11px;
color:#b45309;
display:none;
margin-top:4px;
}

.links{
margin-top:15px;
font-size:12px;
display:flex;
justify-content:space-between;
gap:10px;
}

.links a{
text-decoration:none;
color:var(--brand-2);
font-weight:600;
}

.footer{
margin-top:16px;
font-size:11px;
color:#91a0b5;
text-align:center;
}

.app-loading{
position:fixed;
inset:0;
background:rgba(11,18,32,.72);
backdrop-filter:blur(2px);
display:none;
align-items:center;
justify-content:center;
z-index:9999;
}

.toast{
position:fixed;
top:18px;
right:18px;
z-index:12050;
min-width:260px;
max-width:360px;
padding:12px 14px;
border-radius:12px;
border:1px solid #bbf7d0;
background:#ecfdf5;
color:#14532d;
box-shadow:0 14px 28px rgba(2,6,23,.20);
font-size:13px;
font-weight:600;
opacity:0;
transform:translateY(-8px);
pointer-events:none;
transition:opacity .22s ease, transform .22s ease;
}

.toast.show{
opacity:1;
transform:translateY(0);
}

.app-loading.active{
display:flex;
}

.app-loading-card{
min-width:260px;
background:#ffffff;
border:1px solid #e2e8f0;
border-radius:16px;
padding:18px 16px;
text-align:center;
box-shadow:0 16px 34px rgba(15,23,42,.28);
}

.app-loading-title{
font-size:14px;
font-weight:600;
color:#065f46;
margin-bottom:8px;
}

.dots{
display:flex;
justify-content:center;
gap:6px;
}

.dots span{
width:8px;
height:8px;
border-radius:999px;
background:#10b981;
animation:bounce 1s infinite ease-in-out;
}

.dots span:nth-child(2){animation-delay:.15s;}
.dots span:nth-child(3){animation-delay:.3s;}

@keyframes bounce{
0%,80%,100%{transform:scale(.65);opacity:.55;}
40%{transform:scale(1);opacity:1;}
}

.modal{
position:fixed;
inset:0;
background:rgba(2,6,23,.55);
display:none;
align-items:center;
justify-content:center;
z-index:10001;
padding:16px;
}

.modal.active{
display:flex;
}

.modal-card{
width:100%;
max-width:390px;
background:#fff;
border:1px solid #e2e8f0;
border-radius:14px;
padding:16px;
box-shadow:0 20px 45px rgba(15,23,42,.35);
}

.modal-title{
font-size:.95rem;
font-weight:700;
color:#065f46;
margin-bottom:6px;
}

.modal-sub{
font-size:.8rem;
color:#64748b;
margin-bottom:10px;
}

.modal-actions{
display:flex;
gap:8px;
margin-top:10px;
}

.modal-actions button,
.btn-ghost{
width:100%;
padding:10px;
border-radius:9px;
font-weight:600;
cursor:pointer;
}

.modal-actions button{
background:linear-gradient(135deg,var(--brand),var(--brand-2));
border:none;
color:#fff;
}

.btn-ghost{
border:1px solid #d1d5db;
background:#fff;
color:#334155;
}

@media(max-width:1080px){
.left h1{font-size:40px;}
.left p{font-size:17px;}
body{grid-template-columns:minmax(0,1fr) 430px;}
}

@media(max-width:950px){
body{
display:flex;
align-items:center;
justify-content:center;
padding:18px;
}
.left{display:none;}
.right{
width:100%;
max-width:500px;
min-width:0;
padding:0;
background:transparent;
border-left:none;
}
.login-box{max-width:500px;}
.intro-logo{font-size:34px;}
.intro-sub{font-size:14px;}
}
</style>
</head>

<body class="form-ready">

<div class="intro-screen" id="introScreen" style="display:none">
  <div class="intro-card">
    <div class="intro-logo">+<span>FarmaPOS</span></div>
    <div class="intro-sub">Gestiona tu farmacia de forma profesional: ventas, inventario y reportes en una sola plataforma.</div>
    <button type="button" class="intro-enter" id="introEnter">Entrar al sistema</button>
  </div>
</div>

<div class="left">
<div class="hero-copy">
<div class="hero-tag">Sistema POS en la nube</div>
<h1>Plataforma Empresarial en la Nube</h1>
<p>Administra ventas, inventario y facturacion desde cualquier lugar con FarmaPOS Cloud.</p>
</div>
<div class="floating f1"></div>
<div class="floating f2"></div>
<div class="floating f3"></div>
</div>

<div class="right">
<div class="login-box">

<div class="logo">+<span>FarmaPOS</span></div>
<div class="subtitle">Accede a tu cuenta empresarial</div>

<div class="input-group">
<input type="text" id="empresa" placeholder="Empresa / Dominio">
<div class="domain-preview" id="preview"></div>
</div>

<div class="input-group">
<input type="text" id="usuario" placeholder="Usuario">
</div>

<div class="input-group">
<div class="password-wrap">
  <input type="password" id="clave" placeholder="Contrasena">
  <button type="button" class="toggle-pass" id="togglePass">VER</button>
</div>
<div class="caps-warning" id="capsWarning">Caps Lock esta activado.</div>
</div>

<button id="btnLogin" onclick="login()">
INICIAR SESION
<div class="spinner" id="spinner"></div>
</button>

<div class="message error" id="errorMsg"></div>
<div class="message success" id="successMsg"></div>

<div class="links">
<a href="#" id="linkRecover">Olvidaste tu contrasena?</a>
<a href="#">Soporte</a>
</div>

<div class="footer">
&copy; 2026 FarmaPOS Cloud
</div>

</div>
</div>

<div class="app-loading" id="appLoading">
  <div class="app-loading-card">
    <div class="app-loading-title" id="appLoadingText">Validando acceso...</div>
    <div class="dots"><span></span><span></span><span></span></div>
  </div>
</div>

<div class="toast" id="toastMsg"></div>

<div class="modal" id="recoverModal">
  <div class="modal-card">
    <div class="modal-title">Recuperar contrasena</div>
    <div class="modal-sub">Ingresa tu usuario para generar una clave temporal.</div>

    <div class="input-group">
      <input type="text" id="recoverEmpresa" placeholder="Empresa / Dominio (opcional)">
    </div>
    <div class="input-group">
      <input type="text" id="recoverUsuario" placeholder="Usuario">
    </div>

    <div class="message error" id="recoverError"></div>
    <div class="message success" id="recoverSuccess"></div>

    <div class="modal-actions">
      <button class="btn-ghost" type="button" onclick="closeRecoverModal()">Cancelar</button>
      <button type="button" onclick="recoverPassword()">Generar clave temporal</button>
    </div>
  </div>
</div>

<script>

const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzJ1B5fF46bkkXLJfgF5LAKUwE0IvtfZJ_1wEC1x2PKgp8-ENh6V-Rp4apQyMEuYvSE/exec";
const empresaInput = document.getElementById("empresa");
const preview = document.getElementById("preview");
const appLoading = document.getElementById("appLoading");
const appLoadingText = document.getElementById("appLoadingText");
const recoverModal = document.getElementById("recoverModal");
const claveInput = document.getElementById("clave");
const capsWarning = document.getElementById("capsWarning");
const togglePass = document.getElementById("togglePass");
const introScreen = document.getElementById("introScreen");
const introEnter = document.getElementById("introEnter");
const toastMsg = document.getElementById("toastMsg");

function showLoginForm(){
if(!document.body.classList.contains("prelogin")) return;
document.body.classList.remove("prelogin");
document.body.classList.add("form-ready");
introScreen.classList.add("hide");
setTimeout(()=>{ introScreen.style.display = "none"; }, 460);
setTimeout(()=>{ empresaInput.focus(); }, 220);
}

introEnter.addEventListener("click", showLoginForm);

empresaInput.addEventListener("input",()=>{
let value = empresaInput.value.trim().toLowerCase();
preview.innerText = value ? value + ".farmapos.com" : "";
});

document.getElementById("linkRecover").addEventListener("click",(e)=>{
e.preventDefault();
openRecoverModal();
});

togglePass.addEventListener("click",()=>{
const isHidden = claveInput.type === "password";
claveInput.type = isHidden ? "text" : "password";
togglePass.innerText = isHidden ? "OCULTAR" : "VER";
});

claveInput.addEventListener("keydown",(e)=>{
if(e.getModifierState && e.getModifierState("CapsLock")){
capsWarning.style.display = "block";
}
});

claveInput.addEventListener("keyup",(e)=>{
if(e.getModifierState && e.getModifierState("CapsLock")){
capsWarning.style.display = "block";
}else{
capsWarning.style.display = "none";
}
});

document.addEventListener("keydown",(e)=>{
if(document.body.classList.contains("prelogin")){
if(e.key === "Enter"){
e.preventDefault();
showLoginForm();
}
return;
}
if(e.key === "Escape" && recoverModal.classList.contains("active")){
closeRecoverModal();
}
if(e.key === "Enter" && !recoverModal.classList.contains("active")){
login();
}
});

recoverModal.addEventListener("click",(e)=>{
if(e.target === recoverModal){
closeRecoverModal();
}
});

function setAppLoading(show, text){
if(text){ appLoadingText.innerText = text; }
if(show){ appLoading.classList.add("active"); }
else{ appLoading.classList.remove("active"); }
}

function parseDateSafe(v){
if(!v) return null;
const d = new Date(v);
if(!isNaN(d.getTime())) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
const s = String(v).trim();
const p = s.split(/[\/-]/);
if(p.length === 3){
  const a = Number(p[0]), b = Number(p[1]), c = Number(p[2]);
  if(a > 31) return new Date(a, b - 1, c);
  if(c > 31) return new Date(c, b - 1, a);
}
return null;
}

function addMonths(baseDate, months){
const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
d.setMonth(d.getMonth() + Number(months || 0));
return d;
}

function daysLeft(fromDate, toDate){
const ms = toDate.getTime() - fromDate.getTime();
return Math.ceil(ms / 86400000);
}

function inferMonthsFromPlan(planRaw){
const p = String(planRaw || "").toLowerCase().trim();
if(!p) return 0;
if(p.includes("12") || p.includes("anual") || p.includes("año")) return 12;
if(p.includes("6") || p.includes("semes")) return 6;
if(p.includes("3") || p.includes("trimes")) return 3;
if(p.includes("demo")) return 1;
return 0;
}

function getHeaderIndex(headers, candidates, fallbackIdx){
for(const c of candidates){
  const i = headers.findIndex(h => h === c || h.includes(c));
  if(i >= 0) return i;
}
return fallbackIdx != null ? fallbackIdx : -1;
}

function resolveLicenseInfo(headers, row){
const today = new Date();
const baseToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

const idxPlan = getHeaderIndex(headers, ["plan", "licencia", "tipo_licencia"], -1);
const idxMonths = getHeaderIndex(headers, ["licencia_meses", "meses_licencia", "plan_meses"], -1);
const idxStart = getHeaderIndex(headers, ["licencia_inicio", "fecha_inicio_licencia", "inicio_licencia"], -1);
const idxEnd = getHeaderIndex(headers, ["licencia_fin", "fecha_fin_licencia", "vencimiento_licencia", "fin_licencia"], -1);

const plan = idxPlan >= 0 ? String(row[idxPlan] || "").trim() : "";
const months = idxMonths >= 0 ? Number(row[idxMonths] || 0) : inferMonthsFromPlan(plan);
const start = parseDateSafe(idxStart >= 0 ? row[idxStart] : null) || baseToday;
let end = parseDateSafe(idxEnd >= 0 ? row[idxEnd] : null);
if(!end && months > 0) end = addMonths(start, months);

if(!end){
  return { active: true, plan: plan || "Sin limite", end: null, days: null };
}
const remaining = daysLeft(baseToday, end);
return { active: remaining >= 0, plan: plan || `${months} meses`, end, days: remaining };
}

function saveLicenseSession(lic){
if(!lic) return;
localStorage.setItem("licencia_plan", String(lic.plan || ""));
localStorage.setItem("licencia_estado", lic.active ? "activa" : "vencida");
localStorage.setItem("licencia_dias", lic.days == null ? "" : String(lic.days));
localStorage.setItem("licencia_fin", lic.end ? lic.end.toISOString().slice(0,10) : "");
}

function showToast(message){
if(!toastMsg) return;
toastMsg.innerText = message;
toastMsg.classList.add("show");
clearTimeout(showToast._timer);
showToast._timer = setTimeout(()=>{
toastMsg.classList.remove("show");
}, 2000);
}

function openRecoverModal(){
document.getElementById("recoverEmpresa").value = empresaInput.value.trim();
document.getElementById("recoverUsuario").value = document.getElementById("usuario").value.trim();
document.getElementById("recoverError").style.display = "none";
document.getElementById("recoverSuccess").style.display = "none";
recoverModal.classList.add("active");
}

function closeRecoverModal(){
recoverModal.classList.remove("active");
}

async function recoverPassword(){
const empresa = document.getElementById("recoverEmpresa").value.trim();
const usuario = document.getElementById("recoverUsuario").value.trim();
const err = document.getElementById("recoverError");
const ok = document.getElementById("recoverSuccess");
err.style.display = "none";
ok.style.display = "none";

if(!usuario){
err.innerText = "El usuario es obligatorio.";
err.style.display = "block";
return;
}

setAppLoading(true,"Generando clave temporal...");
try{
const url = WEBAPP_URL + "?action=recover_password&empresa=" + encodeURIComponent(empresa) + "&usuario=" + encodeURIComponent(usuario);
const res = await fetch(url,{cache:"no-store"});
const data = await res.json();
if(!res.ok || !data || data.ok === false){
throw new Error(data && data.error ? data.error : "No se pudo recuperar");
}

ok.innerText = "Clave temporal: " + data.temporary_password;
ok.style.display = "block";

document.getElementById("usuario").value = usuario;
document.getElementById("clave").value = data.temporary_password || "";
if(empresa){ empresaInput.value = empresa; }
}catch(error){
err.innerText = error && error.message ? error.message : "Error conectando con la base de datos.";
err.style.display = "block";
}finally{
setAppLoading(false);
}
}

async function login(){

const empresa = empresaInput.value.trim();
const usuario = document.getElementById("usuario").value.trim();
const clave = document.getElementById("clave").value.trim();

const btn = document.getElementById("btnLogin");
const spinner = document.getElementById("spinner");
const errorMsg = document.getElementById("errorMsg");
const successMsg = document.getElementById("successMsg");

errorMsg.style.display="none";
successMsg.style.display="none";
setAppLoading(true,"Validando acceso...");

if(!usuario || !clave){
errorMsg.innerText="Usuario y contrasena son obligatorios.";
errorMsg.style.display="block";
setAppLoading(false);
return;
}

btn.classList.add("loading");
spinner.style.display="inline-block";

try{
const response = await fetch(WEBAPP_URL);
const data = await response.json();

let acceso = false;

if(!Array.isArray(data) || data.length < 2){
errorMsg.innerText="No hay usuarios registrados o formato de datos invalido.";
errorMsg.style.display="block";
btn.classList.remove("loading");
spinner.style.display="none";
setAppLoading(false);
return;
}

const headers = (data[0] || []).map(h => String(h || "").trim().toLowerCase());
const idxUsuario = headers.findIndex(h => h === "usuario" || h.includes("usuario"));
const idxClave = headers.findIndex(h => h === "clave" || h.includes("contrase"));
const idxRol = headers.findIndex(h => h === "rol" || h.includes("perfil"));
const idxEstado = headers.findIndex(h => h === "estado" || h.includes("activo"));

for(let i=1;i<data.length;i++){

let usuarioSheet = data[i][idxUsuario >= 0 ? idxUsuario : 2];
let claveSheet = data[i][idxClave >= 0 ? idxClave : 3];
let rol = data[i][idxRol >= 0 ? idxRol : 4];
let estado = data[i][idxEstado >= 0 ? idxEstado : 5];

if(String(usuarioSheet || "").trim().toLowerCase() === usuario.toLowerCase() && String(claveSheet || "").trim() === clave){

if(String(estado || "").trim().toLowerCase() !== "activo"){
errorMsg.innerText="Usuario inactivo.";
errorMsg.style.display="block";
break;
}

  const lic = resolveLicenseInfo(headers, data[i] || []);
  // No bloqueamos el acceso por licencia: solo guardamos el estado en session/localStorage.

  acceso = true;

localStorage.setItem("usuario",usuario);
localStorage.setItem("rol",rol);
localStorage.setItem("empresa",empresa || "general");
saveLicenseSession(lic);

const licMsg = lic.days == null ? lic.plan : `${lic.plan} | ${lic.days} dias restantes`;
successMsg.innerText="Bienvenido "+rol+". "+licMsg+". Redirigiendo...";
successMsg.style.display="block";
showToast("Bienvenido " + usuario + ". Login exitoso.");
setAppLoading(true,"Cargando modulo principal...");

setTimeout(()=>{
window.location.href="dashboard.html";
},1500);

break;
}
}

if(!acceso){
errorMsg.innerText="Credenciales incorrectas.";
errorMsg.style.display="block";
setAppLoading(false);
}

}catch(error){
errorMsg.innerText="Error conectando con la base de datos.";
errorMsg.style.display="block";
setAppLoading(false);
}

btn.classList.remove("loading");
spinner.style.display="none";

}

</script>

</body>
</html>

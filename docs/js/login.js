'use strict';
document.addEventListener('DOMContentLoaded',()=>{
 const form=document.querySelector('#login-form');
 form.addEventListener('submit',async e=>{
  e.preventDefault();const button=e.submitter;button.disabled=true;const error=document.querySelector('#login-error');error.textContent='';
  try{
   const d=new FormData(form);const sesion=await iniciarSesion(d.get('id'),d.get('clave'));
   const rutas=[['dashboard.ver','dashboard.html'],['objetos.ver','herramientas.html'],['prestamos.ver','prestamos.html'],['usuarios.gestionar','admin.html']];
   const destino=rutas.find(([p])=>puede(p));if(!destino)throw new Error('Tu cuenta no tiene módulos habilitados. Consultá al administrador.');
   let url=new URL(destino[1],location.href);const next=new URLSearchParams(location.search).get('next');
   if(next){const requested=new URL(next,location.origin);const root=new URL('./',location.href).pathname;if(requested.origin===location.origin&&requested.pathname.startsWith(root)&&!requested.pathname.endsWith('login.html'))url=requested;}
   location.replace(url.href);
  }catch(err){error.textContent=err.message;showAlert(err.message,'error');}finally{button.disabled=false;}
 });
});

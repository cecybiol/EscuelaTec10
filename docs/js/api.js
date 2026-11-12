const API_BASE=new URL('../api/',document.currentScript.src);
let sesionActual=null;
class ErrorAPI extends Error {constructor(mensaje,status){super(mensaje);this.status=status;}}
async function api(recurso,{metodo='GET',datos,params={}}={}) {
 const url=new URL(recurso+'.php',API_BASE);
 url.search=new URLSearchParams(params);
 const r=await fetch(url,{method:metodo,credentials:'same-origin',cache:'no-store',
  headers:{'Content-Type':'application/json','X-CSRF-Token':sesionActual?.csrf??''},
  ...(datos===undefined?{}:{body:JSON.stringify(datos)})});
 let salida;try{salida=await r.json();}catch{throw new Error('La respuesta no es JSON. Revisar PHP y la ruta');}
 if(!r.ok)throw new ErrorAPI(salida.error||'Error del servidor',r.status);
 return salida;
}
async function iniciarSesion(id,clave){sesionActual=await api('sesion',{metodo:'POST',datos:{id,clave}});return sesionActual;}
async function comprobarSesion(){
 try {sesionActual=await api('sesion');return sesionActual;}
 catch(e){if(e.status===401){sesionActual=null;const loginURL=new URL('../pages/login.html',API_BASE);loginURL.searchParams.set('next',location.pathname+location.search);location.replace(loginURL);return null;}throw e;}
}
function puede(codigo){return sesionActual?.permisos.some(p=>p.codigo===codigo)??false;}
function aplicarPermisos(){document.querySelectorAll('[data-permiso]').forEach(el=>{el.hidden=!puede(el.dataset.permiso);});}
async function cerrarSesion(){await api('sesion',{metodo:'DELETE'});sesionActual=null;const loginURL=new URL('../pages/login.html',API_BASE);loginURL.searchParams.set('next',location.pathname+location.search);location.replace(loginURL);}
async function listarObjetos(tipo){return api('objetos',{params:{tipo}});}
async function listarHerramientas(){return listarObjetos('herramienta');}
async function guardarObjeto(datos){return api('objetos',{metodo:datos.id?'PUT':'POST',datos});}
async function guardarHerramienta(d){return guardarObjeto({...d,tipo:'herramienta',modo_control:'individual'});}
async function eliminarObjeto(id){return api('objetos',{metodo:'DELETE',datos:{id}});}
async function listarPrestamos(){return api('prestamos');}
async function crearPrestamo(datos){return api('prestamos',{metodo:'POST',datos});}
async function devolverUnidad(detalle_id){return api('prestamos',{metodo:'PUT',datos:{detalle_id:String(detalle_id)}});}
async function guardarUsuario(datos){return api('usuarios',{metodo:datos.id?'PUT':'POST',datos});}
async function eliminarUsuario(id){return api('usuarios',{metodo:'DELETE',datos:{id}});}

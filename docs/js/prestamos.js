// Conserva el formulario y la tabla de E4. Todas las operaciones persisten en MariaDB.
document.addEventListener('DOMContentLoaded',()=>run(async()=>{
 $('#historial').replaceChildren();$('#item').replaceChildren();
 if(!await prepararModulo('prestamos.ver'))return;
 const form=$('#formulario'),historial=$('#historial'),registrar=$('#btn-registrar');
 const puedeCrear=puede('prestamos.crear');
 let prestamos=[],opciones=null,cargando=false,guardando=false,escaneando=false;
 const anterior=$('#solicitante'),solicitante=document.createElement('select');
 solicitante.id=anterior.id;solicitante.className=anterior.className;solicitante.required=true;anterior.replaceWith(solicitante);
 const item=$('#item');item.multiple=true;item.size=4;
 const cantidad=$('#cantidad');cantidad.readOnly=true;cantidad.value=0;
 const grupo=document.createElement('div');grupo.className='form-group';
 grupo.innerHTML='<label for="fecha-prevista">Fecha prevista de devolución:</label><input id="fecha-prevista" type="date" class="input" required>';
 cantidad.closest('.form-group').after(grupo);
 const fecha=$('#fecha-prevista');
 function hoy(){const partes=new Intl.DateTimeFormat('en',{timeZone:'America/Argentina/San_Luis',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const p=Object.fromEntries(partes.map(x=>[x.type,x.value]));return `${p.year}-${p.month}-${p.day}`;}
 fecha.min=fecha.value=hoy();
 const ayuda=document.createElement('p');ayuda.id='prestamos-ayuda';ayuda.className='estado-datos__msg';ayuda.setAttribute('role','status');item.after(ayuda);item.setAttribute('aria-describedby',ayuda.id);
 const acciones=document.createElement('div');acciones.className='form-group';ayuda.after(acciones);
 const mensaje=document.createElement('p');mensaje.id='prestamos-mensaje';mensaje.setAttribute('role','status');mensaje.setAttribute('aria-live','polite');form.prepend(mensaje);
 function informar(texto,tipo='info'){mensaje.textContent=texto;mensaje.className='estado-datos__msg estado-datos__msg--'+(tipo==='error'?'error':'info');}
 function actualizarBoton(){registrar.disabled=!puedeCrear||cargando||guardando||escaneando||!opciones?.unidades.length||!opciones?.solicitantes.length||!solicitante.value||!seleccionadas().length;}
 const seleccionadas=()=>[...item.selectedOptions].map(o=>o.value).filter(Boolean);
 item.addEventListener('change',()=>{cantidad.value=seleccionadas().length;actualizarBoton();});
 solicitante.addEventListener('change',actualizarBoton);
 form.closest('section').hidden=!puedeCrear;
 registrar.disabled=true;
 const escaner=instalarEscanerPrestamo({form,item,solicitante,informar,agregar:async codigo=>{
  if(guardando||cargando)throw new Error('Esperá a que termine la operación actual.');
  if(!solicitante.value)throw new Error('Primero seleccioná el usuario que recibe el préstamo.');
  escaneando=true;actualizarBoton();
  try{
  const {ejemplar:u}=await api('prestamo_qr',{params:{codigo}});
  if(seleccionadas().includes(u.id)){informar('El ejemplar '+u.id+' ya está seleccionado.');return;}
  if(seleccionadas().length>=100)throw new Error('Se permiten hasta 100 ejemplares por entrega.');
  let opt=[...item.options].find(x=>x.value===u.id);
  if(!opt){opt=new Option(u.nombre+' · '+u.id+(u.ubicacion?' · '+u.ubicacion:''),u.id);item.add(opt);opciones.unidades.push(u);}
  opt.selected=true;item.disabled=false;cantidad.value=seleccionadas().length;actualizarBoton();
  informar('Agregado: '+u.nombre+' · '+u.id+(u.numero_serie?' · serie '+u.numero_serie:'')+(u.ubicacion?' · '+u.ubicacion:''));
  }finally{escaneando=false;actualizarBoton();}
 }});
 async function cargarOpciones(preferida=null){
  if(!puedeCrear)return;
  const seleccionPrevia=new Set(seleccionadas());
  cargando=true;opciones=null;actualizarBoton();solicitante.disabled=item.disabled=true;
  const solicitantePrevio=solicitante.value;
  solicitante.replaceChildren(new Option('Cargando solicitantes…',''));item.replaceChildren();cantidad.value=0;
  ayuda.textContent='Consultando ejemplares disponibles…';acciones.replaceChildren();
  try{
   const datos=await api('prestamos_opciones');opciones=datos;
   solicitante.replaceChildren(new Option('Seleccionar solicitante…',''));
   datos.solicitantes.forEach(u=>solicitante.add(new Option(u.alias+' · '+u.id,u.id)));
   if(datos.solicitantes.some(u=>u.id===solicitantePrevio))solicitante.value=solicitantePrevio;
   else if(datos.solicitantes.length===1)solicitante.value=datos.solicitantes[0].id;
   datos.unidades.forEach(u=>{const opt=new Option(u.nombre+' · '+u.id+(u.ubicacion?' · '+u.ubicacion:''),u.id);opt.selected=u.id===preferida||seleccionPrevia.has(u.id);item.add(opt);});
   cantidad.value=seleccionadas().length;
   const d=datos.diagnostico;
   if(!datos.solicitantes.length)ayuda.textContent='No hay solicitantes activos. Un administrador debe registrar al menos uno.';
   else if(!datos.unidades.length){
    ayuda.textContent=!d.ejemplares?'No hay ejemplares físicos registrados. Crear una ficha no crea sus unidades: agregalas en Herramientas → Ejemplares / QR.':`No hay ejemplares disponibles: ${d.pendientes} pendientes de revisión, ${d.prestados} prestados, ${d.en_reparacion} en reparación y ${d.baja} de baja.`;
   }else ayuda.textContent=`${datos.unidades.length} ejemplar(es) disponible(s). Elegí el solicitante y escaneá cada QR. También podés seleccionar las unidades de la lista con Ctrl o Cmd. La cantidad se calcula según la selección.`;
   if(datos.revision.length)acciones.append(action('Revisar ejemplares pendientes',revisarEjemplar,'btn-secondary'));
   if(puede('objetos.ver')&&!datos.unidades.length)acciones.append(action('Abrir Herramientas',()=>location.assign('herramientas.html'),'btn-secondary'));
  }catch(e){opciones=null;solicitante.replaceChildren(new Option('No se pudieron cargar los solicitantes',''));ayuda.textContent='No se pudieron consultar las opciones del préstamo.';informar(e.message,'error');throw e;}
  finally{cargando=false;solicitante.disabled=!opciones?.solicitantes.length;item.disabled=!opciones?.unidades.length;actualizarBoton();}
 }
 async function revisarEjemplar(){
  const pendientes=opciones?.revision??[];if(!pendientes.length)return;
  modal('Revisar un ejemplar antes de prestarlo',`${select('unidad','Ejemplar pendiente',pendientes.map(u=>[u.id,u.nombre+' · '+u.id+' · '+u.ubicacion]))}<p>Marcá disponible únicamente el ejemplar que hayas revisado y esté apto para usar. No se habilitan automáticamente todas las herramientas.</p><label><input type="checkbox" name="verificado" required> Verifiqué este ejemplar y está apto para préstamo.</label>`,async d=>{
   if(!d.verificado)throw new Error('Confirmá la revisión del ejemplar.');
   const unidad=pendientes.find(u=>u.id===d.unidad);if(!unidad)throw new Error('Seleccioná un ejemplar válido.');
   await api('detalle_objeto',{metodo:'PUT',datos:{id:unidad.id,estado:'disponible',ubicacion:unidad.ubicacion,qr:unidad.qr??'',numero_serie:unidad.numero_serie??'',observaciones:unidad.observaciones??''}});
   await cargarOpciones(unidad.id);informar('Ejemplar disponible y seleccionado. Completá el solicitante y la fecha para registrar el préstamo.');
  });
 }
 function renderizarPrestamos(){
  const q=$('#buscar-prestamo').value.trim().toLocaleLowerCase();historial.replaceChildren();
  const visibles=prestamos.filter(p=>[p.solicitante,p.item,p.detalle_objeto_id].some(v=>String(v??'').toLocaleLowerCase().includes(q)));
  visibles.forEach(p=>{
   const tr=document.createElement('tr');
   [p.solicitante,p.item+' · '+p.detalle_objeto_id,'1 u.',p.observaciones||'Sin comentarios',p.estado].forEach((value,i)=>{const td=document.createElement('td');if(i===4){const badge=document.createElement('span');badge.className='badge';badge.textContent=value;td.append(badge);}else td.textContent=value;tr.append(td);});
   const td=document.createElement('td');
   if(p.estado==='devuelto')td.textContent='Devuelto';else if(puede('prestamos.devolver')){
    const btn=action('Devolver',async()=>{
     btn.disabled=true;
     try{await devolverUnidad(p.detalle_id);td.textContent='Devuelto';await refrescarDespues('Devolución registrada.');}
     catch(e){informar(e.message,'error');throw e;}
     finally{btn.disabled=false;}
    },'btn-sm');btn.dataset.detalleId=p.detalle_id;td.append(btn);
   }
   tr.append(td);historial.append(tr);
  });
  if(!visibles.length){const td=historial.insertRow().insertCell();td.colSpan=6;td.textContent='Sin registros';}
 }
 async function cargarPrestamos(){
  try{prestamos=await listarPrestamos();renderizarPrestamos();}
  catch(e){historial.replaceChildren();const td=historial.insertRow().insertCell();td.colSpan=6;td.textContent='No se pudo cargar el historial: '+e.message;throw e;}
 }
 async function refrescarDespues(confirmacion){
  // La escritura ya fue confirmada: un fallo posterior al refrescar no la convierte en fallida.
  const resultados=await Promise.allSettled([cargarPrestamos(),cargarOpciones()]);
  const errores=resultados.filter(r=>r.status==='rejected').map(r=>r.reason.message);
  informar(confirmacion+(errores.length?' No se pudo actualizar parte de la pantalla: '+errores.join('; ')+'. Usá Actualizar.':''));
  status(confirmacion,'success');
 }
 recargarModulo=async()=>{await Promise.all([cargarPrestamos(),cargarOpciones()]);};
 $('#buscar-prestamo').addEventListener('input',renderizarPrestamos);
 const actualizar=action('Actualizar',()=>run(recargarModulo),'btn-secondary');$('#buscar-prestamo').closest('label').after(actualizar);
 form.addEventListener('invalid',e=>{informar('Completá los campos obligatorios: solicitante, ejemplares y fecha prevista de devolución.','error');},true);
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(guardando||escaneando)return;
  const unidades=seleccionadas();
  if(!solicitante.value||!unidades.length||!fecha.value){informar('Seleccioná un solicitante, al menos un ejemplar y la fecha prevista.','error');return;}
  if(unidades.length>100){informar('Se pueden prestar hasta 100 ejemplares por entrega.','error');return;}
  guardando=true;actualizarBoton();informar('Registrando préstamo…');
  try{
   await escaner.detener();
   const resultado=await crearPrestamo({solicitante_id:solicitante.value,fecha_prevista:fecha.value,unidades,observaciones:$('#observaciones').value});
   form.reset();fecha.min=fecha.value=hoy();cantidad.value=0;
   await refrescarDespues('Préstamo '+resultado.id+' registrado correctamente.');
  }catch(err){informar(err.message,'error');status(err.message,'error');}
  finally{guardando=false;actualizarBoton();}
 });
 // Un fallo de selectores no oculta un historial que sí pudo consultarse, y viceversa.
 const inicial=await Promise.allSettled([cargarPrestamos(),cargarOpciones()]);
 inicial.filter(r=>r.status==='rejected').forEach(r=>status(r.reason.message,'error'));
}));

function instalarEscanerPrestamo({form,item,solicitante,informar,agregar}){
 const grupo=document.createElement('div');grupo.className='form-group';
 grupo.innerHTML='<label for="prestamo-codigo">QR de la unidad:</label><input id="prestamo-codigo" class="input" autocomplete="off" placeholder="Escaneá o escribí el código de la unidad"><div id="prestamo-qr-acciones"></div><label>Leer una foto del QR<input id="prestamo-qr-imagen" type="file" accept="image/*"></label><div id="prestamo-qr-lector"></div>';
 item.closest('.form-group').before(grupo);
 const campo=grupo.querySelector('#prestamo-codigo'),imagen=grupo.querySelector('#prestamo-qr-imagen');
 let lector=null,activo=false,iniciando=false,leyendo=false,ultimo='',instante=0;
 function verificar(){if(!solicitante.value)throw new Error('Primero seleccioná el usuario que recibe el préstamo.');}
 async function leer(codigo){
  verificar();if(leyendo)return;codigo=String(codigo??'').trim();
  if(!codigo)throw new Error('Escaneá o ingresá el código de una unidad.');
  leyendo=true;
  try{await agregar(codigo);campo.value='';}catch(e){informar(e.message,'error');throw e;}finally{leyendo=false;}
 }
 async function detener(){if(activo&&lector){await lector.stop();activo=false;} }
 function crearLector(){if(typeof Html5Qrcode==='undefined')throw new Error('No se pudo cargar el lector QR. Usá el código escrito o el lector USB.');if(!lector)lector=new Html5Qrcode('prestamo-qr-lector');return lector;}
 const agregarBoton=action('Agregar QR',()=>leer(campo.value),'secondary');
 const camara=action('Usar cámara',async()=>{
  verificar();if(activo||iniciando)return;
  if(!window.isSecureContext)throw new Error('La cámara necesita HTTPS o localhost. Podés cargar una foto del QR o usar un lector USB.');
  iniciando=true;camara.disabled=true;
  try{await crearLector().start({facingMode:'environment'},{fps:10,qrbox:{width:220,height:220}},codigo=>{
   if(leyendo||(codigo===ultimo&&Date.now()-instante<2000))return;
   ultimo=codigo;instante=Date.now();run(()=>leer(codigo));
  },()=>{});activo=true;informar('Cámara activa. Escaneá los QR de las unidades que vas a prestar.');}
  catch(e){informar('No se pudo iniciar la cámara. Revisá el permiso del navegador o usá una foto/lector USB.','error');throw e;}
  finally{iniciando=false;camara.disabled=false;}
 },'secondary');
 grupo.querySelector('#prestamo-qr-acciones').append(agregarBoton,camara,action('Detener cámara',detener,'secondary'));
 campo.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();run(()=>leer(campo.value));}});
 imagen.addEventListener('change',()=>run(async()=>{try{verificar();const archivo=imagen.files[0];if(!archivo)return;await detener();const codigo=await crearLector().scanFile(archivo,true);await leer(codigo);}catch(e){informar(e.message,'error');throw e;}finally{imagen.value='';}}));
 window.addEventListener('pagehide',()=>{detener().catch(()=>{});});
 return {detener};
}

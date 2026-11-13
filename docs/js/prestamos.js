// Conserva el formulario y la tabla de E4. Todas las operaciones persisten en MariaDB.
document.addEventListener('DOMContentLoaded',()=>run(async()=>{
 $('#historial').replaceChildren();$('#item').replaceChildren();
 if(!await prepararModulo('prestamos.ver'))return;
 const form=$('#formulario'),historial=$('#historial'),registrar=$('#btn-registrar');
 const puedeCrear=puede('prestamos.crear');
 let prestamos=[],opciones=null,cargando=false,guardando=false;
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
 function actualizarBoton(){registrar.disabled=!puedeCrear||cargando||guardando||!opciones?.unidades.length||!opciones?.solicitantes.length;}
 const seleccionadas=()=>[...item.selectedOptions].map(o=>o.value).filter(Boolean);
 item.addEventListener('change',()=>{cantidad.value=seleccionadas().length;});
 form.closest('section').hidden=!puedeCrear;
 registrar.disabled=true;
 async function cargarOpciones(preferida=null){
  if(!puedeCrear)return;
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
   datos.unidades.forEach(u=>{const opt=new Option(u.nombre+' · '+u.id+(u.ubicacion?' · '+u.ubicacion:''),u.id);opt.selected=u.id===preferida;item.add(opt);});
   cantidad.value=seleccionadas().length;
   const d=datos.diagnostico;
   if(!datos.solicitantes.length)ayuda.textContent='No hay solicitantes activos. Un administrador debe registrar al menos uno.';
   else if(!datos.unidades.length){
    ayuda.textContent=!d.ejemplares?'No hay ejemplares físicos registrados. Crear una ficha no crea sus unidades: agregalas en Herramientas → Ejemplares / QR.':`No hay ejemplares disponibles: ${d.pendientes} pendientes de revisión, ${d.prestados} prestados, ${d.en_reparacion} en reparación y ${d.baja} de baja.`;
   }else ayuda.textContent=`${datos.unidades.length} ejemplar(es) disponible(s). Seleccioná las unidades a prestar; para elegir varias, usá Ctrl o Cmd. La cantidad se calcula según la selección.`;
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
  e.preventDefault();if(guardando)return;
  const unidades=seleccionadas();
  if(!solicitante.value||!unidades.length||!fecha.value){informar('Seleccioná un solicitante, al menos un ejemplar y la fecha prevista.','error');return;}
  if(unidades.length>100){informar('Se pueden prestar hasta 100 ejemplares por entrega.','error');return;}
  guardando=true;actualizarBoton();informar('Registrando préstamo…');
  try{
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

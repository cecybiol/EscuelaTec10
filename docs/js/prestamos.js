// Conserva el formulario y la tabla creados por E4; conecta sus eventos con MariaDB.
document.addEventListener('DOMContentLoaded',()=>run(async()=>{
 $('#historial').replaceChildren();$('#item').replaceChildren();
 if(!await prepararModulo('prestamos.ver'))return;
 const form=$('#formulario'),historial=$('#historial');let prestamos=[];
 const anterior=$('#solicitante');const solicitante=document.createElement('select');solicitante.id=anterior.id;solicitante.className=anterior.className;solicitante.required=true;anterior.replaceWith(solicitante);
 const item=$('#item');item.multiple=true;item.size=4;
 const cantidad=$('#cantidad');cantidad.readOnly=true;cantidad.value=0;cantidad.min=0;
 const grupo=document.createElement('div');grupo.className='form-group';grupo.innerHTML='<label for="fecha-prevista">Fecha prevista de devolución:</label><input id="fecha-prevista" type="date" class="input" required>';
 cantidad.closest('.form-group').after(grupo);
 item.addEventListener('change',()=>cantidad.value=item.selectedOptions.length);
 form.closest('section').hidden=!puede('prestamos.crear');
 async function cargarOpciones(){
  if(!puede('prestamos.crear'))return;
  const [personas,unidades]=await Promise.all([api('usuarios'),api('detalle_objeto')]);
  solicitante.replaceChildren(new Option('Seleccionar solicitante…',''));personas.filter(u=>u.activo).forEach(u=>solicitante.add(new Option(u.alias+' · '+u.id,u.id)));
  item.replaceChildren();unidades.forEach(u=>item.add(new Option(u.nombre+' · '+u.id,u.id)));cantidad.value=0;
 }
 function renderizarPrestamos(){
  const q=$('#buscar-prestamo').value.trim().toLocaleLowerCase();
  historial.replaceChildren();
  const visibles=prestamos.filter(p=>[p.solicitante,p.item,p.detalle_objeto_id].some(v=>String(v??'').toLocaleLowerCase().includes(q)));
  visibles.forEach(p=>{
   const tr=document.createElement('tr');
   [p.solicitante,p.item+' · '+p.detalle_objeto_id,'1 u.',p.observaciones||'Sin comentarios',p.estado].forEach((value,i)=>{const td=document.createElement('td');if(i===4){const badge=document.createElement('span');badge.className='badge';badge.textContent=value;td.append(badge);}else td.textContent=value;tr.append(td);});
   const td=document.createElement('td');
   if(p.estado==='devuelto')td.textContent='Devuelto';else if(puede('prestamos.devolver')){const btn=action('Devolver',async()=>{btn.disabled=true;try{await devolverUnidad(p.detalle_id);await cargarPrestamos();await cargarOpciones();}finally{btn.disabled=false;}},'btn-sm');btn.dataset.detalleId=p.detalle_id;td.append(btn);}
   tr.append(td);historial.append(tr);
  });
  if(!visibles.length){const td=historial.insertRow().insertCell();td.colSpan=6;td.textContent='Sin registros';}
 }
 async function cargarPrestamos(){prestamos=await listarPrestamos();renderizarPrestamos();}
 recargarModulo=async()=>{await cargarPrestamos();await cargarOpciones();};
 $('#buscar-prestamo').addEventListener('input',renderizarPrestamos);
 form.addEventListener('submit',async e=>{e.preventDefault();const btn=e.submitter;btn.disabled=true;try{await crearPrestamo({solicitante_id:solicitante.value,fecha_prevista:$('#fecha-prevista').value,unidades:[...item.selectedOptions].map(o=>o.value),observaciones:$('#observaciones').value});form.reset();await recargarModulo();status('Préstamo registrado.','success');}catch(err){status(err.message,'error');}finally{btn.disabled=false;}});
 await recargarModulo();
}));

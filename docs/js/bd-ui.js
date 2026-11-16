'use strict';
// Adaptadores de funcionalidad: reutilizan los componentes y clases de los alumnos.
const $=s=>document.querySelector(s);
let recargarModulo=async()=>{};
function status(text='',type='info'){if(text)showAlert(text,type==='error'?'error':type);}
async function run(fn){try{await fn();}catch(e){status(e.message,'error');}}
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function action(label,fn,kind=''){const b=document.createElement('button');b.type='button';b.textContent=label;b.className=kind==='danger'?'btn-action btn-delete':kind==='secondary'?'btn-secondary':kind||'btn-primary';b.addEventListener('click',()=>run(fn));return b;}
function field(name,label,value='',type='text',extra=''){return `<label>${label}<input name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`;}
function select(name,label,values,value=''){return `<label>${label}<select name="${name}">${values.map(([v,l])=>`<option value="${esc(v)}" ${String(v)===String(value)?'selected':''}>${esc(l)}</option>`).join('')}</select></label>`;}
function formData(form){return Object.fromEntries(new FormData(form));}
function table(headers,rows,render){const wrap=document.createElement('div');wrap.className='scroll';const t=document.createElement('table');t.innerHTML=`<thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead>`;const body=document.createElement('tbody');for(const r of rows){const tr=document.createElement('tr');for(const cell of render(r)){const td=document.createElement('td');if(cell instanceof Node)td.append(cell);else td.textContent=cell??'—';tr.append(td);}body.append(tr);}if(!rows.length){const tr=body.insertRow();const td=tr.insertCell();td.colSpan=headers.length;td.textContent='Sin registros';}t.append(body);wrap.append(t);return wrap;}
function buttons(...b){const d=document.createElement('div');d.className='no-print';b.filter(Boolean).forEach(x=>d.append(x));return d;}
function downloadCSV(name,rows){const csv='\ufeff'+rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""').replace(/^[=+@-]/,v=>"'"+v)+'"').join(';')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
function qrUrl(id){const u=new URL('qr.html',location.href);u.searchParams.set('id',id);return u.href;}
function qrHtml(id){return `<div id="qr-code"></div><p><code>${esc(id)}</code></p><p><a href="${esc(qrUrl(id))}">Abrir ficha</a></p><button type="button" id="print-qr" class="no-print">Imprimir etiqueta</button>`;}
function paintQR(id){const q=qrcode(0,'M');q.addData(qrUrl(id));q.make();$('#qr-code').innerHTML=q.createSvgTag({cellSize:5,margin:4,scalable:true});$('#qr-code svg').setAttribute('aria-label','Código QR de '+id);$('#print-qr').onclick=()=>{const w=window.open('','_blank');if(!w){status('Permití ventanas emergentes para imprimir la etiqueta.','error');return;}w.document.write(`<!doctype html><html lang="es"><title>ET10 · ${esc(id)}</title><body style="font:16px system-ui;text-align:center"><h2>ET10 · Taller de Informática</h2><div style="width:240px;margin:auto">${$('#qr-code').innerHTML}</div><p>${esc(id)}</p><p style="font-size:11px;overflow-wrap:anywhere">${esc(qrUrl(id))}</p></body></html>`);w.document.close();w.print();};}

function modal(title,html,onSave){
 let d=$('#editor');if(!d){d=document.createElement('dialog');d.id='editor';d.className='bd-dialog';d.setAttribute('aria-labelledby','bd-modal-title');document.body.append(d);}
 d.innerHTML=`<h2 id="bd-modal-title">${esc(title)}</h2><form id="edit-form">${html}<p id="form-error" class="estado-datos__msg estado-datos__msg--error" role="alert" hidden></p><div class="modal-footer"><button type="button" id="cancel" class="btn-secondary">Cerrar</button>${onSave?'<button type="submit" class="btn-primary">Guardar</button>':''}</div></form>`;
 $('#cancel').onclick=()=>d.close();if(onSave)$('#edit-form').onsubmit=async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;try{await onSave(formData(e.target));d.close();status('Cambios guardados en la base de datos.','success');}catch(err){$('#form-error').hidden=false;$('#form-error').textContent=err.message;}finally{b.disabled=false;}};
 d.showModal();
}
async function prepararModulo(permiso){
 const s=await comprobarSesion();if(!s)return false;
 const permisosMenu={'dashboard.html':'dashboard.ver','herramientas.html':'objetos.ver','insumos.html':'objetos.ver','prestamos.html':'prestamos.ver','admin.html':'usuarios.gestionar'};
 document.querySelectorAll('body > header .navbar-menu a').forEach(a=>{const file=new URL(a.href).pathname.split('/').pop();if(permisosMenu[file])a.hidden=!puede(permisosMenu[file]);});
 const abrirSesion=()=>{
  modal(s.usuario.alias,`<p>Rol: ${esc(s.usuario.rol)}</p><div id="bd-session-actions"></div>`,null);
  if(puede('objetos.ver'))$('#bd-session-actions').append(action('Consultar QR',()=>location.assign('qr.html')));
  $('#bd-session-actions').append(action('Salir',cerrarSesion,'secondary'));
 };
 const perfil=document.querySelector('body > header .perfil');
 if(perfil){perfil.title=s.usuario.alias+' · '+s.usuario.rol;perfil.setAttribute('aria-label','Sesión de '+s.usuario.alias);perfil.setAttribute('role','button');perfil.tabIndex=0;perfil.onclick=abrirSesion;perfil.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();abrirSesion();}};}
 else{const acciones=$('.herramientas-acciones');if(acciones&&!$('#bd-sesion')){const b=action('Sesión / consultar QR',abrirSesion,'secondary');b.id='bd-sesion';acciones.append(b);}}
 if(!puede(permiso))throw new Error('Acceso no permitido para tu rol. Elegí otro módulo del menú.');
 return s;
}
function stock(o,tipo='ingreso'){
 modal('Movimiento: '+o.nombre,`${select('tipo','Operación',[['ingreso','Ingreso'],['egreso','Egreso']],tipo)}${field('cantidad','Cantidad ('+(o.unidad??'sin unidad')+')','','number','required min="0.001" step="0.001"')}${field('motivo','Motivo','','text','required maxlength="180"')}<p>Saldo actual: ${esc(o.stock)} ${esc(o.unidad)}.</p>`,async d=>{await api('stock',{metodo:'POST',datos:{...d,id:o.id}});await recargarModulo();});
}
function editarFichaCantidad(o){
 modal(o?'Editar insumo':'Nuevo insumo',`${field('nombre','Nombre',o?.nombre??'','text','required maxlength="160"')}${select('tipo','Tipo',[['insumo','Insumo'],['repuesto','Repuesto']],o?.tipo??'insumo')}${field('categoria','Categoría',o?.categoria??'General','text','maxlength="80"')}${field('ubicacion','Lugar donde se guarda',o?.ubicacion??'','text','maxlength="180"')}${field('unidad','Unidad de medida',o?.unidad??'','text','required maxlength="40"')}${field('stockMinimo','Stock mínimo',o?.stockMinimo??'','number','min="0" step="0.001"')}<label>Notas<textarea name="notas" maxlength="5000">${esc(o?.notas??'')}</textarea></label><p>Los saldos cambian mediante movimientos de ingreso o egreso.</p>`,async d=>{if(d.stockMinimo==='')delete d.stockMinimo;await guardarObjeto({...d,modo_control:o?.modo_control??'cantidad',...(o?{id:o.id}:{})});await recargarModulo();});
}
function tablaEjemplares(o){return table(['Ejemplar','Estado / ubicación','Serie','Acciones'],o.unidades,u=>[u.id,(Number(u.prestado)?'prestado':u.estado)+' · '+u.ubicacion,u.numero_serie,buttons(action('QR',()=>etiquetaQR(u.id)),puede('objetos.editar')&&action('Editar',()=>editarEjemplar(o,u)))]);}
function etiquetaQR(id){modal('Etiqueta QR',qrHtml(id),null);paintQR(id);}
async function verFichaQR(id){
 const {objeto:o}=await api('qr',{params:{id}});
 modal(o.nombre,`<p>${esc(o.id)} · ${esc(o.categoria)} · ${esc(o.ubicacion)}</p><p>${esc(o.notas)}</p>${o.modo_control==='cantidad'?`<p>Saldo: ${esc(o.stock)} ${esc(o.unidad??'(sin unidad)')} · Mínimo: ${esc(o.stockMinimo??'sin definir')}</p>`:''}<div id="bd-ejemplares"></div><div id="bd-ejemplar-nuevo"></div><h3>Etiqueta del catálogo</h3>${qrHtml(o.id)}`,null);
 paintQR(o.id);if(o.modo_control==='individual'){$('#bd-ejemplares').append(tablaEjemplares(o));if(puede('objetos.crear'))$('#bd-ejemplar-nuevo').append(action('Agregar ejemplar',()=>editarEjemplar(o)));}
}
function editarEjemplar(o,u){
 const codigo=['SI','SÍ','NO','FALTO','FALTÓ'].includes(String(u?.qr??'').toUpperCase())?'':u?.qr??'';
 modal(u?'Editar ejemplar':'Agregar ejemplar',`${field('ubicacion','Lugar donde se guarda',u?.ubicacion??o.ubicacion,'text','required maxlength="180"')}${select('estado','Estado',[['pendiente','Pendiente de revisión'],['disponible','Disponible'],['en_reparacion','En reparación'],['baja','Baja']],u?.estado??'pendiente')}${field('qr','Código de la etiqueta QR existente (opcional)',codigo,'text','maxlength="20"')}<p>El ID ${esc(u?.id??'generado al guardar')} también identifica esta unidad. Vinculá aquí el código si la etiqueta física usa otro valor.</p>${field('numero_serie','Número de serie',u?.numero_serie??'','text','maxlength="100"')}<label>Observaciones<textarea name="observaciones" maxlength="5000">${esc(u?.observaciones??'')}</textarea></label>`,async d=>{await api('detalle_objeto',{metodo:u?'PUT':'POST',datos:{...d,...(u?{id:u.id}:{objeto_id:o.id})}});await recargarModulo();});
}
async function establecerStockInicial(ficha){
 const {objeto:o}=await api('qr',{params:{id:ficha.id}}),individual=o.modo_control==='individual';
 const activas=(o.unidades??[]).filter(u=>u.estado!=='baja');
 const html=field('cantidad',individual?'Cantidad total de ejemplares físicos':'Saldo inicial contado',individual?activas.length:o.stock,'number',`required min="0" step="${individual?'1':'0.001'}" ${individual?'max="500"':''}`)+
  (individual?`${field('ubicacion','Ubicación de los nuevos ejemplares',o.ubicacion,'text','required maxlength="180"')}${select('estado_nuevos','Estado de los nuevos ejemplares',[['pendiente','Pendiente de revisión'],['disponible','Disponible: revisados y aptos']])}<label><input type="checkbox" name="habilitar_pendientes"> Revisé los ejemplares pendientes existentes y están aptos para préstamo.</label><label>Si reducís el total, seleccioná exactamente las unidades que se retiran:<select name="retirar" multiple size="5">${activas.map(u=>`<option value="${esc(u.id)}">${esc(u.id+' · '+u.estado+' · '+(u.numero_serie??''))}</option>`).join('')}</select></label><p>Las unidades retiradas quedan de baja. Sus códigos QR se conservan. Las nuevas reciben un ID y su propia etiqueta.</p>`:field('unidad','Unidad de medida',o.unidad??'','text','required maxlength="40"'))+
  '<p>Esta operación establece el total contado; repetir el mismo total no suma stock. Solo se permite antes de registrar préstamos o movimientos de uso de este artículo.</p><label><input type="checkbox" name="confirmado" required> Confirmo que realicé el recuento físico.</label>';
 modal('Stock inicial: '+o.nombre,html,async d=>{
  const retirar=individual?[...$('#edit-form select[name="retirar"]').selectedOptions].map(x=>x.value):[];
  const resultado=await api('stock_inicial',{metodo:'POST',datos:{...d,id:o.id,cantidad:Number(d.cantidad),confirmado:d.confirmado==='on',habilitar_pendientes:d.habilitar_pendientes==='on',retirar}});
  await recargarModulo();
  if(resultado.creadas?.length)status(`${resultado.creadas.length} ejemplares creados. Sus etiquetas están en Ejemplares / QR.`,'success');
 });
}

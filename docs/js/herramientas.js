// =================================================================
// VERIFICACIÓN DE SEGURIDAD (Clase Base ItemInventario)
// =================================================================
if (typeof ItemInventario === 'undefined') {
  window.ItemInventario = class ItemInventario {
    constructor({ id = null, nombre, categoria = 'General' }) {
      if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
        throw new Error('El nombre del ítem es obligatorio.');
      }
      this.id = id || Date.now().toString();
      this.nombre = nombre.trim();
      this.categoria = categoria ? categoria.trim() : 'General';
    }
  };
}

// =================================================================
// MODELO: Clase Herramienta (Hereda de ItemInventario)
// =================================================================
class Herramienta extends ItemInventario {
  #estado;

  static ESTADOS_PERMITIDOS = ['nueva', 'usada', 'rota', 'disponible', 'sin_disponibilidad', 'pendiente', 'en_uso', 'en_reparacion', 'baja'];

  constructor({ id = null, codigo = null, nombre, categoria = 'Herramientas', estado = null, ubicacion = '', notas = '', fechaCreacion = null, unidades = [] }) {
    super({ id: id || codigo, nombre, categoria });

    this.codigo = codigo || this.id;
    this.ubicacion = ubicacion ? ubicacion.trim() : 'Sin ubicación';
    this.notas = notas ? notas.trim() : '';
    this.unidades = Array.isArray(unidades) ? unidades : [];
    this.fechaCreacion = fechaCreacion || new Date().toISOString();

    this.cambiarEstado(estado || 'disponible');
  }

  get estado() {
    return this.#estado;
  }

  set estado(nuevoEstado) {
    this.cambiarEstado(nuevoEstado);
  }

  validarEstado(nuevoEstado) {
    if (!nuevoEstado) return 'disponible';
    const estadoLimpio = String(nuevoEstado).toLowerCase().trim();
    return Herramienta.ESTADOS_PERMITIDOS.includes(estadoLimpio) ? estadoLimpio : 'disponible';
  }

  cambiarEstado(nuevoEstado) {
    const estadoValidado = this.validarEstado(nuevoEstado);
    if (this.#estado === 'baja' && estadoValidado !== 'baja') {
      throw new Error('Una herramienta en estado "baja" no puede cambiar de estado.');
    }
    this.#estado = estadoValidado;
  }

  obtenerEstadoClase() {
    return this.#estado;
  }

  obtenerEstadoFormateado() {
    return this.#estado.charAt(0).toUpperCase() + this.#estado.slice(1).replace('_', ' ');
  }
}

// =================================================================
// CONTROLADOR Y VISTAS (DOM & REPOSITORIO)
// =================================================================
document.addEventListener('DOMContentLoaded',()=>run(async()=>{
 if(!await prepararModulo('objetos.ver'))return;
 let herramientas=[],seleccionada=null,estados=[];
 const listado=$('#vista-lista'),detalle=$('#vista-detalle'),lista=$('#lista-herramientas');
 const ventana=document.getElementById('-nueva-herramienta');ventana.classList.add('modal');ventana.style.display='none';
 const input=$('#input-buscar');
 const estadoTexto=h=>h.estado==='disponible'?'Disponible':'Sin disponibles';
 function configurarEstado(selector,valor){selector.replaceChildren(new Option(valor,valor));selector.disabled=true;selector.required=false;selector.title='El estado físico se gestiona en cada ejemplar';}
 function mostrarLista(){seleccionada=null;detalle.style.display='none';listado.style.display='block';}
 async function cargar(){
  const actual=seleccionada?.id;
  try{herramientas=(await listarHerramientas()).map(o=>Object.assign(new Herramienta(o),{modo_control:o.modo_control,unidad:o.unidad,stockMinimo:o.stockMinimo}));renderizar();if(actual){const o=herramientas.find(h=>h.id===actual);if(o)await mostrarDetalle(o);else mostrarLista();}}
  catch(e){lista.replaceChildren();const li=document.createElement('li');li.className='estado-error';li.textContent=e.message;lista.append(li);throw e;}
 }
 function renderizar(){
  const q=input.value.trim().toLocaleLowerCase();lista.replaceChildren();
  const visibles=herramientas.filter(h=>[h.id,h.nombre,h.ubicacion,estadoTexto(h)].some(v=>String(v).toLocaleLowerCase().includes(q))).filter(h=>!estados.length||estados.some(e=>e==='en_reparacion'?h.unidades.some(u=>u.estado===e):h.estado===e));
  visibles.forEach(h=>{
   const li=document.createElement('li');li.className='fila-herramienta';li.dataset.id=h.id;li.tabIndex=0;li.setAttribute('role','button');li.setAttribute('aria-label','Ver '+h.nombre);
   li.innerHTML=`<span class="herramienta-nombre">${esc(h.nombre)}</span><span class="badge badge--${esc(h.estado)}">${esc(estadoTexto(h))}</span><span class="herramienta-ubicacion">${esc(h.ubicacion)}</span><span class="herramienta-qr" role="button" tabindex="0" aria-label="QR de ${esc(h.nombre)}"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg></span>`;
   li.addEventListener('click',()=>run(()=>mostrarDetalle(h)));li.addEventListener('keydown',e=>{if(e.target===li&&['Enter',' '].includes(e.key)){e.preventDefault();run(()=>mostrarDetalle(h));}});
   const qr=li.querySelector('.herramienta-qr');qr.addEventListener('click',e=>{e.stopPropagation();run(()=>verFichaQR(h.id));});qr.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();e.stopPropagation();run(()=>verFichaQR(h.id));}});lista.append(li);
  });
  if(!visibles.length){const li=document.createElement('li');li.className='sin-herramientas';li.textContent=q?'No se encontraron herramientas.':'No hay herramientas registradas.';lista.append(li);}
 }
 function activarTab(historial){$('#panel-info').hidden=historial;$('#panel-historial').hidden=!historial;$('#tab-info').classList.toggle('tab-btn--activo',!historial);$('#tab-historial').classList.toggle('tab-btn--activo',historial);$('#tab-info').setAttribute('aria-selected',!historial);$('#tab-historial').setAttribute('aria-selected',historial);}
 async function mostrarHistorial(h){
  const cont=$('#panel-historial .historial-lista');cont.replaceChildren();
  const eventos=[{fecha:h.fechaCreacion,texto:'Registrada en el sistema'}];
  if(puede('prestamos.ver')){const prestamos=await listarPrestamos();prestamos.filter(p=>p.herramientaId===h.id).forEach(p=>{eventos.push({fecha:p.fechaPrestamo,texto:'Prestada a '+p.solicitante+' · '+p.detalle_objeto_id});if(p.fechaDevolucion)eventos.push({fecha:p.fechaDevolucion,texto:'Devuelta · '+p.detalle_objeto_id});});}
  eventos.sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha))).forEach(ev=>{const li=document.createElement('li');li.className='historial-item';const f=document.createElement('span');f.className='historial-fecha';f.textContent=ev.fecha?formatDate(ev.fecha):'Sin fecha';const texto=document.createElement('span');texto.className='historial-evento';texto.textContent=ev.texto;li.append(f,texto);cont.append(li);});
 }
 async function mostrarDetalle(h){
  seleccionada=h;$('#detalle-titulo').textContent=h.nombre;$('#campo-nombre').value=h.nombre;$('#campo-ubicacion').value=h.ubicacion;$('#campo-notas').value=h.notas;configurarEstado($('#campo-estado'),estadoTexto(h));
  for(const el of [$('#campo-nombre'),$('#campo-ubicacion'),$('#campo-notas')])el.readOnly=!puede('objetos.editar');$('#btn-guardar-cambios').hidden=!puede('objetos.editar');
  let acciones=$('#bd-herramienta-acciones');if(!acciones){acciones=document.createElement('div');acciones.id='bd-herramienta-acciones';acciones.className='detalle-footer';$('#panel-info').append(acciones);}acciones.replaceChildren(action('Ejemplares / QR',()=>verFichaQR(h.id)));
  if(puede('objetos.baja'))acciones.append(action('Dar de baja',async()=>{if(confirm('¿Dar de baja '+h.nombre+'? Se conserva su historial.')){await eliminarObjeto(h.id);mostrarLista();await cargar();}},'danger'));
  activarTab(false);listado.style.display='none';detalle.style.display='block';await mostrarHistorial(h);
 }
 $('#btn-nueva-herramienta').hidden=!puede('objetos.crear');
 $('#btn-nueva-herramienta').addEventListener('click',()=>{$('#form-nueva-herramienta').reset();configurarEstado($('#nueva-estado'),'Sin ejemplares: agregar después de guardar');ventana.style.display='flex';$('#nueva-nombre').focus();});
 const cerrar=()=>{ventana.style.display='none';$('#btn-nueva-herramienta').focus();};
 for(const id of ['btn-cerrar-modal-nueva','btn-cancelar-nueva','modal-nueva-overlay'])$('#'+id).addEventListener('click',cerrar);
 ventana.addEventListener('keydown',e=>{if(e.key==='Escape')cerrar();if(e.key==='Tab'){const focusables=[...ventana.querySelectorAll('button,input,textarea,select')].filter(el=>!el.disabled);const first=focusables[0],last=focusables.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
 $('#form-nueva-herramienta').addEventListener('submit',async e=>{e.preventDefault();const btn=e.submitter;btn.disabled=true;try{const result=await guardarHerramienta({nombre:$('#nueva-nombre').value.trim(),ubicacion:$('#nueva-ubicacion').value.trim(),notas:$('#nueva-notas').value.trim(),categoria:'Herramientas'});cerrar();await cargar();await mostrarDetalle(herramientas.find(h=>h.id===result.id));status('Ficha creada. Desde Ejemplares / QR podés agregar sus unidades.','success');}catch(err){status(err.message,'error');}finally{btn.disabled=false;}});
 $('#form-editar-herramienta').addEventListener('submit',async e=>{e.preventDefault();if(!seleccionada)return;const btn=e.submitter;btn.disabled=true;try{await guardarHerramienta({id:seleccionada.id,nombre:$('#campo-nombre').value.trim(),ubicacion:$('#campo-ubicacion').value.trim(),notas:$('#campo-notas').value.trim(),categoria:seleccionada.categoria,unidad:seleccionada.unidad??'',stockMinimo:seleccionada.stockMinimo});await cargar();status('Cambios guardados.','success');}catch(err){status(err.message,'error');}finally{btn.disabled=false;}});
 $('#btn-volver').addEventListener('click',mostrarLista);$('#btn-cancelar-edicion').addEventListener('click',mostrarLista);input.addEventListener('input',renderizar);$('#btn-buscar').addEventListener('click',renderizar);
 $('#tab-info').addEventListener('click',()=>activarTab(false));$('#tab-historial').addEventListener('click',()=>run(async()=>{activarTab(true);if(seleccionada)await mostrarHistorial(seleccionada);}));
 const filtro=$('#panel-filtros');filtro.hidden=true;$('#btn-filtros').onclick=()=>{filtro.hidden=!filtro.hidden;filtro.classList.toggle('activo',!filtro.hidden);$('#btn-filtros').setAttribute('aria-expanded',!filtro.hidden);};
 const estadosBD=[['disponible','Disponible'],['sin_disponibilidad','Sin disponibles'],['en_reparacion','En reparación']];
 filtro.querySelectorAll('input[name=estado]').forEach((el,i)=>{el.value=estadosBD[i][0];el.parentElement.lastChild.textContent=' '+estadosBD[i][1];});
 $('#btn-aplicar-filtros').onclick=()=>{estados=[...filtro.querySelectorAll('input:checked')].map(x=>x.value);renderizar();filtro.hidden=true;filtro.classList.remove('activo');$('#btn-filtros').setAttribute('aria-expanded','false');};
 $('#btn-limpiar-filtros').onclick=()=>{filtro.querySelectorAll('input').forEach(el=>el.checked=false);estados=[];renderizar();};
 recargarModulo=cargar;mostrarLista();await cargar();
}));

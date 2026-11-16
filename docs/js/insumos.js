// E3: los contenedores, tarjetas y clases del HTML original se conservan.
let listaInsumos=[];
class Insumo {
 constructor(data){Object.assign(this,data);}
 obtenerEstado(){if(this.stock===null)return 'Sin saldo';if(this.stock===0)return 'Agotado';if(this.stockMinimo===null)return 'Sin mínimo';return this.stock<=this.stockMinimo?'Stock Bajo':'Normal';}
}
document.addEventListener('DOMContentLoaded',()=>run(async()=>{
 $('#tbody-insumos').replaceChildren();$('.products-grid').replaceChildren();$('.alerts-list').replaceChildren();document.querySelectorAll('.metrics-grid h2').forEach(el=>el.textContent='—');
 if(!await prepararModulo('objetos.ver'))return;
 let categoria='';const tbody=$('#tbody-insumos');
 function estadoClase(i){return i.stock===0?'danger':i.stockMinimo!==null&&i.stock<=i.stockMinimo?'warning':'success';}
 function renderizar(){
  const q=$('#search-insumos').value.trim().toLocaleLowerCase();tbody.replaceChildren();
  const visibles=listaInsumos.filter(i=>(!categoria||i.categoria===categoria)&&[i.id,i.nombre,i.categoria,i.ubicacion].some(v=>String(v??'').toLocaleLowerCase().includes(q)));
  visibles.forEach(i=>{
   const tr=document.createElement('tr');tr.innerHTML=`<td><strong>${esc(i.nombre)}</strong><br><small>${esc(i.id)}</small></td><td>${esc(i.categoria)}</td><td>${esc(i.stock??'Sin saldo')} ${esc(i.unidad??'(sin unidad definida)')}</td><td><span class="status-tag tag-${estadoClase(i)}">${esc(i.obtenerEstado())}</span></td><td></td>`;
   const td=tr.lastElementChild;if(puede('objetos.editar'))td.append(action('Editar',()=>editarFichaCantidad(i),'btn-sm'));
   if(puede('stock.mover')&&i.modo_control==='cantidad')td.append(action('Stock inicial',()=>establecerStockInicial(i),'btn-sm'),action('Ingreso / egreso',()=>stock(i),'btn-sm'));
   td.append(action('QR',()=>verFichaQR(i.id),'btn-sm'));
   if(puede('objetos.baja'))td.append(action('Dar de baja',async()=>{if(confirm('¿Dar de baja '+i.nombre+'?')){await eliminarObjeto(i.id);await cargarInsumos();}},'btn-sm'));
   tbody.append(tr);
  });
  if(!visibles.length){const td=tbody.insertRow().insertCell();td.colSpan=5;td.textContent='Sin registros';}
  const bajos=listaInsumos.filter(i=>i.stock>0&&i.stockMinimo!==null&&i.stock<=i.stockMinimo),agotados=listaInsumos.filter(i=>i.stock===0),normales=listaInsumos.filter(i=>i.stock>0&&i.stockMinimo!==null&&i.stock>i.stockMinimo);
  const metricas=[listaInsumos.length,normales.length,bajos.length,agotados.length];document.querySelectorAll('.metrics-grid .card h2').forEach((el,n)=>el.textContent=metricas[n]);
  const pequenos=document.querySelectorAll('.metrics-grid .card small');if(pequenos[0])pequenos[0].textContent='registrados en la base';if(pequenos[2])pequenos[2].textContent='según mínimo definido';
  const productos=$('.products-grid');productos.replaceChildren();const liquidos=listaInsumos.filter(i=>/^(l|ml|litro|litros|mililitros)$/i.test(i.unidad??'')||/alcohol|desinfectante|cloro|jab[oó]n l[ií]quido/i.test(i.nombre));
  const badge=$('.section-container h3 .badge');if(badge)badge.textContent=liquidos.length;
  liquidos.forEach(i=>{const div=document.createElement('div');div.className='card-product border-'+(estadoClase(i)==='danger'?'red':estadoClase(i)==='warning'?'orange':'blue');div.innerHTML=`<h4 class="title">${esc(i.nombre)}</h4><p><strong>${esc(i.stock)} ${esc(i.unidad??'(sin unidad)')}</strong> / ${esc(i.stockMinimo??'sin mínimo definido')}</p>`;if(puede('stock.mover'))div.append(action('Rellenar',()=>stock(i),'btn-action'));productos.append(div);});if(!liquidos.length)productos.textContent='Sin insumos líquidos registrados.';
  const alertas=$('.alerts-list');alertas.replaceChildren();const alertBadge=$('.alerts-container h3 .badge');if(alertBadge)alertBadge.textContent=agotados.length+bajos.length;
  [...agotados,...bajos].forEach(i=>{const div=document.createElement('div');div.className='alert-item '+(i.stock===0?'alert-critical':'alert-warning');div.innerHTML=`<div class="alert-content"><p><strong>${esc(i.nombre)}:</strong> ${esc(i.obtenerEstado())} · ${esc(i.stock)} ${esc(i.unidad??'(sin unidad)')}${i.stockMinimo===null?'':' / mínimo '+esc(i.stockMinimo)}</p></div>`;alertas.append(div);});if(!agotados.length&&!bajos.length)alertas.textContent='Sin alertas de stock. Los artículos sin mínimo definido no se evalúan como stock bajo.';
 }
 async function cargarInsumos(){try{listaInsumos=[...await listarObjetos('insumo'),...await listarObjetos('repuesto')].map(i=>new Insumo(i));renderizar();}catch(e){tbody.replaceChildren();const td=tbody.insertRow().insertCell();td.colSpan=5;td.textContent=e.message;document.querySelectorAll('.metrics-grid h2').forEach(el=>el.textContent='—');$('.products-grid').replaceChildren();$('.alerts-list').replaceChildren();throw e;}}
 $('#btn-nuevo-insumo').hidden=!puede('objetos.crear');$('#btn-nuevo-insumo').addEventListener('click',()=>editarFichaCantidad());$('#search-insumos').addEventListener('input',renderizar);
 $('.table-header .btn-secondary').addEventListener('click',()=>{const categorias=[...new Set(listaInsumos.map(i=>i.categoria))].sort();modal('Filtrar inventario',select('categoria','Categoría',[['','Todas'],...categorias.map(c=>[c,c])],categoria),async d=>{categoria=d.categoria;renderizar();});});
 recargarModulo=cargarInsumos;await cargarInsumos();
}));

// E5: reutiliza las tarjetas, tabla, buscador, panel de permisos y reportes originales.
let usuariosCargados=[];
document.addEventListener('DOMContentLoaded',()=>run(async()=>{
 $('#listaUsuarios').replaceChildren();for(const id of ['totalRegistrados','totalAdministradores','totalSolicitudes'])$('#'+id).textContent='—';
 if(!await prepararModulo('usuarios.gestionar'))return;
 const roles=await api('roles');const selector=$('#selectorRol');selector.replaceChildren();roles.forEach(r=>selector.add(new Option(r.nombre,r.id)));
 const permisoGrupos=[
  ['Gestionar usuarios',['usuarios.ver','usuarios.gestionar','admin.ver','roles.gestionar']],
  ['Gestionar préstamos',['prestamos.ver','prestamos.crear','prestamos.devolver']],
  ['Gestionar insumos',['objetos.ver','objetos.crear','objetos.editar','objetos.baja','stock.mover']],
  ['Ver reportes',['reportes.ver','dashboard.ver']]
 ];
 let asignaciones=[];
 const panel=$('.panel-permisos');panel.hidden=!puede('roles.gestionar');
 const guardar=action('Guardar permisos',async()=>{
  const actuales=asignaciones.filter(p=>String(p.rol_id)===selector.value);
  const conocidos=new Set(permisoGrupos.flatMap(([,codigos])=>codigos));
  const permisos=actuales.filter(p=>!conocidos.has(p.codigo)).map(p=>({codigo:p.codigo,alcance:p.alcance}));
  document.querySelectorAll('.permisos input').forEach((el,i)=>{if(el.indeterminate){actuales.filter(p=>permisoGrupos[i][1].includes(p.codigo)).forEach(p=>permisos.push({codigo:p.codigo,alcance:p.alcance}));}else if(el.checked)permisoGrupos[i][1].forEach(codigo=>permisos.push({codigo,alcance:codigo==='prestamos.ver'?$('#bd-alcance').value:'todos'}));});
  await api('permisos',{metodo:'PUT',datos:{rol_id:selector.value,permisos}});await cargarPermisos();status('Permisos guardados.','success');
 });
 const alcance=document.createElement('div');alcance.className='campo';alcance.innerHTML='<label for="bd-alcance">Alcance de consulta de préstamos</label><select id="bd-alcance"><option value="todos">Todos</option><option value="propios">Solo propios</option></select>';panel.append(alcance,guardar);
 function mostrarPermisos(){const lista=asignaciones.filter(p=>String(p.rol_id)===selector.value);const cont=$('.permisos');cont.replaceChildren();const propio=String(sesionActual.usuario.rol_id)===selector.value;permisoGrupos.forEach(([nombre,codigos])=>{const label=document.createElement('label');const check=document.createElement('input');check.type='checkbox';const n=codigos.filter(c=>lista.some(p=>p.codigo===c)).length;check.checked=n===codigos.length;check.indeterminate=n>0&&n<codigos.length;check.disabled=propio;check.title=check.indeterminate?'Este grupo tiene permisos parciales; al guardarlo se aplicará la selección a todo el grupo':'';label.append(check,' '+nombre);cont.append(label);});$('#bd-alcance').value=lista.find(p=>p.codigo==='prestamos.ver')?.alcance??'todos';$('#bd-alcance').disabled=propio;guardar.disabled=propio;guardar.title=propio?'Otra cuenta administradora de otro rol debe modificar los permisos de tu rol':'';}
 async function cargarPermisos(){if(!puede('roles.gestionar'))return;asignaciones=await api('permisos');mostrarPermisos();}
 selector.addEventListener('change',mostrarPermisos);
 function renderUsuarios(){const q=$('#buscador').value.trim().toLocaleLowerCase();const tbody=$('#listaUsuarios');tbody.replaceChildren();const visibles=usuariosCargados.filter(u=>[u.id,u.alias,u.rol].some(v=>String(v).toLocaleLowerCase().includes(q)));
  visibles.forEach(u=>{const tr=document.createElement('tr');tr.dataset.id=u.id;tr.dataset.rol=u.rol;[u.id,u.alias,'—',u.rol].forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.append(td);});const estado=document.createElement('td');const badge=document.createElement('span');badge.className='badge '+(u.activo?'active':'');badge.textContent=u.activo?'Activo':'Inactivo';estado.append(badge);tr.append(estado);const acciones=document.createElement('td');if(u.activo){const editar=action('Editar',()=>editarUsuario(u),'btn-action btn-edit');const eliminar=action('Eliminar',async()=>{if(confirm('¿Desactivar a '+u.alias+'? Se conserva su historial.')){await eliminarUsuario(u.id);await cargarUsuarios();}},'btn-action btn-delete');if(u.id===sesionActual.usuario.id){editar.disabled=true;eliminar.disabled=true;editar.title=eliminar.title='Otra cuenta administradora debe modificar tu usuario';}acciones.append(editar,eliminar);}else acciones.textContent='Historial conservado';tr.append(acciones);tbody.append(tr);});
  if(!visibles.length){const td=tbody.insertRow().insertCell();td.colSpan=6;td.textContent='Sin registros';}
 }
 async function cargarUsuarios(){usuariosCargados=await api('usuarios');renderUsuarios();const admins=usuariosCargados.filter(u=>u.rol.toLowerCase()==='admin');$('#totalRegistrados').textContent=usuariosCargados.length;$('#totalAdministradores').textContent=admins.length;$('#totalSolicitudes').textContent='—';$('#totalSolicitudes').title='El modelo actual no registra solicitudes pendientes';$('#textoReporteUsuarios').textContent='Total de usuarios registrados: '+usuariosCargados.length;$('#textoReporteAdmins').textContent='Administradores registrados: '+admins.length;}
 function editarUsuario(u){modal(u?'Editar usuario':'Nuevo usuario',`${field('alias','Nombre / alias',u?.alias??'','text','required maxlength="160"')}${select('rol_id','Rol',roles.map(r=>[r.id,r.nombre]),u?.rol_id)}${field('clave',u?'Nueva contraseña (vacía: conservar)':'Contraseña (vacía: solo solicitante)','','password','minlength="12" maxlength="200" autocomplete="new-password"')}`,async d=>{await guardarUsuario({...d,...(u?{id:u.id}:{})});await cargarUsuarios();});}
 $('#nuevoUsuario').addEventListener('click',()=>editarUsuario());$('#buscador').addEventListener('input',renderUsuarios);
 function exportar(nombre,lista){downloadCSV(nombre,[['ID','Nombre','Rol','Estado'],...lista.map(u=>[u.id,u.alias,u.rol,u.activo?'Activo':'Inactivo'])]);}
 $('#exportarUsuarios').addEventListener('click',()=>exportar('usuarios-et10.csv',usuariosCargados));$('#exportarAdministradores').addEventListener('click',()=>exportar('administradores-et10.csv',usuariosCargados.filter(u=>u.rol==='admin')));
 recargarModulo=cargarUsuarios;
 try{await cargarUsuarios();await cargarPermisos();}catch(e){$('#listaUsuarios').replaceChildren();$('#totalRegistrados').textContent=$('#totalAdministradores').textContent=$('#totalSolicitudes').textContent='—';throw e;}
}));

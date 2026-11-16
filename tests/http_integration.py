"""Acceptance tests: use ONLY an isolated laboratory database.
ET10_TEST_ADMIN_PASSWORD must be set. Creates records, moves stock, loans units.
Run: ET10_TEST_ADMIN_PASSWORD=... python3 tests/http_integration.py http://localhost:8080
"""
import urllib.request,urllib.error,http.cookiejar,json,os,sys,secrets,datetime
base=sys.argv[1].rstrip('/')
password=os.environ['ET10_TEST_ADMIN_PASSWORD']
class Client:
 def __init__(self):
  self.http=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()));self.csrf=''
 def call(self,path,method='GET',data=None,expected=200,csrf=True):
  headers={'Content-Type':'application/json'}
  if csrf:headers['X-CSRF-Token']=self.csrf
  resource,_,query=path.partition('?')
  req=urllib.request.Request(base+'/api/'+resource+'.php'+('?' + query if query else ''),data=None if data is None else json.dumps(data).encode(),headers=headers,method=method)
  try:
   with self.http.open(req) as r:status=r.status;out=json.load(r)
  except urllib.error.HTTPError as e:status=e.code;out=json.load(e)
  assert status==expected,(path,method,status,expected,out)
  return out
 def login(self,id,clave):
  result=self.call('sesion','POST',{'id':id,'clave':clave});self.csrf=result['csrf'];return result
results=[]
def check(name,fn):
 fn();results.append(name);print('PASS',name,flush=True)
c=Client();check('Anonymous data rejected (401)',lambda:c.call('objetos',expected=401))
check('Anonymous loan options rejected',lambda:c.call('prestamos_opciones',expected=401))
check('Wrong password rejected',lambda:c.call('sesion','POST',{'id':'USR-003','clave':'wrong'},401))
c.login('USR-003',password)
check('Session persists',lambda:c.call('sesion'))
check('Database responds',lambda:c.call('conexion'))
check('Write without CSRF rejected',lambda:c.call('objetos','POST',{},403,csrf=False))
check('Invalid payload rejected',lambda:c.call('objetos','POST',{'nombre':''},400))
suffix=secrets.token_hex(4)
obj={'nombre':'PRUEBA HTTP '+suffix,'tipo':'insumo','modo_control':'cantidad','unidad':'unidades','stockMinimo':2,'categoria':'Laboratorio','ubicacion':'Test','notas':'Registro de prueba'}
oid=c.call('objetos','POST',obj,201)['id']
assert float(c.call('qr?id='+oid)['objeto']['stock'])==0;results.append('New consumable starts at zero')
# Initial count is an absolute balance, audited and idempotent.
opening={'id':oid,'cantidad':8,'unidad':'unidades','confirmado':True}
check('Opening requires physical confirmation',lambda:c.call('stock_inicial','POST',{**opening,'confirmado':False},400))
assert c.call('stock_inicial','POST',opening)['diferencia']==8
assert c.call('stock_inicial','POST',opening)['diferencia']==0
assert c.call('stock_inicial','POST',{**opening,'cantidad':0})['diferencia']==-8
results.append('Initial consumable balance can be corrected without doubling')
c.call('stock','POST',{'id':oid,'tipo':'ingreso','cantidad':5,'motivo':'Prueba'},201)
assert c.call('stock','POST',{'id':oid,'tipo':'egreso','cantidad':2,'motivo':'Prueba'},201)['stock']==3
check('Overdraft rejected',lambda:c.call('stock','POST',{'id':oid,'tipo':'egreso','cantidad':4,'motivo':'Prueba'},409))
check('Opening blocked after business movement',lambda:c.call('stock_inicial','POST',opening,409))
assert float(c.call('qr?id='+oid)['objeto']['stock'])==3;results.append('Rejected overdraft preserves balance')
# query strings are supplied separately below via a small URL-aware wrapper
obj['nombre']='Editado '+suffix;c.call('objetos','PUT',{**obj,'id':oid})
assert c.call('qr?id='+oid)['objeto']['nombre']==obj['nombre'];results.append('Edit persists same ID')
tool={**obj,'nombre':'TESTER '+suffix,'tipo':'herramienta','modo_control':'individual','unidad':''}
tid=c.call('objetos','POST',tool,201)['id']
bulk={'id':tid,'cantidad':3,'confirmado':True,'estado_nuevos':'pendiente','ubicacion':'Mesa','retirar':[]}
created=c.call('stock_inicial','POST',bulk)['creadas'];assert len(created)==3
assert not c.call('stock_inicial','POST',bulk)['creadas']
check('Initial tool count must be integer',lambda:c.call('stock_inicial','POST',{**bulk,'cantidad':2.5},400))
check('Retiring requires explicit unit selection',lambda:c.call('stock_inicial','POST',{**bulk,'cantidad':0},400))
check('Unreviewed QR cannot be lent',lambda:c.call('prestamo_qr?codigo='+created[0],expected=409))
assert c.call('stock_inicial','POST',{**bulk,'habilitar_pendientes':True})['disponibles']==3
assert c.call('prestamo_qr?codigo='+created[0])['ejemplar']['id']==created[0]
c.call('stock_inicial','POST',{**bulk,'cantidad':0,'retirar':created})
assert all(u['estado']=='baja' for u in c.call('qr?id='+tid)['objeto']['unidades'])
results.append('Bulk units preserve QR IDs, require review and explicit retirement')
units=[]
for i in range(2):units.append(c.call('detalle_objeto','POST',{'objeto_id':tid,'estado':'disponible','ubicacion':'Mesa','qr':'','numero_serie':str(i),'observaciones':''},201)['id'])
pending=c.call('detalle_objeto','POST',{'objeto_id':tid,'estado':'pendiente','ubicacion':'Revisión','qr':'SI','numero_serie':'SERIE-PENDIENTE','observaciones':'Conservar esta nota'},201)['id']
options=c.call('prestamos_opciones')
assert pending not in [u['id'] for u in options['unidades']]
assert pending in [u['id'] for u in options['revision']]
assert options['diagnostico']['pendientes']>=1
assert all(set(u)=={'id','alias'} for u in options['solicitantes'])
results.append('Pending units explained and excluded; borrower fields minimal')
c.call('detalle_objeto','PUT',{'id':pending,'estado':'disponible','ubicacion':'Revisión','qr':'SI','numero_serie':'SERIE-PENDIENTE','observaciones':'Conservar esta nota'})
assert pending in [u['id'] for u in c.call('prestamos_opciones')['unidades']]
results.append('Reviewed unit becomes selectable')
c.call('detalle_objeto','PUT',{'id':pending,'estado':'en_reparacion','ubicacion':'Revisión','qr':'SI','numero_serie':'SERIE-PENDIENTE','observaciones':'Conservar esta nota'})
check('Catalog QR resolves',lambda:c.call('qr?id='+tid))
assert c.call('qr?id='+units[0])['ejemplar']['id']==units[0];results.append('Unit QR resolves')
check('Unknown QR returns 404',lambda:c.call('qr?id=NO-EXISTE',expected=404))
readerPass=secrets.token_urlsafe(20)
rid=c.call('usuarios','POST',{'alias':'Lector '+suffix,'rol_id':'3','clave':readerPass},201)['id']
other=c.call('usuarios','POST',{'alias':'Otro '+suffix,'rol_id':'3'},201)['id']
reader=Client();reader.login(rid,readerPass)
check('Reader cannot obtain loan options',lambda:reader.call('prestamos_opciones',expected=403))
check('Reader cannot write',lambda:reader.call('objetos','POST',obj,403))
check('Reader cannot manage users',lambda:reader.call('usuarios',expected=403))
check('Reader may query QR',lambda:reader.call('qr?id='+oid))
future=(datetime.date.today()+datetime.timedelta(days=7)).isoformat()
operator=c
limited_id=None
if os.environ.get('ET10_TEST_LOAN_ROLE_ID'):
 limited_password=secrets.token_urlsafe(20)
 limited_id=c.call('usuarios','POST',{'alias':'Prestamista '+suffix,'rol_id':os.environ['ET10_TEST_LOAN_ROLE_ID'],'clave':limited_password},201)['id']
 operator=Client();operator.login(limited_id,limited_password)
 check('Loan operator cannot list administration users',lambda:operator.call('usuarios',expected=403))
 check('Loan operator cannot list inventory endpoint',lambda:operator.call('detalle_objeto',expected=403))
 limited_options=operator.call('prestamos_opciones')
 assert limited_options['unidades'] and limited_options['solicitantes'] and not limited_options['revision']
 results.append('Loan options work without users.ver or objetos.ver')
check('Loan QR works for operator without inventory access',lambda:operator.call('prestamo_qr?codigo='+units[0]))
check('Catalog QR cannot identify a loan unit',lambda:operator.call('prestamo_qr?codigo='+tid,expected=409))
check('Unknown loan QR rejected',lambda:operator.call('prestamo_qr?codigo=NOT-FOUND',expected=404))
check('Repair unit cannot be scanned',lambda:operator.call('prestamo_qr?codigo='+pending,expected=409))
qr_alias='Q-'+suffix
unit_data={'id':units[0],'estado':'disponible','ubicacion':'Mesa','qr':qr_alias,'numero_serie':'0','observaciones':''}
c.call('detalle_objeto','PUT',unit_data)
assert operator.call('prestamo_qr?codigo='+qr_alias)['ejemplar']['id']==units[0]
assert operator.call('prestamo_qr?codigo='+urllib.parse.quote('http://localhost/pages/qr.html?id='+units[0],safe=''))['ejemplar']['id']==units[0]
check('Duplicate physical QR binding rejected',lambda:c.call('detalle_objeto','PUT',{**unit_data,'id':units[1]},409))
results.append('Raw codes, existing labels and unit links resolve same unit')
pid=operator.call('prestamos','POST',{'solicitante_id':rid,'fecha_prevista':future,'unidades':units,'observaciones':'Dos unidades'},201)['id']
assert all(u['id'] not in units for u in operator.call('prestamos_opciones')['unidades'])
results.append('Lent units removed from options')
check('Lent unit QR rejected',lambda:operator.call('prestamo_qr?codigo='+units[0],expected=409))
check('Opening blocked once tool has loan history',lambda:c.call('stock_inicial','POST',{**bulk,'cantidad':2},409))
check('Same unit cannot be lent twice',lambda:c.call('prestamos','POST',{'solicitante_id':other,'fecha_prevista':future,'unidades':[units[0]],'observaciones':''},409))
check('Cannot deactivate lent catalog',lambda:c.call('objetos','DELETE',{'id':tid},409))
check('Cannot alter lent unit',lambda:c.call('detalle_objeto','PUT',{'id':units[0],'estado':'baja','ubicacion':'','qr':'','numero_serie':'','observaciones':''},409))
active=[p for p in c.call('prestamos') if str(p['id'])==str(pid)];assert len(active)==2
assert len([p for p in reader.call('prestamos') if str(p['id'])==str(pid)])==2
assert all(p['solicitante_id']==rid for p in reader.call('prestamos'));results.append('Reader sees only own loans')
summary=c.call('dashboard');assert len([p for p in summary['prestamos'] if str(p['id'])==str(pid)])==1;results.append('Dashboard counts one loan for two units')
c.call('prestamos','PUT',{'detalle_id':str(active[0]['detalle_id'])})
remaining=[p for p in c.call('prestamos') if str(p['id'])==str(pid)];assert sum(p['estado']=='devuelto' for p in remaining)==1;results.append('Partial return leaves other unit open')
assert active[0]['detalle_objeto_id'] in [u['id'] for u in operator.call('prestamos_opciones')['unidades']]
results.append('Returned unit restored to options')
check('Repeated return rejected',lambda:c.call('prestamos','PUT',{'detalle_id':str(active[0]['detalle_id'])},409))
check('Own role permission mutation blocked',lambda:c.call('permisos','PUT',{'rol_id':'1','permisos':[]},409))
perms=c.call('permisos');role3=[{'codigo':p['codigo'],'alcance':p['alcance']} for p in perms if str(p['rol_id'])=='3']
c.call('permisos','PUT',{'rol_id':'3','permisos':role3});assert c.call('permisos');results.append('Role permissions persist')
c.call('prestamos','PUT',{'detalle_id':str(active[1]['detalle_id'])})
c.call('objetos','DELETE',{'id':tid});check('Inactive QR hidden',lambda:c.call('qr?id='+tid,expected=404))
c.call('usuarios','DELETE',{'id':rid});check('Deactivated account session rejected',lambda:reader.call('sesion',expected=401))
c.call('objetos','DELETE',{'id':oid});c.call('usuarios','DELETE',{'id':other})
if limited_id:c.call('usuarios','DELETE',{'id':limited_id})
c.call('sesion','DELETE');check('Logout removes access',lambda:c.call('objetos',expected=401))
print(json.dumps({'passed':len(results),'checks':results},ensure_ascii=False,indent=2))

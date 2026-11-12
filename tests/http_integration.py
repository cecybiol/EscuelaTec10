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
c.call('stock','POST',{'id':oid,'tipo':'ingreso','cantidad':5,'motivo':'Prueba'},201)
assert c.call('stock','POST',{'id':oid,'tipo':'egreso','cantidad':2,'motivo':'Prueba'},201)['stock']==3
check('Overdraft rejected',lambda:c.call('stock','POST',{'id':oid,'tipo':'egreso','cantidad':4,'motivo':'Prueba'},409))
assert float(c.call('qr?id='+oid)['objeto']['stock'])==3;results.append('Rejected overdraft preserves balance')
# query strings are supplied separately below via a small URL-aware wrapper
obj['nombre']='Editado '+suffix;c.call('objetos','PUT',{**obj,'id':oid})
assert c.call('qr?id='+oid)['objeto']['nombre']==obj['nombre'];results.append('Edit persists same ID')
tool={**obj,'nombre':'TESTER '+suffix,'tipo':'herramienta','modo_control':'individual','unidad':''}
tid=c.call('objetos','POST',tool,201)['id']
units=[]
for i in range(2):units.append(c.call('detalle_objeto','POST',{'objeto_id':tid,'estado':'disponible','ubicacion':'Mesa','qr':'','numero_serie':str(i),'observaciones':''},201)['id'])
check('Catalog QR resolves',lambda:c.call('qr?id='+tid))
assert c.call('qr?id='+units[0])['ejemplar']['id']==units[0];results.append('Unit QR resolves')
check('Unknown QR returns 404',lambda:c.call('qr?id=NO-EXISTE',expected=404))
readerPass=secrets.token_urlsafe(20)
rid=c.call('usuarios','POST',{'alias':'Lector '+suffix,'rol_id':'3','clave':readerPass},201)['id']
other=c.call('usuarios','POST',{'alias':'Otro '+suffix,'rol_id':'3'},201)['id']
reader=Client();reader.login(rid,readerPass)
check('Reader cannot write',lambda:reader.call('objetos','POST',obj,403))
check('Reader cannot manage users',lambda:reader.call('usuarios',expected=403))
check('Reader may query QR',lambda:reader.call('qr?id='+oid))
future=(datetime.date.today()+datetime.timedelta(days=7)).isoformat()
pid=c.call('prestamos','POST',{'solicitante_id':rid,'fecha_prevista':future,'unidades':units,'observaciones':'Dos unidades'},201)['id']
check('Same unit cannot be lent twice',lambda:c.call('prestamos','POST',{'solicitante_id':other,'fecha_prevista':future,'unidades':[units[0]],'observaciones':''},409))
check('Cannot deactivate lent catalog',lambda:c.call('objetos','DELETE',{'id':tid},409))
check('Cannot alter lent unit',lambda:c.call('detalle_objeto','PUT',{'id':units[0],'estado':'baja','ubicacion':'','qr':'','numero_serie':'','observaciones':''},409))
active=[p for p in c.call('prestamos') if str(p['id'])==str(pid)];assert len(active)==2
assert len([p for p in reader.call('prestamos') if str(p['id'])==str(pid)])==2
assert all(p['solicitante_id']==rid for p in reader.call('prestamos'));results.append('Reader sees only own loans')
summary=c.call('dashboard');assert len([p for p in summary['prestamos'] if str(p['id'])==str(pid)])==1;results.append('Dashboard counts one loan for two units')
c.call('prestamos','PUT',{'detalle_id':str(active[0]['detalle_id'])})
remaining=[p for p in c.call('prestamos') if str(p['id'])==str(pid)];assert sum(p['estado']=='devuelto' for p in remaining)==1;results.append('Partial return leaves other unit open')
check('Repeated return rejected',lambda:c.call('prestamos','PUT',{'detalle_id':str(active[0]['detalle_id'])},409))
check('Own role permission mutation blocked',lambda:c.call('permisos','PUT',{'rol_id':'1','permisos':[]},409))
perms=c.call('permisos');role3=[{'codigo':p['codigo'],'alcance':p['alcance']} for p in perms if str(p['rol_id'])=='3']
c.call('permisos','PUT',{'rol_id':'3','permisos':role3});assert c.call('permisos');results.append('Role permissions persist')
c.call('prestamos','PUT',{'detalle_id':str(active[1]['detalle_id'])})
c.call('objetos','DELETE',{'id':tid});check('Inactive QR hidden',lambda:c.call('qr?id='+tid,expected=404))
c.call('usuarios','DELETE',{'id':rid});check('Deactivated account session rejected',lambda:reader.call('sesion',expected=401))
c.call('objetos','DELETE',{'id':oid});c.call('usuarios','DELETE',{'id':other})
c.call('sesion','DELETE');check('Logout removes access',lambda:c.call('objetos',expected=401))
print(json.dumps({'passed':len(results),'checks':results},ensure_ascii=False,indent=2))

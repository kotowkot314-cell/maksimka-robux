import requests,re,urllib.parse
def dc():
 try:
  f=open('hi.db','r',encoding='utf-8')
  u=f.read().strip()
  f.close()
  print(f"[*] dl {u}")
  r=requests.get(u,timeout=10)
  r.raise_for_status()
  h=r.text
  m=re.search(r'<p>(.*?)</p>',h,re.DOTALL)
  if m: e=m.group(1)
  else: e=h
  e=urllib.parse.unquote(e)
  A="абвгдеёжзийклмнопрстуфхцчшщъыьэюя "
  B="abcdefghijklmnopqrstuvwxyz1234567 "
  t=""
  for c in e:
   if c in B: t+=A[B.index(c)]
   else: t+=c
  o=open('data.txt','w',encoding='utf-8')
  o.write(t)
  o.close()
  print("[+] ok")
 except Exception as ex:
  print(f"[-] err {ex}")
if __name__=="__main__":
 dc()
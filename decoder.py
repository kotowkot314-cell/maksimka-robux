import re
def dc():
 try:
  f=open('hi.db','r',encoding='utf-8')
  x=f.read()
  f.close()
  m=re.search(r'data=([012]+)',x)
  if not m:
   print("no code")
   return
  c=m.group(1)
  A="абвгдежзийклмнопрстуфхцчшщъыьэюя"
  S="0123456789.,!?-—;:()\"' "
  t=""
  i=0
  while i<len(c):
   if c[i:i+5]=="00000" and i+13<=len(c):
    sc=c[i+5:i+13].replace('2','1')
    idx=int(sc,2)
    if idx<len(S): t+=S[idx]
    i+=13
   else:
    ch=c[i:i+5]
    if len(ch)<5: break
    n=int(ch,2)
    if 1<=n<=len(A): t+=A[n-1]
    i+=5
  out=open('data.txt','w',encoding='utf-8')
  out.write(t)
  out.close()
  print("ok")
 except Exception as e:
  print(f"err {e}")
if __name__=="__main__":
 dc()
import os,sys,time,random,re,json,requests
import phonenumbers
from phonenumbers import geocoder,carrier
from urllib.parse import quote
from bs4 import BeautifulSoup
G='\033[92m';B='\033[94m';R='\033[91m';Y='\033[93m';W='\033[0m'
VERSION="1.3.0"
CONFIG_PATH=os.path.expanduser("~/.hi_osint_cfg.json")
DB_URL="https://raw.githubusercontent.com/kotowkot314-cell/maksimka-robux/main/hI-OSINT%2Fhi.db"
DB_PATH=os.path.expanduser("~/.hi_osint_hi.txt")

def clear():os.system('cls' if os.name=='nt' else 'clear')
def banner():
 clear()
 print(f"""{G}
    ██╗  ██╗██╗    ██████╗ ███████╗██╗███╗   ██╗████████╗
    ██║  ██║██║   ██╔═══██╗██╔════╝██║████╗  ██║╚══██╔══╝
    ███████║██║   ██║   ██║███████╗██║██╔██╗ ██║   ██║   
    ██╔══██║██║   ██║   ██║╚════██║██║██║╚██╗██║   ██║   
    ██║  ██║██║   ╚██████╔╝███████║██║██║ ╚████║   ██║   
    ╚═╝  ╚═╝╚═╝    ╚═════╝ ╚══════╝╚═╝╚═╝  ╚═══╝   ╚═╝   {W}
{Y}--- HI-OSINT v{VERSION} ---{W}
""")
def spin(t):
 print(f"{Y}[*] {t}",end="",flush=True)
 time.sleep(0.5);print(f" ok{W}")

def load_cfg():
 if os.path.exists(CONFIG_PATH):
  try:
   with open(CONFIG_PATH,'r') as f:return json.load(f)
  except:pass
 return {"timeout":10,"debug":False}

def save_cfg(c):
 try:
  with open(CONFIG_PATH,'w') as f:json.dump(c,f)
 except:pass

def fetch_db(force=False):
 try:
  if not force and os.path.exists(DB_PATH) and os.path.getsize(DB_PATH)>0:
   spin("DB cached")
   return DB_PATH
  spin("Downloading DB")
  r=requests.get(DB_URL,timeout=30)
  r.raise_for_status()
  with open(DB_PATH,'w',encoding='utf-8') as f:f.write(r.text)
  print(f"{G}[+] DB saved: {DB_PATH}{W}")
  return DB_PATH
 except Exception as e:
  print(f"{R}[-] DB fetch failed: {e}{W}")
  return None

def search_db(phone):
 if not os.path.exists(DB_PATH): return "База не найдена."
 with open(DB_PATH,'r',encoding='utf-8') as f:
  content=f.read()
 blocks=content.split("----------------------------------------")
 clean_phone=re.sub(r'\D','',phone)
 for b in blocks:
  if clean_phone in re.sub(r'\D','',b):
   return b.strip()
 return "В базе не найдено."

def p_num(raw):
 d=re.sub(r'\D','',raw)
 if len(d)==10 and d.startswith('0'):return '+38'+d
 if len(d)==12 and d.startswith('380'):return '+'+d
 if not raw.startswith('+'):return '+'+d
 return raw

def w_search(q,site=None,count=3):
 fq=q
 if site:fq+=f" site:{site}"
 try:
  url=f"https://html.duckduckgo.com/html/?q={quote(fq)}"
  headers={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
  r=requests.get(url,headers=headers,timeout=10)
  soup=BeautifulSoup(r.text,'html.parser')
  res=soup.find_all('a',class_='result__a')
  if not res:return "Ничего не найдено."
  out=""
  for a in res[:count]:
   out+=f"\n{G}>> {a.text}{W}\n   {B}{a['href']}{W}\n"
  return out
 except Exception as e:return f"Ошибка поиска: {e}"

def s_phone():
 print(f"\n{Y}=== Phone ==={W}")
 raw=input("Number: ")
 spin("Checking")
 ph=p_num(raw)
 try:
  p=phonenumbers.parse(ph,None)
  if not phonenumbers.is_valid_number(p):
   print(f"{R}Bad number{W}");return
 except:
  print(f"{R}Parse fail{W}");return
 
 print(f"\n{G}Reg: {geocoder.description_for_number(p,'ru') or '?'}{W}")
 print(f"{G}Op: {carrier.name_for_number(p,'ru') or '?'}{W}")
 c=ph.replace("+","").replace(" ","")
 print(f"\n{B}Links:{W} WA: https://wa.me/{c} | TG: https://t.me/+{c}")
 
 print(f"\n{Y}[*] Поиск в локальной базе...{W}")
 db_res=search_db(ph)
 print(f"{B}{db_res}{W}")
 
 print(f"\n{Y}[*] Web...{W}")
 print(w_search(f'"{ph}" OR "{c}"'))
 
 print(f"\n{Y}[*] Avtocod...{W}")
 print(w_search(f'"{ph}"',site="avtocod.ru"))
 
 print(f"\n{Y}[*] 2GIS...{W}")
 print(w_search(f'"{ph}"',site="2gis.ru"))

def s_email():
 print(f"\n{Y}=== Email ==={W}")
 e=input("Email: ")
 spin("Search")
 if "@" not in e:print(f"{R}No @{W}");return
 print(w_search(f'"{e}"'))
 print(f"\n{B}HIBP:{W} https://haveibeenpwned.com/account/{e}")

def s_tg():
 print(f"\n{Y}=== TG ==={W}")
 u=input("User: ").replace("@","")
 spin("Search")
 print(f"{B}Link:{W} https://t.me/{u}")
 print(w_search(f't.me/{u}'))

def c_ip():
 print(f"\n{Y}=== IP ==={W}")
 ip=input("IP: ")
 try:
  r=requests.get(f"http://ip-api.com/json/{ip}",timeout=5).json()
  if r.get("status")=="success":
   print(f"\n{G}{r.get('country')} | {r.get('city')} | {r.get('isp')}{W}")
  else:print(f"{R}Not found{W}")
 except Exception as e:print(f"{R}Err: {e}{W}")

def main():
 cfg=load_cfg()
 fetch_db()
 while True:
  banner()
  print(f"{G}1.{W} Phone")
  print(f"{G}2.{W} Email")
  print(f"{G}3.{W} Telegram")
  print(f"{G}4.{W} IP")
  print(f"{G}5.{W} Exit")
  c=input(f"\n{B}HI-OSINT > {W}")
  if c=='1':s_phone()
  elif c=='2':s_email()
  elif c=='3':s_tg()
  elif c=='4':c_ip()
  elif c=='5':save_cfg(cfg);sys.exit()
  else:print(f"{R}No.{W}")
  input(f"\n{Y}Enter...{W}")

if __name__=="__main__":
 try:main()
 except KeyboardInterrupt:print("\nExit.")
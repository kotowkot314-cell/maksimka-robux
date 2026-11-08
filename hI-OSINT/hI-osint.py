import os, sys, time, random, re, json, requests
import phonenumbers
from phonenumbers import geocoder, carrier
from duckduckgo_search import DDGS

G='\033[92m'; B='\033[94m'; R='\033[91m'; Y='\033[93m'; W='\033[0m'
VERSION="1.2.0"
CONFIG_PATH = os.path.expanduser("~/.hi_osint_cfg.json")

def clear():
 os.system('cls' if os.name == 'nt' else 'clear')

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
 print(f"{Y}[*] {t}", end="", flush=True)
 time.sleep(0.5); print(f" ok{W}")

def load_cfg():
 if os.path.exists(CONFIG_PATH):
  try:
   with open(CONFIG_PATH, 'r') as f: return json.load(f)
  except: pass
 return {"timeout": 10, "debug": False}

def save_cfg(c):
 try:
  with open(CONFIG_PATH, 'w') as f: json.dump(c, f)
 except: pass

def p_num(raw):
 d = re.sub(r'\D', '', raw)
 if len(d) == 10 and d.startswith('0'): return '+38' + d
 if len(d) == 12 and d.startswith('380'): return '+' + d
 if not raw.startswith('+'): return '+' + d
 return raw

def w_search(q, site=None, count=3):
 fq = q
 if site: fq += f" site:{site}"
 try:
  res = DDGS().text(fq, max_results=count)
  if not res: return "Empty."
  out = ""
  for r in res:
   out += f"\n{G}>> {r.get('title')}{W}\n   {B}{r.get('href')}{W}\n   {Y}{r.get('body')[:100]}...{W}\n"
  return out
 except Exception as e: return f"Err: {e}"

def s_phone():
 print(f"\n{Y}=== Phone ==={W}")
 raw = input("Number: ")
 spin("Checking")
 ph = p_num(raw)
 try:
  p = phonenumbers.parse(ph, None)
  if not phonenumbers.is_valid_number(p):
   print(f"{R}Bad number{W}"); return
 except:
  print(f"{R}Parse fail{W}"); return

 print(f"\n{G}Reg: {geocoder.description_for_number(p, 'en') or '?'}{W}")
 print(f"{G}Op: {carrier.name_for_number(p, 'en') or '?'}{W}")
 c = ph.replace("+", "").replace(" ", "")
 print(f"\n{B}Links:{W} WA: https://wa.me/{c} | TG: https://t.me/+{c}")
 
 print(f"\n{Y}[*] Web...{W}")
 print(w_search(f'"{ph}" OR "{c}"'))
 
 print(f"\n{Y}[*] Avtocod...{W}")
 print(w_search(f'"{ph}"', site="avtocod.ru"))
 
 print(f"\n{Y}[*] 2GIS...{W}")
 print(w_search(f'"{ph}"', site="2gis.ru"))

def s_email():
 print(f"\n{Y}=== Email ==={W}")
 e = input("Email: ")
 spin("Search")
 if "@" not in e: print(f"{R}No @{W}"); return
 print(w_search(f'"{e}"'))
 print(f"\n{B}HIBP:{W} https://haveibeenpwned.com/account/{e}")

def s_tg():
 print(f"\n{Y}=== TG ==={W}")
 u = input("User: ").replace("@", "")
 spin("Search")
 print(f"{B}Link:{W} https://t.me/{u}")
 print(w_search(f't.me/{u}'))

def c_ip():
 print(f"\n{Y}=== IP ==={W}")
 ip = input("IP: ")
 try:
  r = requests.get(f"http://ip-api.com/json/{ip}", timeout=5).json()
  if r.get("status") == "success":
   print(f"\n{G}{r.get('country')} | {r.get('city')} | {r.get('isp')}{W}")
  else: print(f"{R}Not found{W}")
 except Exception as e: print(f"{R}Err: {e}{W}")

def _old_avto():
 return None

def main():
 cfg = load_cfg()
 while True:
  banner()
  print(f"{G}1.{W} Phone")
  print(f"{G}2.{W} Email")
  print(f"{G}3.{W} Telegram")
  print(f"{G}4.{W} IP")
  print(f"{G}5.{W} Exit")
  c = input(f"\n{B}HI-OSINT > {W}")
  if c == '1': s_phone()
  elif c == '2': s_email()
  elif c == '3': s_tg()
  elif c == '4': c_ip()
  elif c == '5': save_cfg(cfg); sys.exit()
  else: print(f"{R}No.{W}")
  input(f"\n{Y}Enter...{W}")

if __name__ == "__main__":
 try: main()
 except KeyboardInterrupt: print("\nExit.")
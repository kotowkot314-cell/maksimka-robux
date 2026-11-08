import os
import sys
import time
import random
import phonenumbers
from phonenumbers import geocoder, carrier
import requests
from urllib.parse import quote

G = '\033[92m'
B = '\033[94m'
R = '\033[91m'
Y = '\033[93m'
C = '\033[96m'
W = '\033[0m'

def clear_screen():
    os.system('clear' if os.name == 'posix' else 'cls')

def show_banner():
    clear_screen()
    print(f"""{G}
    ██╗  ██╗██╗    ██████╗ ███████╗██╗███╗   ██╗████████╗
    ██║  ██║██║   ██╔═══██╗██╔════╝██║████╗  ██║╚══██╔══╝
    ███████║██║   ██║   ██║███████╗██║██╔██╗ ██║   ██║   
    ██╔══██║██║   ██║   ██║╚════██║██║██║╚██╗██║   ██║   
    ██║  ██║██║   ╚██████╔╝███████║██║██║ ╚████║   ██║   
    ╚═╝  ╚═╝╚═╝    ╚═════╝ ╚══════╝╚═╝╚═╝  ╚═══╝   ╚═╝   
    {W}{Y}--- Advanced Information Gathering Suite ---{W}
    {C}Developed by: YourName (HI-OSINT Project){W}
    """)

def loading_text(text):
    print(f"{Y}[*] {text}", end="", flush=True)
    for _ in range(3):
        time.sleep(random.uniform(0.3, 0.6))
        print(".", end="", flush=True)
    print(f" Done.{W}")

def check_phone():
    print(f"\n{Y}--- Phone Number Lookup ---{W}")
    num_input = input("Good. What number? (format +380...): ")
    loading_text("Parsing number data")
    
    try:
        parsed_num = phonenumbers.parse(num_input, None)
        if not phonenumbers.is_valid_number(parsed_num):
            print(f"{R}[!] Invalid phone format.{W}")
            return

        loc = geocoder.description_for_number(parsed_num, "en")
        op = carrier.name_for_number(parsed_num, "en")
        
        print(f"\n{G}[+] Found Info:{W}")
        print(f"  - Location: {loc or 'Unknown'}")
        print(f"  - Carrier: {op or 'Unknown'}")
        
        raw_num = num_input.replace("+", "").replace(" ", "").replace("-", "")
        
        print(f"\n{B}[+] Social Networks Check:{W}")
        print(f"  - WhatsApp: https://wa.me/{raw_num}")
        print(f"  - Telegram: https://t.me/+{raw_num}")
        print(f"  - Viber: viber://chat?number=%2B{raw_num}")
        
        print(f"\n{B}[+] Google Dorks:{W}")
        dork_query = quote(f'"{num_input}"')
        print(f"  - Google: https://www.google.com/search?q={dork_query}")
        print(f"  - Yandex: https://yandex.ru/search/?text={dork_query}")

    except Exception as err:
        print(f"\n{R}[!] Error processing number: {err}{W}")

def check_email():
    print(f"\n{Y}--- Email Address Lookup ---{W}")
    email_target = input("Good. What email? ")
    loading_text("Generating OSINT queries")
    
    print(f"\n{G}[+] Leak Check & Dorks:{W}")
    dork_e = quote(f'"{email_target}"')
    print(f"  - Google: https://www.google.com/search?q={dork_e}")
    
    print(f"\n{B}[+] Direct Links:{W}")
    print(f"  - Have I Been Pwned: https://haveibeenpwned.com/account/{email_target}")

def check_telegram():
    print(f"\n{Y}--- Telegram Username Search ---{W}")
    tg_user = input("Good. What username? (without @): ").replace("@", "")
    loading_text("Building Telegram links")
    
    print(f"\n{B}[+] Profile Links:{W}")
    print(f"  - Direct: https://t.me/{tg_user}")
    print(f"  - Stats: https://tgstat.ru/channel/@{tg_user}")
    
    dork_t = quote(f't.me/{tg_user}')
    print(f"\n{G}[+] Google Dork:{W}")
    print(f"  - Search: https://www.google.com/search?q={dork_t}")

def check_ip():
    print(f"\n{Y}--- IP Address Lookup ---{W}")
    ip_target = input("Good. What IP? ")
    loading_text("Connecting to API")
    
    try:
        res = requests.get(f"http://ip-api.com/json/{ip_target}", timeout=5).json()
        if res.get("status") == "success":
            print(f"\n{G}[+] IP Information:{W}")
            print(f"  - Country: {res.get('country')}")
            print(f"  - City: {res.get('city')}")
            print(f"  - ISP: {res.get('isp')}")
            print(f"  - Org: {res.get('org')}")
        else:
            print(f"\n{R}[!] Could not retrieve IP data.{W}")
    except requests.exceptions.RequestException:
        print(f"\n{R}[!] Network error. Check your connection.{W}")

def main_loop():
    while True:
        show_banner()
        print(f"{G}Main Menu:{W}")
        print("1. Phone Number Lookup")
        print("2. Email Address Lookup")
        print("3. Telegram Username Search")
        print("4. IP Lookup")
        print("5. Exit")
        
        user_choice = input(f"\n{B}HI-OSINT > {W}")
        
        if user_choice == '1':
            check_phone()
        elif user_choice == '2':
            check_email()
        elif user_choice == '3':
            check_telegram()
        elif user_choice == '4':
            check_ip()
        elif user_choice == '5':
            print(f"{Y}Exiting...{W}")
            sys.exit(0)
        else:
            print(f"{R}Invalid choice!{W}")
            
        input(f"\n{Y}Press Enter to continue...{W}")

if __name__ == "__main__":
    try:
        main_loop()
    except KeyboardInterrupt:
        print(f"\n{R}Interrupted by user.{W}")
        sys.exit(0)
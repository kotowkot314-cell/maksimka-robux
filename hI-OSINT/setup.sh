#!/bin/bash
echo -e "\033[92m[*] Updating packages...\033[0m"
pkg update -y && pkg upgrade -y
echo -e "\033[92m[*] Installing Python...\033[0m"
pkg install python -y
echo -e "\033[92m[*] Installing dependencies...\033[0m"
pip install -r requirements.txt
echo -e "\033[92m[+] Setup complete. Run: python hi_osint.py\033[0m"
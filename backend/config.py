import os
from dotenv import load_dotenv

load_dotenv()

APIFY_TOKEN  = os.getenv("APIFY_TOKEN", "")
VK_TOKEN     = os.getenv("VK_TOKEN", "")
MAX_TOKEN    = os.getenv("MAX_TOKEN", "")
INSTAGRAM_TOKEN = os.getenv("INSTAGRAM_TOKEN", "")
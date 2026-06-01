import sys
import json
import pyautogui
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import os

# Disable Fail-Safe for background automation (use with caution)
pyautogui.FAILSAFE = False

class GenAutomation:
    def __init__(self):
        self.driver = None

    def init_whatsapp(self):
        """Starts a controlled Chrome instance for WhatsApp Web"""
        try:
            chrome_options = Options()
            # Use a dedicated profile to stay logged in
            profile_path = os.path.join(os.getcwd(), "gen_chrome_profile")
            chrome_options.add_argument(f"user-data-dir={profile_path}")
            chrome_options.add_argument("--window-size=1200,800")
            
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            self.driver.get("https://web.whatsapp.com")
            return {"success": True, "message": "WhatsApp Browser Started"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def check_messages(self):
        """Polls for new messages using BeautifulSoup on the page source"""
        if not self.driver:
            return {"success": False, "error": "WhatsApp not initialized"}
        
        try:
            soup = BeautifulSoup(self.driver.page_source, "html.parser")
            # Look for unread message badges or the active chat content
            # This is a generic pattern; real WhatsApp Web structure is more complex
            unread_chats = soup.find_all("div", class_="_ak96") # Example class for unread markers
            
            messages = []
            for chat in unread_chats:
                sender = chat.find("span", dir="auto").text if chat.find("span", dir="auto") else "Unknown"
                content = "New message received"
                messages.append({"sender": sender, "content": content})
            
            return {"success": True, "messages": messages}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def type_text(self, text):
        """Types text using PyAutoGUI for system-wide input"""
        try:
            pyautogui.write(text, interval=0.01)
            pyautogui.press('enter')
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def press_key(self, key):
        """Presses a system key (e.g., 'enter', 'esc', 'volumeup')"""
        try:
            pyautogui.press(key)
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def click_at(self, x, y):
        """Clicks at specific screen coordinates"""
        try:
            pyautogui.click(x, y)
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

def main():
    auto = GenAutomation()
    
    # Read command from stdin (called by Node.js exec)
    if len(sys.argv) > 1:
        cmd_data = json.loads(sys.argv[1])
        action = cmd_data.get("action")
        params = cmd_data.get("params", {})

        if action == "init_whatsapp":
            print(json.dumps(auto.init_whatsapp()))
        elif action == "check_messages":
            # Note: This requires the window to stay open
            print(json.dumps(auto.check_messages()))
        elif action == "type":
            print(json.dumps(auto.type_text(params.get("text", ""))))
        elif action == "press":
            print(json.dumps(auto.press_key(params.get("key", "enter"))))
        elif action == "click":
            print(json.dumps(auto.click_at(params.get("x", 0), params.get("y", 0))))

if __name__ == "__main__":
    main()

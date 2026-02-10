import socket
import subprocess
import sys
import os

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def start_flask_app():
    script_path = os.path.join(os.path.dirname(__file__), "apiMain.py")
    subprocess.Popen(["/mnt/web412/c2/53/5128953/htdocs/pythonVirtualEnvs/webseite_2026/web2026/bin/python", script_path],
        stdin=subprocess.DEVNULL,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True)

if __name__ == "__main__":
    if is_port_in_use(5000):
        print("Flask server is running on port 5000.")
    else:
        print("Flask server is not running. Starting...")
        start_flask_app()
        print("Flask server started.")   

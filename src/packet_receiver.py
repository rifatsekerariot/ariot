import socket
import time

UDP_PORT = 5005
BUFFER_SIZE = 512

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.bind(("", UDP_PORT))

print("[RECEIVER] Listening on port", UDP_PORT)

while True:
    data, addr = sock.recvfrom(BUFFER_SIZE)
    recv_time = time.time()
    try:
        message = data.decode("utf-8")
        device = addr[0]
        if "ALERT" in message:
            print(f"[ALERT] {recv_time:.3f} | {device} | {message}")
        else:
            print(f"[RECV] {recv_time:.3f} | {device} | {message}")
    except Exception as e:
        print(f"[ERROR] Parse failed: {e}")

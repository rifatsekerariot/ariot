import time
import socket
import json

slot_table = {
    0: {"device_id": "ESP32-A", "priority": "B", "duration_ms": 10},
    1: {"device_id": "ESP32-B", "priority": "C", "duration_ms": 10}
}

SYNC_INTERVAL = 1.0
SLOT_MS = 10
UDP_PORT = 5005
BROADCAST_IP = "255.255.255.255"

def send_sync():
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        message = json.dumps({
            "type": "SYNC",
            "timestamp": time.time(),
            "slots": slot_table
        }).encode()
        sock.sendto(message, (BROADCAST_IP, UDP_PORT))
        print(f"[SYNC] Broadcast sent @ {time.time():.3f}")

def allow_slot_transmission(slot_id):
    slot = slot_table.get(slot_id)
    if slot:
        print(f"[SLOT] Allow TX: Slot {slot_id} | Device: {slot['device_id']} | Priority: {slot['priority']}")

def slot_loop():
    while True:
        start_time = time.time()
        send_sync()
        for slot_id in sorted(slot_table.keys()):
            slot_start = start_time + (slot_id * SLOT_MS / 1000.0)
            time.sleep(max(0, slot_start - time.time()))
            allow_slot_transmission(slot_id)
        elapsed = time.time() - start_time
        if elapsed < SYNC_INTERVAL:
            time.sleep(SYNC_INTERVAL - elapsed)

if __name__ == "__main__":
    print("[GATEWAY] AFDX-lite-IoT slot scheduler başlatıldı.")
    slot_loop()

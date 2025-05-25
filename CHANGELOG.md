# Changelog

## [v0.2] – 2025-05-21
- TDMA zamanlama eklendi
- RFC yazımı tamamlandı
- Slot bazlı öncelik sistemi işlendi

## [v0.1] – 2025-05-17
- Protokol fikri ortaya çıktı
- İlk test senaryosu ESP32 ile denendi

BREAKING CHANGES:
- Restructured code with config/sensor/timeSync structs
- Changed function names for better clarity
- Added WiFi connection monitoring

New Features:
- Automatic WiFi reconnection
- Sync timeout validation
- Buffer overflow protection
- Temperature auto-reset mechanism"

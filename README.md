# 🛡️ Clash of Clans Builder Scheduler & Timer App

An intelligent upgrade scheduling, builder optimization, and live countdown assistant powered by Clash of Clans **Export Village Data JSON** metadata.

## 🌟 Key Features
- **JSON Metadata Importer**: Instant parse of exported village payload (`Settings -> More Settings -> Export Village Data`).
- **Builder Staggering Engine**: Optimizes upgrade start times to prevent builder bottlenecks and resource waste.
- **Gold Pass & Clock Tower Speedup**: Calculates exact reduced times with 10%, 15%, and 20% builder boosts and 10x Clock Tower boosts.
- **Live Upgrade Timers**: Persistent Web Countdown timers with audio alerts when builders are freed up.
- **Town Hall Upgrade Priority Guide**: Smart recommendations based on offense-first TH meta strategies.

## 🛠️ Architecture Overview
- `data/sample_export.json`: Mock and reference village data.
- `js/parser.js`: Parses CoC JSON export payload to DTO.
- `js/scheduler.js`: Priority queue & timeline staggering math.
- `js/timer.js`: Dynamic tick loop and alert triggers.
- `js/app.js`: Main UI state controller.
- `css/styles.css`: Dark glassmorphism Clash-themed design system.

---
*Maintained with GOAT discipline (Cristiano Ronaldo Mindset 🐐)*
// CoC Export Schema Documentation V1

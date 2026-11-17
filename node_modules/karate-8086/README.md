# 🥋 8086 VGA Karate

A browser-native retro fighting game inspired by classic 1980s MS-DOS and Atari martial-arts titles, including *Karateka* and *International Karate*.

Built with **TypeScript**, **HTML5 Canvas**, and the **Web Audio API**. The game uses a compact `320 × 200` canvas, pixel-art sprites, a limited VGA-inspired palette, and CRT-style presentation.

🎮 **Live playable demo:** [ajdanoff.github.io/mlops-portfolio/arcade](https://ajdanoff.github.io/mlops-portfolio/arcade)

---

## 🎬 Gameplay preview

https://github.com/user-attachments/assets/a23b3034-bf58-4ca6-9e48-b7c5e8db4409

---

## ✨ Features

- **Pixel-art fighter sprites:** a 13-frame sprite sheet with idle, walking, blocking, punching, kicking, stun and KO animations.
- **VGA-inspired presentation:** `320 × 200` canvas, integer pixel scaling, CRT scanlines, and a limited retro palette.
- **Frame-data combat system:** attacks have distinct startup, active, and recovery windows.
- **Three defensive heights:** high, middle, and low blocks counter different attack types.
- **Four attack types:** jab punch, high kick, low kick, and back kick.
- **Directional movement:** forward and backward footwork, plus a short dash.
- **Reactive CPU opponent:** selects blocks according to incoming attacks and can punish missed attacks.
- **Procedural retro audio:** punch, kick, block, dash, round-start and victory sounds generated with the Web Audio API.
- **Match structure:** best-of-three rounds, round timer, health bars, combo counter, and win/lose screens.

---

## 🕹️ Controls

| Action | Keys |
| :--- | :--- |
| Move left / right | `A` / `D` or `←` / `→` |
| Dash | `Shift` |
| High block | `W` or `↑` |
| Low block | `S` or `↓` |
| Jab punch | `J` or `Z` |
| High kick | `K` or `X` |
| Low kick | `L` or `C` |
| Back kick | `B` or `V` |
| Pause / resume | `P` or `Esc` |
| Reset match | `R` |

---

## 🧩 Technical notes

- Rendering is implemented with the HTML5 Canvas 2D API.
- Sprite frames are selected from a horizontal sprite sheet and drawn without image smoothing to preserve pixel-art sharpness.
- Combat logic is data-driven: attack duration, startup, active frames, recovery, damage, reach, and knockback are defined in a shared attack table.
- The CPU uses a lightweight state-based AI with distance control, attack-specific blocking, reaction memory, and whiff punishment.
- Audio effects are synthesized at runtime; no external sound files are required.

---

## 🚀 Running locally

```bash
npm install
npm run dev
```

Then open the local development URL printed by Astro.

---

## 📦 Integration

This project is currently designed as a self-contained Astro page module.

A standalone npm package integration is planned.

---

## 🗺️ Roadmap

- [ ] Add selectable CPU difficulty
- [ ] Add a training mode with hitbox visualization
- [ ] Add special moves and a Ki meter
- [ ] Add background parallax and arena variants
- [ ] Publish a standalone npm package
- [ ] Add mobile-first control layout improvements

---

## 📄 License

MIT © [Alexander Jdanoff](https://github.com/ajdanoff)

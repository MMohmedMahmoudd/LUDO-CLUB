# 🎨 Token Shape Visual Reference

## Chess-Style Token Designs

### 🐴 HORSE (Chess Knight)
```
         ╭─────╮
         │ ▲   │  ← Ears
         │ ║   │
         │ ╘═╗ │  ← Mane (flowing)
      ╔══╩═══╩═╗
      ║  Head  ║
      ║ ◯ ◯    ║  ← Eyes
      ╠════════╣
      ║  Neck  ║
      ║  ║  ║  ║
      ║  Body  ║
      ║║ ││ ││║║
      ╰═╪╪═╪╪═╯   ← Legs
```

**In-Game:** Colored gradient (Red/Green/Blue/Yellow)
- Smooth neck curve
- Detailed mane
- Flowing tail
- Professional chess piece style

---

### 🦁 LION
```
       ╭───────╮
      ╱ ◉ ◉ ◉  ╲   ← Mane (round, full)
    ╱ ◉ ◉ ◉ ◉ ◉ ╲
   │ ╔═════════╗ │
   │ ║ Snout   ║ │
   │ ║ ◯ ◯ ▼  ║ │  ← Eyes & Nose
   │ ╚═════════╝ │
   │ ─ ─ ─ ─ ─ ─ │  ← Whiskers
    ╲ ◉ ◉ ◉ ◉ ◉ ╱
      ╲ ◉ ◉ ◉  ╱
       ╰───────╯
```

**In-Game:** Fierce appearance with radial gradient
- Large mane (40px radius)
- Detailed facial features
- Whiskers on sides
- Majestic look

---

### 🐺 WOLF
```
     ╭─────────╮
     │ △ ▲ △   │  ← Ears (sharp)
    ╱│ ◉ ◉     │╲
   │ ╰─────────╯ │
   │ ▼▼▼ ║ ▼▼▼  │  ← Eyes (intense)
   │ ╭─────────╮ │
   │ │ Snout   │ │
   │ │  ◯ ▼   │ │  ← Nose & mouth
   │ ╰─────────╯ │
   │ ─ ─ ─ ─ ─ ─ │  ← Whiskers
    ╲ │       │ ╱
     ╰─────────╯
```

**In-Game:** Tactical, intense appearance
- Sharp pointed ears
- Intense eye reflections
- Narrow snout design
- Dark, professional look

---

### 💣 BOMB
```
       ╭───╮
       │ * │  ← Spark
       │╱│╲│
       ║ ║ ║
      ╭╯ ║ ╰╮
     ╱   ║   ╲  ← Fuse
    │  ◯ ║ ◯  │
    │    ║    │
    │ ◯   ◯   │  ← Details/Dents
     ╲       ╱
      ╰─────╯
```

**In-Game:** Explosive appearance
- Round bomb body with gradient
- Curved fuse at top
- Sparks for dynamic look
- Yellow highlights
- Most unique design

---

### ⭐ STAR
```
        ╱╲
       ╱  ╲
      │    │
     ╱      ╲
    │   ▲    │  ← Point (top)
   ╱╲   ║   ╱╲
  │  │  ║  │  │
  │  │  ║  │  │
  │  │  │  │  │  ← Five Points
   ╲  ╲ │ ╱  ╱
    │  ╰╫╯  │
     ╲      ╱
      │    │
       ╲  ╱
        ╲╱
```

**In-Game:** Bright, magical appearance
- Five perfect points
- Gradient fill
- Inner shine layer
- Glowing quality

---

### ❤️ HEART
```
    ╭─╮      ╭─╮
    │◯│─────│◯│
    ╰─╯  ◯  ╰─╯   ← Two lobes with center shine
      ╲    ╱
       ╲  ╱
        ╲╱
        │ │
        │ │ │
        │ │ │ │
        │ │ │ │
         ╲│ │╱
          ╰─╯
```

**In-Game:** Friendly, romantic design
- Classic heart shape
- Curved top lobes
- Pointed bottom
- Shine highlight
- Warm appearance

---

### ● CIRCLE (Default)
```
       ╭─────╮
      │◯ ◯   │
      │      │  ← Radial gradient
      │   ◯  │
       ╰─────╯
```

**In-Game:** Simple, classic design
- Perfect circle
- Radial gradient (light to dark)
- Bright highlight
- Minimalist style

---

## 🎯 In-Game Appearance

### Red Horse Example:
```
Screen Display (no background):
                    ▲
                    │
        ──────────  │  ──────────
       │            │            │
       │   [🐴]  ──┼──  [🐴]    │
       │    RED    │    DARK    │ ← Color gradient
        ──────────  │  ──────────
                    ▼
```

### Token Stack (Multiple on Same Cell):
```
        ┌─────────────┐
        │  [🐴] ┌─┐  │
        │   GREEN └┘  │  ← Offset position
        │     ┌──[🐴] │
        │     │ RED   │
        └─────┴───────┘
```

### Valid Move Highlight:
```
        ┏━━━━━━━┓
        ┃       ┃
        ┃  [🐴] ┃  ← Glowing border
        ┃ WHITE ┃
        ┗━━━━━━━┛
       (Pulsing animation)
```

---

## 🎨 Color Palette

### Red Player
```
Light:  #EF5350 ███ (top of shape)
Main:   #E53935 ███ (body)
Dark:   #B71C1C ███ (outline/bottom)
```

### Green Player
```
Light:  #66BB6A ███ (top of shape)
Main:   #43A047 ███ (body)
Dark:   #1B5E20 ███ (outline/bottom)
```

### Blue Player
```
Light:  #42A5F5 ███ (top of shape)
Main:   #1E88E5 ███ (body)
Dark:   #0D47A1 ███ (outline/bottom)
```

### Yellow Player
```
Light:  #FFEE58 ███ (top of shape)
Main:   #FDD835 ███ (body)
Dark:   #F57F17 ███ (outline/bottom)
```

---

## 🎪 Token Animations

### Roll Animation
```
Frame 1: [🐴] ← normal
Frame 2: ◯ 🐴  ← scale up + shadow
Frame 3: [🐴] ← return to normal
```

### Valid Move Pulse
```
Ring animation:
  ○ [🐴] ○    (1.0x - start)
        ↓
 ◉  [🐴]  ◉   (1.4x - expand)
        ↓
  ○ [🐴] ○    (1.0x - contract)
        ↓
(Repeat infinite)
```

### Hover Effect
```
  [🐴]   →    [🐴]   (scale 1.0 → 1.1)
(Normal)     (Hover)
```

---

## 📊 Shape Complexity Comparison

| Shape | Paths | Gradients | Details | Visual Impact |
|-------|-------|-----------|---------|--------------|
| Circle | 2 | 1 | Simple | Clean |
| Heart | 1 | 1 | Highlight | Warm |
| Star | 2 | 1 | Inner shine | Bright |
| Bomb | Multiple | 1 | Fuse & sparks | Unique |
| Wolf | Many | 1 | Eyes & ears | Sharp |
| Lion | Many | 1 | Mane & whiskers | Majestic |
| Horse | Many | 1 | Mane & tail | Professional |

---

## 🎯 Selection Preview in Menu

When choosing token shape, players see:
```
┌────────────────────────────────────┐
│  Select Your Token Shape           │
├────────────────────────────────────┤
│  (●)  (🐴)  (🦁)                   │
│Circle Horse  Lion                  │
│                                    │
│  (🐺)  (💣)  (⭐)                   │
│Wolf   Bomb    Star                 │
│                                    │
│  (❤️)                              │
│Heart                              │
└────────────────────────────────────┘
```

Note: Preview uses emoji (from TOKEN_SHAPES)
Actual gameplay uses custom SVG shapes

---

## 🎮 Gameplay Recognition

### Quick Identification
- **Horse:** "I see the knight" → Easy to spot
- **Lion:** "Look at that mane!" → Most distinctive
- **Wolf:** "That's intimidating" → Sharp appearance
- **Bomb:** "Going to boom!" → Most unique
- **Star:** "So shiny!" → Bright colors
- **Heart:** "It's friendly" → Welcoming
- **Circle:** "The simple one" → Classic

### Competitive Advantage
- Horse: Fast, knight-like
- Lion: Powerful defender
- Wolf: Tactical hunter
- Bomb: Explosive player
- Star: Lucky player
- Heart: Team player
- Circle: Neutral choice

---

## 🎨 Future Customization Options

Planned features:
- [ ] Custom user-designed shapes
- [ ] Animated shapes (tails move)
- [ ] Texture patterns on shapes
- [ ] 3D effects
- [ ] Seasonal variants
- [ ] Tournament skins
- [ ] Holiday special shapes

---

## 📝 Technical Details

### SVG Viewbox
All shapes use: `viewBox="0 0 100 100"`
- Allows perfect scaling
- Easy coordinate system
- Consistent sizing

### Scaling Factors
- Normal token: 5.8% of board
- Stacked token: 4.6% of board
- Scales responsively on mobile/desktop

### Gradient Types
- **Linear:** Used for most shapes (light to dark)
- **Radial:** Used for circle (center glow)
- Both use player colors

### Effects
- Drop shadow (always)
- Glow (when selected)
- Pulse ring (valid moves)
- Hover scale (interactive)

---

**All shapes are professional, colorful, and ready for epic LUDO gameplay!** ♞🦁🐺💣⭐❤️●

# UI Guidelines

## Design Direction

Theme name: SaarthiOS Design Theme

Mood:
Dark, editorial, enterprise, warm. Similar to a Bloomberg terminal with an art-school visual direction.

The UI should feel premium, calm, technical, and serious. Avoid generic blue SaaS styling.

---

## Color Tokens

Default dark theme:

| Token | Hex | Usage |
|---|---|---|
| --bg | #1a1613 | Page background |
| --ink | #ede8e1 | Primary text |
| --muted | #7a7068 | Secondary text and captions |
| --dim | #231e1b | Cards and secondary surfaces |
| --g | #f2a384 | Primary accent, CTAs, highlights |
| --g-glow | #f2a38466 | Accent glow and borders |
| --teal | #77c3c0 | Secondary accent |
| --amber | #d4903c | Tertiary accent |
| --red | #c94a3a | Destructive states and alerts |
| --border | #ffffff1a | Borders |

Light variant:
- data-theme="indigo"
- background: #f5f2eb
- primary: #0f2a47

---

## Typography

### Display Font
Cormorant Garamond
- Used for large headings
- font-weight: 300
- line-height: 0.96
- letter-spacing: -0.03em
- size: clamp(42px, 5vw, 68px)

### UI and Body Font
DM Sans
- Used for body text, buttons, navigation, tables, forms
- weights: 300 to 500

### Mono Font
Space Mono
- Used for section tags, labels, technical callouts
- text-transform: uppercase
- letter-spacing: 0.2em
- font-size: 10px

---

## Component Rules

### Section Tag
Class: .s-tag
- font-family: Space Mono
- color: #f2a384b3
- letter-spacing: 0.2em
- text-transform: uppercase
- font-size: 10px

### Section Heading
Class: .s-h
- font-family: Cormorant Garamond
- font-weight: 300
- letter-spacing: -0.03em
- line-height: 0.96

### Glass Card
Class: .glass-card
- background: #ffffff0d
- border: 1px solid #ffffff14
- border-radius: 16px
- backdrop-filter: blur(12px)
- use subtle warm gradient overlay where appropriate

### Primary CTA
Class: .btn-g
- background: #f2a384
- color: #1a1613
- border-radius: 2px
- min-width: 220px
- min-height: 52px
- hover: translateY(-2px)
- hover shadow: 0 8px 32px #f2a38459

### Ghost Button
Class: .btn-ghost
- no background
- no border
- colored text only

### Outline CTA
Class: .ncta
- font-family: Space Mono
- color: #f2a384
- border: 1px solid #f2a38466
- border-radius: 2px
- subtle glow animation on hover

---

## Layout Rules

All protected pages must use:
- Persistent sidebar
- Top header
- Main content area
- Role-aware navigation

Dashboard cards should use the glass-card style.

Buttons should use sharp 2px radius.

Cards should use 16px radius.

Do not use generic blue SaaS colors.

---

## Backgrounds

Hero and dashboard backgrounds may use:
- radial-gradient mesh with peach and teal at low opacity
- 64px by 64px grid overlay
- mask gradient fading toward edges

---

## Animation

Use subtle animations only.

Reveal animation:
- opacity 0 to 1
- translateY(24px) to 0
- transition: 0.3s cubic-bezier(0.16, 1, 0.3, 1)

Brand live pulse dot:
- keyframe name: breathe
- scale(0.75)
- opacity: 0.55 at 50%

Avoid excessive animation in dashboards.
> تصور تصميمي تاريخي؛ مراجعة الواجهات البصرية ما زالت مطلوبة. راجع AUDIT.md للحالة الحالية.

# Daleel: Egyptian Luxury DMC Design & Smoothness Specification

> **Aesthetic Direction:** Egyptian Luxury Destination Management Company (Warm Sand, Nile Slate, and Gold)  
> **Motion Style:** Subtle & Executive (Calm 150ms transitions, understated elegance, zero jitter)

---

## 1. Executive Motion Architecture & Interaction System

To deliver a high-velocity, executive experience tailored to inbound tour operators and high-volume DMCs, all animations are calibrated to **150ms** with zero spring bounce or playful wobble. Every transition feels crisp, intentional, and authoritative.

### Motion Token Constants (`src/lib/motion.ts`)

| Token | Duration | Cubic-Bezier Curve | Rationale |
| :--- | :--- | :--- | :--- |
| **Instant** | `80ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Micro-feedback (button tap, chip toggle) |
| **Micro** | `120ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Fast exits, dropdown menus, badge reveal |
| **Executive** | `150ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | **Platform Standard** (modal enter, tab switch) |
| **Smooth** | `200ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Height-locked container expansion |

---

## 2. Modal Dialog Presentation & Smoothness Anatomy

Modals utilize the unified `ExecutiveModal` component (`src/components/common/ExecutiveModal.tsx`) built on `motion/react`:

### Key Capabilities
1. **Backdrop Layer (`modalBackdropVariants`)**:
   - `initial`: `opacity: 0`, `backdrop-filter: blur(0px)`
   - `animate`: `opacity: 1`, `backdrop-filter: blur(3px)`
   - Duration: 150ms with ease-out decel curve.
2. **Dialog Surface (`modalDialogVariants`)**:
   - `initial`: `opacity: 0`, `scale: 0.985`, `y: 8px`
   - `animate`: `opacity: 1`, `scale: 1.0`, `y: 0px`
   - `exit`: `opacity: 0`, `scale: 0.985`, `y: 6px`
   - Acceleration: Fast initial entry with calm settlement (no oscillatory bounce).
3. **Accessibility & Usability Guardrails**:
   - `Escape` key listener closes the modal cleanly.
   - Backdrop click detection with `e.stopPropagation()` on content.
   - Body scroll lock during modal active lifecycle.
   - `useReducedMotion()` gracefully degrades all animations to instant opacity crossfades.

---

## 3. Page & Tab Transitions (Zero Layout Shift)

Tab switching across the application is governed by `TabTransitionWrapper` (`src/components/TabTransitionWrapper.tsx`):

1. **Height-Locking Technique**:
   - Before swapping tabs, the container measures `containerRef.current.offsetHeight`.
   - The outer wrapper locks to that exact pixel height, preventing layout jumps when new content streams in.
   - An 80ms timeout smoothly unlocks the height after the new tab completes its initial paint.
2. **Content Variant**:
   - Swaps in with `y: 4px` micro-slide and `opacity: 0 -> 1` in 150ms.
   - Exit is instant (`opacity: 0`, `y: -4px`) to make switching feel instantaneous to operators.

---

## 4. Visual Palette & Egyptian DMC Design System

### Core Palette Tokens

```css
/* Background & Surfaces */
--surface-canvas:      #F9F7F2; /* Warm Egyptian desert sand */
--surface-card:        #FAF8F5; /* Refined limestone card surface */
--surface-white:       #FFFFFF; /* Elevated data containers */

/* Egyptian Luxury Gold Accents */
--accent-gold-primary: #C5A059; /* Muted Nile Gold */
--accent-gold-light:   #E6C673; /* Radiant highlight */
--accent-gold-dark:    #99772B; /* High-contrast text gold */
--accent-gold-subtle:  #FAF3E0; /* Warm gold chip fill */
--accent-gold-border:  #EADBB8; /* Delicate gold border */

/* Nile Deep Slate & Inks */
--ink-deep-slate:      #0F172A; /* Deep Nile midnight navy */
--ink-header-navy:     #111827; /* Executive card header */
--ink-muted-slate:     #475569; /* Primary descriptive text */
--ink-border-limestone:#E5DECF; /* Architectural border separator */
```

### Zero-Pill Discipline
- **Status Badges & Tags**: Rounded rectangles (`rounded-lg` or `rounded-sm`) with 1px border. Never generic circular pill capsules.
- **Card Enclosures**: Crisp `rounded-2xl` for primary viewports; `rounded-xl` for nested modules.
- **Table Layouts**: Strict `tabular-nums` on all currency, day numbers, Pax counts, and margin percentages.

---

## 5. Micro-Interactions & Hover Feedback (`src/index.css`)

### Button Micro-Press
```css
button, a {
  transition-property: color, background-color, border-color, opacity, box-shadow, transform;
  transition-duration: var(--duration-executive); /* 150ms */
  transition-timing-function: var(--ease-executive);
}

button:active:not(:disabled) {
  transform: scale(0.985); /* Calm tactile feedback */
}
```

### Executive Card Hover Elevation
```css
.executive-card {
  transition-property: transform, box-shadow, border-color, background-color;
  transition-duration: 150ms;
  transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, box-shadow;
}

.executive-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px -6px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(197, 160, 89, 0.12);
  border-color: rgba(197, 160, 89, 0.55);
}
```

---

## 6. High-Impact Feature Enhancements

### 1. WhatsApp & Email Inquiry Fast-Parser
- Modal accessible from both **Quotes Pipeline** and **Quote Builder**.
- Instant regex heuristic extraction + Gemini AI parser.
- Pre-loaded with realistic Egyptian DMC scenarios:
  - *Luxury Nile Cruise FIT Couple* (8 Days, USD 4,500)
  - *Family Pyramids & Red Sea Resort* (10 Days, EUR 5,000)
  - *B2B Wholesale Group (8 Pax)* (10 Days, agent commission)
- 1-click conversion directly into the Quote Builder with itinerary lines and pricing.

### 2. Interactive Visual Itinerary Timeline
- Replaces plain text blocks in `ProposalViewer.tsx`.
- **Spine & Medallion Nodes**: Continuous gold track with circular numbered badges (`01`, `02`, `03`...).
- **Destination Filtering**: Instant filter chips (`All Days`, `Cairo`, `Luxor`, `Aswan`, `Hurghada`).
- **Landmark Badges**: Automatic recognition of Giza Pyramids, Grand Egyptian Museum, Karnak, Valley of the Kings, Philae, Abu Simbel, etc.
- **Service Tags**: Private Egyptologist guide badges, meal markers (`B`, `L`, `D`), and transfer mode indicators (Flight, Mercedes Van, Nile Cruise, Felucca).
- **Print Optimization**: Automatically formats for crisp A4 portrait PDF generation with page-break protection.

# Design System & UI Specification: Naam Uzhavar (நாம் உழவர்)

> **Document Type:** Production Design Specification & System Reference  
> **Target Audience:** UI/UX Engineers, Design Systems Architects, and AI Review Engines (ChatGPT, Claude, v0, Lovable, Stitch, Cursor)  
> **Platform:** Responsive Web Application (Desktop, Tablet, Mobile)  
> **Domain:** Direct Agricultural & Commercial Produce Marketplace (Tamil Nadu, India)

---

## 1. Visual Theme & Atmosphere

* **Design Philosophy:** **"Modern Agritech Precision meets High-End Procurement."** The interface abandons rustic, low-fi clichés in favor of a crisp, institutional, and dependable visual standard. It balances organic earthiness (for the farmer and public facing screens) with high-trust commercial fintech precision (for commercial hotel, supermarket, and bulk buyers).
* **Atmospheric Spectrum:**
  * **Density:** `Daily App Balanced (5/10)` for public landing and auth; `Cockpit Dense (7.5/10)` for the commercial buyer dashboard (tabular crop lists, order tracking timelines, inventory metrics).
  * **Variance:** `Offset Asymmetric (6/10)` — avoids dull symmetric grids. Features 50/50 split authentication screens, asymmetric hero banners, and staggered dashboard telemetry.
  * **Motion Intensity:** `Calm (3/10)` — short colour and border transitions only; no lifting, bouncing or pulsing effects.
* **Surface Treatment:** Clean, matte layers using soft warm-paper neutrals (`#F6F6F2`, `#FFFFFF`), 1px border dividers (`#E3E3DD`) and very light shadows. No gradients, glass or glow effects.

---

## 2. Color Calibration & Palette Roles (Revision 2 – Calm & Matte)

**Colour rules:** (1) Muted, natural tones only - no neon, no glossy or saturated "UI-kit" colours. (2) One accent colour per module so users always know where they are. (3) Colour never carries meaning alone - every status has an icon + text label. (4) All text/background pairs meet WCAG AA (4.5:1) or better.

### 2.1 Module Colour Map
| Module | Accent | Why this colour |
| :--- | :--- | :--- |
| Public Landing / Brand | Leaf Green `#2F6B3A` | Agriculture, freshness, trust |
| Farmer Portal | Leaf Green `#2F6B3A` | Growth, harvest, "my farm" |
| Commercial Buyer Dashboard (shell, buttons, nav, forms) | Steel Blue `#2B5C8A` | Business, procurement, reliability, calm for long daily use |
| Crop Marketplace (produce tags, "Farmer Direct") | Leaf Green on tinted badge only | Product freshness without changing the blue action colour |
| Logistics / Driver Portal | Earth Ochre `#8F5A12` | Road, dust, transport - readable in bright sunlight |
| Orders / Track / Messages / Profile | Buyer Blue + semantic status colours (2.5) | Consistent navigation, status carries the meaning |

### 2.2 Farmer & Public Palette (Green)
| Token | Hex | Role |
| :--- | :--- | :--- |
| `--primary-900` | `#1E4A29` | Headings on tint, pressed state |
| `--primary-700` | `#265A31` | Hover state, emphasis text |
| `--primary-600` | `#2F6B3A` | Primary buttons, links, brand mark (6.4:1 with white) |
| `--primary-200` | `#CFE3D2` | Borders on tinted areas |
| `--primary-100` | `#EAF3EC` | Badge and success-banner fills |
| `--primary-50` | `#F3F8F4` | Hero / card wash (replaces bright mint) |

### 2.3 Commercial Buyer Palette (Steel Blue)
| Token | Hex | Role |
| :--- | :--- | :--- |
| `--buyer-primary` | `#2B5C8A` | Primary buttons, active nav, focus ring (7.0:1 with white) |
| `--buyer-primary-hover` | `#234B71` | Hover state |
| `--buyer-primary-active` | `#1C3D5D` | Pressed state |
| `--buyer-accent-subtle` | `#E8EFF6` | Active sidebar item, selected row, info badge fill |
| `--buyer-accent-border` | `#C5D5E5` | Selected card outline, input focus border |
| `--buyer-accent-text` | `#2B5C8A` | Links and metadata (6.0:1 on tint) |

### 2.4 Logistics Palette (Ochre) & Neutrals
| Token | Hex | Role |
| :--- | :--- | :--- |
| `--driver-primary` | `#8F5A12` | Driver primary buttons, active nav (5.8:1 with white) |
| `--driver-hover` | `#764A0E` | Hover state |
| `--driver-tint` | `#F8F0E3` | Driver badge / highlight fill |

| Token | Hex | Role |
| :--- | :--- | :--- |
| `--neutral-900` | `#1F2933` | Headings and body text (never pure black) |
| `--neutral-700` | `#4B5563` | Secondary text, table headers, labels (7.6:1) |
| `--neutral-500` | `#667085` | Helper text, timestamps (5.0:1 on white) |
| `--neutral-400` | `#9CA3AF` | Placeholder, disabled icons (decorative only) |
| `--neutral-200` | `#E3E3DD` | Borders, dividers |
| `--neutral-100` | `#EEEEE9` | Secondary fills, disabled inputs |
| `--neutral-50` | `#F6F6F2` | Page canvas (soft warm paper, less cold than slate) |
| `--white` | `#FFFFFF` | Cards, modals, dropdowns |

### 2.5 Semantic Status Colours (shared by all modules)
| Status | Text | Fill | Border | Icon |
| :--- | :--- | :--- | :--- | :--- |
| Success / Delivered | `#2F6B3A` | `#EAF3EC` | `#CFE3D2` | `CheckCircle2` |
| Info / In-Transit | `#2B5C8A` | `#E8EFF6` | `#C5D5E5` | `Truck` |
| Pending / In Review | `#7A5200` | `#FAF1DA` | `#EBD9A8` | `Clock` |
| Error / Cancelled | `#B42318` | `#FCEBE9` | `#F3C6C1` | `AlertCircle` |
| Price per kg | `#1F2933` bold (no orange) | - | - | - |

> Removed from the old palette: `#22C55E` leaf green, `#F97316` pumpkin orange, `#F59E0B` bright amber, `#F0F9FF` ice blue, `#0369A1` sky blue. They were too saturated for long, daily use and clashed with each other on one screen.

---

## 3. Typography Architecture & Bilingual Rules

The typography is built from the ground up to support seamless bilingual rendering for **English** and **Tamil**, maintaining legibility, preventing script clipping, and enforcing typographic hierarchy.

### 3.1 Font Family Stacks
* **English / Primary Font:** `'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`
  * Clean, geometric, contemporary neo-grotesque with warm, human terminal endings.
* **Tamil Script Font:** `'Noto Sans Tamil', 'Mukta Malar', 'Plus Jakarta Sans', system-ui, sans-serif`
  * Specially calibrated for Tamil vowel diacritics (கொ, ளை, றி) without vertical glyph truncation.
* **Monospace / Numerical Data:** `'JetBrains Mono', 'Fira Code', monospace`
  * Used for vehicle registration plates, order tracking IDs (`#ORD-9821`), GSTIN numbers, and price calculations.

### 3.2 Tamil Anti-Clipping Directives
* When `lang="ta"` is active on the HTML root or element:
  * Minimum `line-height: 1.65` across all body copy and form elements.
  * Padding top/bottom on buttons and inputs must have at least `2px` extra headroom to prevent vertical diacritic clipping.
  * Never apply `overflow: hidden` directly to inline text containers with Tamil text.

### 3.3 Type Scale & Hierarchy
| Level | Font Size (Desktop) | Font Size (Mobile) | Weight | Line Height | Letter Spacing |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Hero** | `2.75rem` (44px) | `2.00rem` (32px) | Bold (700/800) | 1.15 | `-0.025em` |
| **Page Title (H1)** | `2.00rem` (32px) | `1.65rem` (26px) | Bold (700) | 1.25 | `-0.02em` |
| **Section Title (H2)**| `1.50rem` (24px) | `1.30rem` (21px) | SemiBold (600) | 1.30 | `-0.015em` |
| **Card Header (H3)** | `1.15rem` (18px) | `1.10rem` (17px) | SemiBold (600) | 1.35 | `0` |
| **Body (Default)** | `0.95rem` (15px) | `0.90rem` (14px) | Regular (400) | 1.60 | `0` |
| **Caption / Meta** | `0.80rem` (13px) | `0.75rem` (12px) | Medium (500) | 1.50 | `+0.01em` |
| **Badge / Micro** | `0.72rem` (11.5px) | `0.70rem` (11px) | SemiBold (600) | 1.20 | `+0.03em` |

---

## 4. Layout Principles & Spacing Matrix

* **Max Width Container:** Centered `1320px` max-width (`Container fluid="xl"`) for marketing pages; full fluid layout (`100%`) with restricted internal max-bounds for the commercial dashboard.
* **Spacing Scale (Base 4px/8px):**
  * `4px` (xxs) | `8px` (xs) | `12px` (sm) | `16px` (md) | `24px` (lg) | `32px` (xl) | `48px` (2xl) | `64px` (3xl)
* **Corner Radius Tokens:**
  * `--radius-sm`: `6px` (Badges, tags, inner chips)
  * `--radius-md`: `8px` (Input fields, primary/secondary buttons)
  * `--radius-lg`: `12px` (Cards, dialog containers, dropdowns)
  * `--radius-xl`: `16px` (Hero banners, split-screen hero panels)
  * `--radius-full`: `9999px` (Pills, user avatars, status dots)
* **Shadow Architecture:**
  * **Card Shadow:** `0 1px 2px rgba(31, 41, 51, 0.06)`
  * **Hover Shadow:** `0 2px 8px rgba(31, 41, 51, 0.08)`
  * **Modal / Dropdown:** `0 8px 24px rgba(31, 41, 51, 0.16)`
  * *Constraint:* Never use colored neon outer glows. Shadows use the neutral ink colour at low opacity.

---

## 5. Master Component Specifications

### 5.1 Buttons (`Button.jsx`)
* **Primary Variant:**
  * Fill: module accent - `--buyer-primary` (`#2B5C8A`), `--primary-600` (`#2F6B3A`) or `--driver-primary` (`#8F5A12`)
  * Color: Pure White (`#FFFFFF`)
  * Height: `44px` minimum (touch standard); `48px` on mobile forms.
  * Border Radius: `--radius-md` (`8px`)
  * States:
    * Hover: switch to the module's hover colour. No movement.
    * Active: switch to the module's pressed colour.
    * Loading: Integrated spinner with disabled pointer events.
* **Secondary / Outline Variant:**
  * Background: Pure White (`#FFFFFF`)
  * Border: `1.5px solid #E3E3DD`
  * Text Color: `--neutral-900` (`#1F2933`)
  * Hover: Background `#F6F6F2`, border `#9CA3AF`.
* **Ghost / Destructive Variant:**
  * Red border (`#F3C6C1`), fill (`#FCEBE9`), text (`#B42318`).

### 5.2 Cards (`Card.jsx`)
* **Base Card:**
  * Background: `#FFFFFF`
  * Border: `1px solid var(--neutral-200)` (`#E3E3DD`)
  * Border Radius: `12px` (`--radius-lg`)
  * Padding: Responsive `16px` (mobile) to `24px` (desktop)
  * Hover Behavior: border darkens to `#9CA3AF` and the Hover Shadow appears over `150ms ease`. No lift or movement.

### 5.3 Form Inputs (`Input.jsx`)
* **Structure:** Label cleanly positioned above input; helper text or error state below.
* **Input Box:**
  * Height: `46px`
  * Border: `1.5px solid #D5D5CE` (slightly darker than card borders so the field is easy to find)
  * Background: `#FFFFFF`
  * Text: `#1F2933` (15px)
  * Focus State: Border switches to the module accent (buyer `#2B5C8A`) with ring `0 0 0 3px rgba(43, 92, 138, 0.18)`.
  * Error State: Border `#B42318` with ring `0 0 0 3px rgba(180, 35, 24, 0.15)` and an error message with icon below the field.

### 5.4 Modals & Drawers (`Modal.jsx`, `Offcanvas`)
* Backdrop: flat dim overlay `background-color: rgba(31, 41, 51, 0.50);` (no blur).
* Card Body: Floating centered container with `max-width: 520px`, `--radius-lg` (`12px`), and zero overflow leaks.
* Responsive: On screens `< 576px`, modals convert to bottom sheet layout with rounded top corners (`12px 12px 0 0`).

### 5.5 Badges & Status Indicators (`Badge.jsx`)
* **Success / Delivered:** Background `#EAF3EC`, Text `#2F6B3A`, 1px border `#CFE3D2`, icon `CheckCircle2`
* **In-Transit / Active:** Background `#E8EFF6`, Text `#2B5C8A`, 1px border `#C5D5E5`, icon `Truck`
* **Pending / In Review:** Background `#FAF1DA`, Text `#7A5200`, 1px border `#EBD9A8`, icon `Clock`
* **Error / Cancelled:** Background `#FCEBE9`, Text `#B42318`, 1px border `#F3C6C1`, icon `AlertCircle`
* **Farmer Direct / Organic:** Background `#F3F8F4`, Text `#265A31`, 1px border `#CFE3D2`, icon `Sprout`
* Always show icon + text label; never rely on colour alone.

---

## 6. Page-by-Page Architectural Blueprint

### 6.1 Public Landing Page (`HomePage.jsx`)
1. **Header Navigation:**
   * Sticky top bar with solid white background and a 1px bottom border (`#E3E3DD`). No blur or transparency.
   * Brand Logo (`Naam Uzhavar` with botanical sprout icon).
   * Bilingual Pill Switcher (`English` / `தமிழ்`) with instant locale toggle.
   * Action: "Portal Login / உள்நுழைக" triggering role selection.
2. **Hero Section (Asymmetric Split):**
   * **Left (55%):** Pill badge with live counter ("Direct from 1,200+ TN Farmers"), High-impact headline ("Fresh Harvest Directly to Your Commercial Kitchen & Shelves"), bulleted trust assurances (Zero commission middlemen, Guaranteed 24hr harvest-to-doorstep delivery, Fair farmer pricing).
   * **Right (45%):** Floating interactive Produce Preview Card (Showing live crates of Ooty Carrots, Dindigul Shallots, Pollachi Tender Coconuts with live market pricing and freshness timestamps).
3. **Role Gateway Cards (3-Column Asymmetric):**
   * **Farmer (விவசாயி):** Green theme (`#2F6B3A`), Sell directly at fair prices, instant UPI payouts.
   * **Commercial Buyer (வணிக வாங்குபவர்):** Steel blue theme (`#2B5C8A`), Bulk procurement, certified quality grading, verified GST invoices.
   * **Logistics Partner (ஓட்டுநர்):** Ochre theme (`#8F5A12`), Reliable regional haul trips, diesel allowances, immediate trip settlements.

### 6.2 Role Selection Screen (`RoleSelectPage.jsx`)
* Clean focused modal layout with back button to home.
* Prominently displays official Tamil Nadu Agriculture Department toll-free helpline (`1800-180-1551`).
* Instant direct routing to Commercial Buyer login/register while providing lightweight callback modal triggers for Farmers and Drivers.

### 6.3 Buyer Authentication Screens (`BuyerLogin.jsx` & `BuyerRegister.jsx`)
* **Desktop 50/50 Balanced Split Architecture:**
  * **Left Showcase Panel (50%):** Solid deep-green panel (`#1E4A29`) with white text - no grid mesh or gradient. Displays high-resolution commercial procurement imagery, verified badges (APEDA, FSSAI, GST compliant), and customer testimonials from top Tamil Nadu hotel chains and retail co-ops.
  * **Right Authentication Form (50%):** Pristine white card container containing:
    * Language toggle header (`EN` / `தமிழ்`).
    * Clear back navigation button.
    * Dual phone/email identification input with live input masking and validation.
    * Password field with SVG eye toggle and secure keyboard submission (`Enter` key handler).
    * Remember Me checkbox + Forgot Password modal.
    * Quick demo credential buttons (`Hotel Buyer`, `Supermarket Sourcing`) for zero-friction evaluation.
    * Seamless toggle to Registration (`BuyerRegister.jsx`) with multi-step business verification (GSTIN, Business License, Delivery Hub location).

### 6.4 Commercial Buyer Dashboard (`BuyerDashboardLayout.jsx` + Subpages)
* **Master Shell:**
  * Left desktop sidebar (`260px` fixed width) with active route indicator bar and badge count chips.
  * Top bar with mobile hamburger menu, live market notification bell, language switch, and Buyer profile dropdown.
  * Mobile bottom navigation bar for quick one-thumb switching (`Overview`, `Crops`, `Orders`, `Track`, `Profile`).
* **Sub-Screens:**
  1. **Overview (`Overview.jsx`):** 4 Metric Cards (Active Shipments, Monthly Produce Volume, Net Savings vs Mandi, Carbon Offset) + Live Order Timeline + Recommended Fresh Harvests.
  2. **Crop Marketplace (`Crops.jsx`):** Produce search with category tabs (Vegetables, Fruits, Tubers, Greens, Organic) + High-density produce cards showing farmer origin district (e.g., *Thovalai, Kanyakumari*), harvest date, available quintals, price tiers, and instant "Procure / Order" modal.
  3. **Order Management (`Orders.jsx`):** Tabbed order list (`All`, `Pending Confirmation`, `Dispatched`, `Delivered`). Includes one-click GST invoice download, reorder actions, and direct dispute resolution.
  4. **Live GPS Tracking (`Track.jsx`):** Step-by-step dispatch milestone tracker (Harvest Packed -> Quality Graded -> Vehicle Dispatched -> Arriving at Hub). Driver photo, phone call trigger, and simulated vehicle route ETA.
  5. **Direct Messages (`Messages.jsx`):** Farmer-to-buyer negotiation channel. In-line counter-offer requests, produce photo attachments, and language-translated chat bubbles.
  6. **Business Profile (`Profile.jsx`):** KYC verification status (FSSAI license, verified GSTIN), business entity details, delivery warehouse addresses, and commercial credit limits.

---

## 7. Motion & Interaction Standards

* **Engine:** Hardware-accelerated CSS Transitions & Transforms (GSAP compatible).
* **Spring Physics Parameters:**
  * Hover & Popovers: `transition: background-color, border-color 0.15s ease`
  * Offcanvas Drawer: `transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)`
* **Active Press Feedback:** Interactive elements confirm a press through a colour change only (pressed token). No movement.
* **Loading Micro-Interactions:**
  * Use skeleton wave shimmers matching the exact card or table dimensions (`animation: skeleton-pulse 1.5s ease-in-out infinite`).
  * Never use generic full-screen blocking spinners.

---

## 8. Anti-Patterns & Strict AI Directives (What NEVER to Do)

When testing, reviewing, or generating screens for this application, the following patterns are **STRICTLY FORBIDDEN**:

1. **NO Emojis as UI Icons:** Never use emojis (🌾, 🚜, 📦, 🚚, ❌) for interface controls. Always use clean Lucide SVG icons (`Sprout`, `Truck`, `PackageCheck`, `AlertCircle`, `CheckCircle2`).
2. **NO Glossy / Neon / Gradient Styling:** No gradients, glass blur, glows or highly saturated colours; keep every surface flat and matte. Also no purple/violet "AI" aesthetic.
2b. **NO AI "Purple/Neon" Cyberpunk Aesthetic:** Do not add purple button glows, violet gradient borders, or dark neon backgrounds. This is a grounded, high-trust agritech & B2B procurement platform.
3. **NO Pure Black (`#000000`):** Always use deep charcoal (`#1F2933`) for text and dark surfaces to eliminate harsh optical glare.
4. **NO Default Generic Fonts:** Never revert to unstyled browser fallbacks or standard `Inter` clones. Always respect `'Plus Jakarta Sans'` paired with `'Noto Sans Tamil'`.
5. **NO Clipped Tamil Glyphs:** Tamil script characters with upper/lower modifiers must never be cut off by aggressive fixed heights or `overflow: hidden`.
6. **NO Generic Cards-Inside-Cards Nesting:** Avoid three layers of box nesting. Distinguish sections using clean border-top dividers, white space, and typographic scale.
7. **NO Cluttered Form Floats:** Input fields must have clear persistent labels positioned above inputs—no floating labels that disappear or jump awkwardly during autocomplete.
8. **NO Touch Targets Under 44px:** All buttons, dropdown toggles, and drawer triggers must be at least `44px × 44px` for seamless mobile operation by logistics drivers and field buyers.

---

## 9. Prompt Guide for Evaluating this Design in Another AI

Copy and paste the prompt below into another AI (e.g., **Claude 3.7 Sonnet**, **GPT-4o**, **v0.dev**, or **Google Stitch**) alongside this document to review or generate matching interfaces:

```markdown
You are a Staff Principal Design Systems Engineer and Senior Frontend Architect.
Review the attached DESIGN.md specification for the "Naam Uzhavar" agricultural marketplace.

Please evaluate the design against modern high-end B2B SaaS and agritech standards on the following criteria:
1. Color Contrast & WCAG 2.1 AA/AAA compliance across both the Earthy Agricultural and Commercial Buyer palettes.
2. Bilingual script rendering integrity (specifically English + Tamil diacritics and typographic rhythm).
3. Usability and hierarchy of the 50/50 split authentication and high-density dashboard layouts.
4. Identification of any generic AI UI slop or anti-patterns.
5. Provide 3 concrete suggestions for micro-interaction polish or design token refinements that would elevate the perceived quality to enterprise-grade (comparable to Stripe, Linear, or Watershed).
```

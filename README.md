# நாம் உழவர் | Naam Uzhavar ("We are Farmers")

> Direct agricultural marketplace connecting **Farmers**, **Buyers**, and **Delivery Drivers** without middlemen across Tamil Nadu.

![Naam Uzhavar Logo](/logo.jpg)

---

## 📁 Beginner-Friendly Folder Structure

This project has been intentionally organized so that anyone new to React can quickly navigate and understand where files live:

```text
src/
  main.jsx            # Entry point of the React application
  App.jsx             # Top-level routing and LanguageProvider wrapper
  routes.js           # Centralized route paths (ROUTES.HOME, ROUTES.BUYER_DASHBOARD, etc.)
  
  pages/              # Full-screen pages (each with its paired .css file)
    HomePage.jsx
    HomePage.css
    RoleSelectPage.jsx
    RoleSelectPage.css
    BuyerLogin.jsx
    BuyerLogin.css
    BuyerRegister.jsx
    BuyerRegister.css
    buyer/            # Sub-pages rendered inside the Buyer Dashboard
      Overview.jsx
      Overview.css
      Crops.jsx
      Crops.css
      Orders.jsx
      Orders.css
      Track.jsx
      Track.css
      Messages.jsx
      Messages.css
      Profile.jsx
      Profile.css

  components/         # Reusable UI building blocks and layout shells
    Button.jsx
    Card.jsx
    Input.jsx
    Modal.jsx
    Badge.jsx
    Skeleton.jsx
    EmptyState.jsx
    SectionHeader.jsx
    Navbar.jsx
    Footer.jsx
    CropCard.jsx
    CropModals.jsx
    EditProfileModal.jsx
    BuyerDashboardLayout.jsx
    BuyerDashboardLayout.css
    ProtectedRoute.jsx

  context/            # Shared React Contexts
    LanguageContext.jsx   # Global bilingual state ('en' | 'ta')
    BuyerContext.jsx      # Commercial buyer marketplace state & active data

  hooks/              # Custom React Hooks
    useT.js               # Translation hook for bilingual dictionary lookups

  i18n/               # Bilingual translation dictionaries
    en.json               # English translations
    ta.json               # Tamil translations

  data/               # Static seed / mock data
    mockData.js           # Sample produce listings, orders, and chats

  utils/              # Pure helper functions
    helpers.js            # Formatters for price, date, units

  styles/             # Global styling
    global.css            # Custom CSS variables, typography, animations
    custom.scss           # Bootstrap 5 theme overrides and utilities
```

---

## 💡 The Core Rule for Organizing Files

When adding new files or features, follow this simple rule:

> **"Full screen -> `pages/`, Reusable piece -> `components/`"**

- If something represents an entire page or view with its own URL route, put it in `src/pages/` (or `src/pages/buyer/` for dashboard views) alongside its `.css` file.
- If something is a reusable button, card, header, modal, layout shell, or widget used inside pages, put it in `src/components/`.

---

## 🚀 How to Run the Project

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 3. Check Bilingual Translation Parity
To verify that all 455 keys in `en.json` and `ta.json` stay 100% in sync:
```bash
npm run i18n:check
```

### 4. Build for Production
```bash
npm run build
```

---

## 🌟 Key Features

- **🌐 Full Bilingual Support**: Native Tamil (`தமிழ்`) as primary language with instant toggle to English (`ENG`).
- **📱 Fully Responsive**: Fluid across mobile phones, tablets, laptops, and ultra-wide desktops.
- **🔊 Accessibility & Text-to-Speech**: Built-in audio narration in Tamil and English for users with low literacy.
- **🎨 High-Contrast & Outdoor-Friendly**: Earthy green and harvest gold palette optimized for outdoor sunlight visibility (WCAG AA/AAA compliant).
- **🔒 Protected Routes**: Guest routes for login/registration and auth guards for the commercial buyer dashboard.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite
- **UI Components**: React-Bootstrap 5 + Bootstrap 5 SCSS
- **Routing**: React Router v7
- **Icons**: Lucide React
- **Internationalization**: Custom lightweight bilingual hook (`useT`) with zero runtime overhead

---

## 📄 License

This project is licensed under the MIT License.

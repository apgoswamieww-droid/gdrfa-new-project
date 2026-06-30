# GDRFA Landing Page - Project Summary

## Overview

**Project Name:** GDRFA Sports Portal  
**Package:** `gdrfa-app` v0.0.0  
**Type:** React + Vite SPA (Single Page Application)

GDRFA (Gulf Defense & Rescue Forces Association) Sports Portal is a bilingual (English/Arabic) landing/marketing page for the GDRFA employee wellness and sports program platform. It showcases sports events, facilities, fitness evaluation data, and provides login/authentication for employees.

---

## Tech Stack

| Category | Library |
|---|---|
| Framework | React 19 |
| Bundler | Vite 8 |
| Styling | TailwindCSS 4 (Vite plugin) |
| Routing | React Router DOM 7 |
| State | Zustand 5 (with persist middleware) |
| i18n | i18next + react-i18next |
| Carousel | Swiper 12 |
| Fonts | JUSTSans (custom local fonts) |
| Linting | ESLint 9 |

---

## Project Structure

```
gdrfa-landing-page/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/
│   │   ├── fonts/          JUSTSans font variants (.woff/.ttf/.eot)
│   │   └── images/         PNG images & SVG icons
│   │       └── icons/      SVG icons (logo, arrows, etc.)
│   ├── components/
│   │   ├── Banner/
│   │   │   └── BannerWrapper.tsx
│   │   ├── Chart/
│   │   │   └── CustomChart.tsx
│   │   ├── common/
│   │   │   └── PrimaryBtn.tsx
│   │   ├── Footer/
│   │   │   └── Footer.tsx
│   │   ├── Header/
│   │   │   ├── Header.tsx
│   │   │   ├── LanguageToggle.tsx
│   │   │   └── NavLinkItem.tsx
│   │   └── section/
│   │       ├── AccordionSec.tsx
│   │       ├── AllEventSec.tsx
│   │       ├── BodyFitnessEvaluation.tsx
│   │       ├── EvaluationCertificatesSec.tsx
│   │       ├── GlimpseSportsActivitieSec.tsx
│   │       ├── HorizontalLine.tsx
│   │       └── MediaKnowledgeSec.tsx
│   ├── data/
│   │   ├── mediaKnowledge.ts
│   │   ├── notifications.ts
│   │   └── sportsEvents.ts
│   ├── locales/
│   │   └── i18n.ts          i18n config with EN/AR translations
│   ├── pages/
│   │   ├── Auth/
│   │   │   ├── ForgotPassword.tsx
│   │   │   ├── Login.tsx
│   │   │   └── Profile.tsx
│   │   ├── Home/
│   │   │   └── index.tsx
│   │   ├── MediaKnowledge/
│   │   │   ├── MediaKnowledgeDetail.tsx
│   │   │   └── MediaKnowledgeList.tsx
│   │   └── SportsEvents/
│   │       ├── SportsEventDetail.tsx
│   │       └── SportsEventList.tsx
│   ├── router/
│   │   └── router.tsx          Route definitions
│   ├── store/
│   │   └── store.ts          Zustand auth & splash stores
│   ├── types/
│   │   ├── store.typ..ts
│   │   └── swiper-css.d.ts
│   ├── utils/
│   │   ├── FadeIn.tsx
│   │   ├── HeaderFooterWrapper.tsx
│   │   └── ScrollContext.tsx
│   ├── App.tsx
│   ├── index.css             Global CSS + Tailwind imports
│   └── main.tsx             Entry point
├── index.html
├── package.json
├── tsconfig.json            References tsconfig.app.json & tsconfig.node.json
├── vite.config.ts
├── eslint.config.js
└── tailwind.config        (via Vite plugin, not separate file)
```

---

## Routes

| Path | Component | Description |
|---|---|---|
| `/` | `HomePage` | Landing page with all sections |
| `/login` | `Login` | Login form (no header/footer) |
| `/forgot-password` | `ForgotPassword` | Password reset request |
| `/profile` | `Profile` | User profile page |
| `/sport-activity-list` | `SportsEventList` | Event listing with filters |
| `/sport-activity-list/:eventId` | `SportsEventDetail` | Single event detail |
| `/media-knowledge` | `MediaKnowledgeList` | Blog & media listing with category filters |
| `/media-knowledge/:id` | `MediaKnowledgeDetail` | Blog/media article detail with reading progress |

---

## Pages & Components

### HomePage (`src/pages/Home/index.tsx`)
Assembles the full landing page from 8 sections:
1. **BannerWrapper** - Hero banner with navigation
2. **AllEventSec** - Events list with year tabs + all/my toggle
3. **HorizontalLine** - Section divider
4. **BodyFitnessEvaluation** - Swiper-based fitness evaluation cards with chart
5. **EvaluationCertificatesSec** - Certificate showcase section
6. **HorizontalLine**
7. **AccordionSec** - Sports facilities accordion
8. **HorizontalLine**
9. **MediaKnowledgeSec** - Media/knowledge content
10. **HorizontalLine**
11. **GlimpseSportsActivitieSec** - Sports activity gallery

### Header (`src/components/Header/Header.tsx`)
- Logo + responsive navigation menu
- Language toggle (EN/AR)
- Notification bell with dropdown
- User avatar + logout (when logged in)
- Login button (when logged out)
- Mobile hamburger menu
- Body scroll lock when menu open
- Smooth scroll to section anchors

### Footer (`src/components/Footer/Footer.tsx`)
- Multi-column grid layout
- Contact info (phone + email)
- Social media icons
- Navigation links
- CMS page links
- Back to top button
- Copyright bar
- Large branded background text

### SportsEventList (`src/pages/SportsEvents/SportsEventList.tsx`)
- Filter by status: All / On Going / Upcoming
- Filter by category: All, Cycling, Running, Yoga, Football, Fitness, Swimming
- Responsive grid card layout
- Animated background icons

### SportsEventDetail (`src/pages/SportsEvents/SportsEventDetail.tsx`)
- Event image hero
- Event metadata (date, venue, participants, category)
- Register interest CTA button

### Login (`src/pages/Auth/Login.tsx`)
- Two-column layout: hero stats + form
- Username/password fields
- Remember me checkbox
- Forgot password link
- Show/hide password toggle
- Demo login (mock auth with Zustand)

### BodyFitnessEvaluation (`src/components/section/BodyFitnessEvaluation.tsx`)
- Swiper carousel with centered slides
- Auto-play every 25 seconds
- Active slide highlighted in primary card
- CustomChart embedded in active card
- RTL support for Arabic

### AccordionSec (`src/components/section/AccordionSec.tsx`)
- Numbered accordion (4 sports facilities)
- Expand/collapse with content reveal
- Image + description in expanded state
- Request CTA button per item

### AllEventSec (`src/components/section/AllEventSec.tsx`)
- All Events / My Events tab toggle
- Year selector (2026 down to 2018)
- Month dropdown filter
- Grid of event cards (3 columns)
- Responsive (2 cols on small, 1 on mobile)

---

## State Management (Zustand)

### useAuthStore (`src/store/store.ts`)
- `user` - User object
- `token` / `accessToken` - Auth tokens
- `fcmToken` - Firebase push token
- `currentLanguage` - "en" | "ar" | string
- `setUser`, `setToken`, `setAccessToken`, `setFCMToken`, `setCurrentLanguage`
- `removeAll` - Logout action
- **Persistence**: Smart storage adapter (session vs local based on `rememberMe` flag)

### useSplashStore
- `showedSplashScreen` boolean

---

## i18n Configuration (`src/locales/i18n.ts`)

- **Languages**: `en`, `eng` (alias), `ar`
- **Storage key**: `gdrfa-language` in localStorage
- **Fallback**: `en`
- **Translation scope**: UI labels, login, forgot password, notifications, profile sections

### Language Toggle
Stored in localStorage as `gdrfa-language`. RTL mode enabled when `currentLanguage === "ar"`.

---

## Styling System

### TailwindCSS 4
- Custom color tokens (`primary`, `secondary`, `white`, `red-light`, etc.)
- Custom spacing scale (`max-w-341.5`, `min-w-4`, etc.)
- Font family: `JUSTSans` (local custom font)
- Custom border radius (`rounded-3xl`, `rounded-[60px]`, etc.)

### CSS (`src/index.css`)
- Tailwind base + components
- Custom `@font-face` declarations for JUSTSans
- Responsive grid pattern classes (`sports-detail-grid`, `sports-clip`)
- Animation keyframes (`login-stat`, `login-orbit`)

---

## Data Files

### sportsEvents (`src/data/sportsEvents.ts`)
Typed array of 6 mock events:
- Ride for Wellness - Cycling Day
- Wellness Week - Jog & Mindfulness
- Wellness Week - Yoga & Mindfulness
- Inter Department Football Cup
- Fitness Evaluation Open Day
- Swimming Endurance Challenge

### notifications (`src/data/notifications.ts`)
Typed notification entries with `type`, `title`, `message`, `time`, `unread`.

---

## Build & Dev Scripts

```bash
npm run dev          # Vite dev server
npm run build      # TypeScript build + Vite build
npm run lint       # ESLint
npm run preview    # Vite preview of dist
```

---

## Key Features Summary

- **Bilingual**: Full EN/AR with RTL support
- **Responsive**: Mobile-first, breakpoints sm/md/lg/xl/2xl
- **Auth-ready**: Zustand store with token persistence (session-aware)
- **Swiper carousel**: Auto-playing fitness evaluation cards
- **Blog/Article system**: Media & Knowledge listing + detail pages with reading progress bar
- **Custom fonts**: JUSTSans loaded locally
- **Custom chart**: Canvas-based performance chart
- **Smooth scroll**: Section-based scroll navigation
- **Scroll lock**: Mobile menu overlay disables body scroll
- **Notification bell**: Dropdown with unread count
- **Body fitness evaluation**: Running, Cycling, Body Fitness slides with chart

---

## Notes

- API calls are **mocked** — no real backend integration in this frontend package
- `sportsEvents` data is static mock data in `src/data/sportsEvents.ts`
- Auth login creates a demo token; no real credential validation
- `tsconfig.app.json` and `tsconfig.node.json` are referenced via `tsconfig.json`
- `node_modules` is NOT committed (standard Vite + React project)
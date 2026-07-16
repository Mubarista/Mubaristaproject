# MUBARISTA

The world's leading online platform for baristas — combining premium education, career development, global networking, and international latte art competitions.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion
- **Backend:** Express.js (Node.js)
- **Database:** Firebase Firestore
- **Auth:** Firebase Authentication
- **Storage:** Firebase Storage
- **Hosting:** Vercel / Firebase Hosting

## Features

- Premium landing page with cinematic hero, stats, winners, testimonials, FAQ
- Online latte art competitions with full application & payment flow
- Learning Center (free + premium gated content)
- Barista Books & Tools marketplace (premium)
- Barista Jobs board (premium)
- Coffee Schools directory (free)
- Interactive Coffee History timeline
- Legend Baristas gallery
- Participant, Judge, and Admin dashboards
- Dark/Light mode with premium glassmorphism UI
- Role-based access control

## Getting Started

### Frontend

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Backend API

```bash
cd server
npm install
npm run dev
```

API runs on [http://localhost:4000](http://localhost:4000)

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your Firebase credentials:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## Color Palette

- Blue `#2563EB` — Primary
- Green `#16A34A` — Success
- Yellow `#EAB308` — Gold accent
- Red `#DC2626` — Alerts
- Black `#0A0A0A` — Dark mode
- White `#FAFAF8` — Light mode

## Payment Methods

- MoMoPay Rwanda
- VPay
- DusuPay
- Visa / Mastercard / Credit Card

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
├── components/           # UI components
├── data/                 # Mock data
├── lib/                  # Utilities, Firebase, Auth
└── types/                # TypeScript types
server/                   # Express API
```

## License

Private — MUBARISTA Platform

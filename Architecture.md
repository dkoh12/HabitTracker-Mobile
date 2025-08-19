Auth Architecture

┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │    │   Mobile App    │
│                 │    │                 │
│ NextAuth.js     │    │ JWT Tokens      │
│ Sessions        │    │ Authorization   │
│ Cookies         │    │ Headers         │
└─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────┐
│          Your Web App Backend           │
│                                         │
│  /api/auth/*          /api/mobile/auth/*│
│  (NextAuth.js)        (Custom JWT)     │
│  Sessions             JWT Tokens        │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│    Database     │
│  (Same Users)   │
└─────────────────┘


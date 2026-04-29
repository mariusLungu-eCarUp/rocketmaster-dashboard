# Rocketmaster Dashboard

Internal support operations tool for eCarUp EV charging platform.

## Overview

Rocketmaster Dashboard is a web application that enables support staff to manage:
- Charging stations
- Drivers (users)
- RFID cards
- Car IDs
- Licenses and permissions
- Active charging sessions

## Prerequisites

- Node.js (v18+)
- npm

## Installation

```bash
npm install
```

## Development

Start the development server with different environments:

```bash
# Default (points to ecarup.com)
npm start

# Local backend (localhost:57657)
ng serve -c local

# Staging backend (staging.ecarup.com)
ng serve -c staging

# Production backend (ecarup.com)
ng serve -c production
```

The application will be available at `http://localhost:4200`

## Build

Build for different environments:

```bash
# Production build
npm run build

# Staging build
ng build -c staging

# Local build
ng build -c local

# Development build with watch mode
npm run watch
```

## Tech Stack

- **Framework:** Angular 21 (standalone components)
- **State Management:** Angular Signals
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide icons
- **Backend API:** ecarup.com

## Authentication

The application uses basic authentication with credentials stored in sessionStorage. Access requires the `access-rocketmaster-feature` flag on the user account.

## Environments

- **Development:** Points to `https://www.ecarup.com`
- **Staging:** Points to `https://staging.ecarup.com`
- **Production:** Points to `https://www.ecarup.com`
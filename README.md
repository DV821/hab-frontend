# HAB-Frontend

**Frontend Application for HAB (Harmful Algal Bloom) Detection**

This project is a tiered Next.js frontend web app for visualizing and predicting harmful algal blooms (HAB) using both geospatial data and image uploads.

---

## Features

- **Tier-based Access**
  - **Free Users**
    - Access real-time and historical HAB predictions using geospatial data.
  - **Tier 1 & Tier 2 Users**
    - All features available to Free users, plus the ability to upload images for HAB detection.

- **Technology Stack**
  - Built with **Next.js** (React) and **TypeScript**
  - Styled using **Tailwind CSS**
  - Custom React hooks, utilities, and components for modularity
  - Docker integration for consistent environment setup

---

## Contents

```
├── app/              # Next.js app pages and routing
├── components/       # Reusable UI components
├── hooks/            # Custom hooks (e.g. authentication, data fetching)
├── lib/              # Utility functions and API clients
├── public/           # Static assets (icons, images, etc.)
├── styles/           # Global and component-specific styles (Tailwind configs)
├── types/            # TypeScript type definitions
├── Dockerfile        # Container setup
├── .dockerignore     # Files to ignore when building Docker image
├── next.config.mjs   # Next.js configuration
├── package.json      # NPM dependencies and scripts
├── tailwind.config.ts# Tailwind CSS configuration
└── tsconfig.json     # TypeScript configuration
```

---

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm
- Docker (optional, for containerized development)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/DV821/hab-frontend.git
   cd hab-frontend
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

### Running in Development
```bash
npm run dev
```
Open `http://localhost:3000` in your browser to see the app.

---

## Docker Setup (Optional)

Build and run in a container:

```bash
docker build -t hab-frontend .
docker run -p 3000:3000 hab-frontend
```

This ensures a consistent runtime environment across different systems.

---

## Usage Overview

- **Free Tier**
  - Navigate to the geospatial prediction card
  - Enter location inputs (e.g., coordinates) and date to get HAB risk visualization

- **Tier 1 & Tier 2**
  - Upload images (e.g., water samples/photo evidence)
  - App processes images and provides HAB detection results (that can also be downloaded)

- **Account Management**
  - Sign up/log in
  - Subscription tier is fetched and enforced on the frontend
  - Can request for financial aid if the user wants to upgrade their subscription which will be approved by admin

---

## Project Structure Insights

| Directory     | Purpose                                                         |
|---------------|-----------------------------------------------------------------|
| `components/` | UI components such as forms, charts, maps, image uploaders      |
| `hooks/`      | Custom React hooks (e.g., useAuth, usePredictions, useUpload)   |
| `lib/`        | API wrappers, configuration utilities, geospatial helpers       |
| `styles/`     | Tailwind utility classes or CSS modules and themes              |
| `types/`      | Shared TypeScript interfaces (e.g., `User`, `PredictionResult`)  |

---

## Contributing

Feel free to open issues or submit pull requests:
- If you're adding features: clearly state your tier/update and reasoning
- For bug fixes: please include reproduction steps and screenshots if possible

---

## Related Repositories

This project works in coordination with the following backend services:

- **User Service Backend** (Authentication, Tier Management):  
  [sagar-rsh/hab-backend](https://github.com/sagar-rsh/hab-backend)

- **Prediction and Detection Backend** (Geospatial Prediction & Image Detection):  
  [danieli1245/Harmful-Algal-Bloom-Detection-System](https://github.com/danieli1245/Harmful-Algal-Bloom-Detection-System)

These services power the logic behind user management and HAB detection features used in this frontend app.
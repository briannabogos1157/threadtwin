# ThreadTwin Frontend

The frontend application for ThreadTwin, a fashion dupe finder that helps users find similar clothing items based on fabric composition, fit, and construction details.

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Axios

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file with:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
frontend/
├── public/          # Static files
├── src/
│   ├── components/  # Reusable React components
│   ├── pages/       # Next.js pages
│   └── styles/      # Global styles and Tailwind CSS
├── package.json
└── tsconfig.json
```

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:3001) 
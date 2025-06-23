# ThreadTwin - AI-Powered Fashion Dupe Finder

ThreadTwin is a web application that helps users find affordable alternatives (dupes) to luxury fashion items using AI technology.

## Features

- Search for luxury fashion items and get affordable alternatives
- AI-powered analysis of product similarities
- Detailed comparison between original items and dupes
- User submission of dupe suggestions
- Admin dashboard for managing dupe submissions

## Tech Stack

### Frontend
- Next.js 15.3
- React
- TypeScript
- Tailwind CSS

### Backend
- Node.js
- Express
- TypeScript
- OpenAI API
- SerpApi for product search
- Supabase for database

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key
- SerpApi key

### Environment Setup

1. Create `.env` files in both frontend and backend directories:

```env
# Backend .env
PORT=3002
OPENAI_API_KEY=your_openai_key
SERP_API_KEY=your_serp_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Frontend .env
NEXT_PUBLIC_API_URL=http://localhost:3002
```

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd ThreadTwin
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd backend
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3002

## Project Structure

```
ThreadTwin/
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js pages and API routes
│   │   ├── components/   # React components
│   │   └── styles/       # CSS styles
│   └── public/           # Static assets
└── backend/
    └── src/
        ├── routes/       # API routes
        ├── services/     # Business logic
        ├── controllers/  # Request handlers
        └── models/       # Data models
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. # trigger redeploy

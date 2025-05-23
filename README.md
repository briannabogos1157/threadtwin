# ThreadTwin

ThreadTwin is a fashion dupe finder web application that helps users find similar clothing items based on fabric composition, fit, care instructions, and construction details.

## Features

- Product URL analysis
- Fabric composition matching
- Construction comparison
- Fit analysis
- Care instructions matching
- Weighted similarity scoring
- Responsive design
- Real-time results

## Tech Stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: Node.js, PostgreSQL
- ORM: Prisma
- Deployment: Vercel
- Domain: GoDaddy

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/briannabogos1157/threadtwin.git
cd threadtwin
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file with:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/threadtwin?schema=public"
```

4. Run database migrations
```bash
npx prisma migrate dev
```

5. Start the development server
```bash
npm run dev
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/) 
# QuickBase - Hono + Prisma + Zod Backend Template

A modern TypeScript backend template using Hono.js for routing, Prisma for database operations, and Zod for validation.

## Setup

```
npx create-quickbase
```

## Project Structure

```
src/
├── index.ts             # Entry point
├── routes/
│   └── v1.ts            # API routes for version 1
├── controllers/         # Logic for routes
│   └── [controller].ts  # Controller classes
├── middleware/          # Custom middleware
│  └── userAuth.ts       # User authentication middleware
└── prisma/
    └── schema.prisma    # Prisma schema
```

## Best Practices

1. Always validate request data using Zod schemas
2. Keep controllers focused on business logic
3. Use Prisma for all database operations
4. Maintain API versioning for backwards compatibility
5. Write clear error messages and use proper status codes

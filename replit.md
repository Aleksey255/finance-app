# Workspace

## Overview

Personal Finance Manager — full-stack fintech app with Node.js/Express backend, PostgreSQL database, and React + MUI dark-theme frontend.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, MUI (Material UI), Recharts, dark theme
- **Routing**: Wouter
- **Data fetching**: TanStack React Query (generated hooks)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── finance-app/        # React + MUI frontend (at /)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/
└── ...
```

## Features

- **Dashboard**: Total balance, monthly income/expense, charts
- **Transactions**: CRUD with filters, receipt upload placeholder
- **Accounts**: Multiple accounts (cash, card, wallet, savings, investment)
- **Categories**: Custom categories with color/icon, income/expense/both types
- **Budgets**: Monthly budget per category with progress bars
- **Goals**: Financial savings goals with progress tracking
- **Recurring**: Recurring transactions (salary, rent, subscriptions)
- **Analytics**: Charts - line, bar, pie; monthly trend, category breakdown
- **Calendar**: Financial calendar with transactions by date
- **Export**: CSV export of transactions

## Default Data

- 13 default expense/income categories (seeded)
- 2 default accounts: Наличные (cash), Карта (card)

## API Routes

- `GET/POST /api/accounts`
- `GET/POST /api/transactions`
- `GET/POST /api/categories`
- `GET/POST /api/budgets`
- `GET/POST /api/goals`, `POST /api/goals/:id/contribute`
- `GET /api/analytics/summary|by-category|monthly-trend|daily-average|export`
- `GET/POST /api/recurring`
- `POST /api/transfers`
- `GET /api/calendar`

## DB Schema

Tables: `accounts`, `categories`, `transactions`, `budgets`, `goals`, `recurring_transactions`, `transfers`

## Codegen

Run: `pnpm --filter @workspace/api-spec run codegen`

## DB Push

Run: `pnpm --filter @workspace/db run push`

# Centralized API Integration Architecture

This directory establishes the foundational HTTP communication layer for DailyOS. It provides a scalable, type-safe, and decoupled architecture designed to seamlessly integrate backend APIs without coupling UI components directly to HTTP details or ad-hoc fetch requests.

---

## 1. Architectural Layers

The architecture is organized into strict, decoupled layers:

```
UI Components / Hooks (src/features/*)
       │
       ▼
Service Layer / React Hooks (useApiQuery, useApiMutation, src/services/*)
       │
       ▼
Feature Repositories (src/api/repositories/*)
       │
       ▼
Generic Base Repository (BaseRepository)
       │
       ▼
HTTP Client (httpClient, Axios instance, interceptors, tokenManager)
       │
       ▼
Backend API Server (Express / REST)
```

### Directory Structure

```
src/api/
├── config/
│   ├── env.config.ts        # Central environment configs (base URL, timeouts, storage keys)
│   ├── endpoints.ts         # Centralized endpoint URI registry
│   └── index.ts
├── client/
│   ├── httpClient.ts        # Typed Axios client wrapper (get, post, put, patch, delete)
│   ├── interceptors.ts      # Request/response interceptors, timezone, and token refresh queue
│   ├── tokenManager.ts      # Access/refresh token lifecycle and storage management
│   ├── apiError.ts          # Normalized ApiError class (status, validation issues, network errors)
│   └── index.ts
├── types/
│   ├── common.types.ts      # Generic primitives (PaginatedResponse, PaginationMeta, QueryParams)
│   └── index.ts
├── utils/
│   ├── queryParams.ts       # Query parameter serialization and cleaning
│   ├── responseParser.ts    # Envelope unwrapping and safe parsing helpers
│   └── index.ts
├── repositories/
│   ├── base.repository.ts   # Abstract base repository with typed HTTP methods
│   ├── auth.repository.ts   # Auth & session API repository stub
│   ├── habits.repository.ts # Habits & schedules API repository stub
│   ├── tasks.repository.ts  # Tasks & recurrences API repository stub
│   ├── finance.repository.ts# Finance & investments API repository stub
│   ├── ...                  # Other feature repositories matching domain modules
│   └── index.ts
├── hooks/
│   ├── useApiQuery.ts       # Reusable React hook for GET queries (loading, error, data, refetch)
│   ├── useApiMutation.ts    # Reusable React hook for mutations (mutate, loading, error, success)
│   └── index.ts
├── README.md                # This architecture documentation
└── index.ts                 # Clean public API barrel export
```

---

## 2. Configuration & Environment Variables

Environment variables are defined with standard Vite `import.meta.env` conventions:

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:5000/api` | Base URL for all API requests |
| `VITE_API_TIMEOUT_MS` | `15000` | Default timeout for HTTP requests (ms) |

To customize for local development, create a `.env.local` file:
```bash
VITE_API_BASE_URL=http://localhost:5000/api
VITE_API_TIMEOUT_MS=15000
```

---

## 3. Convention for Integrating New Feature APIs

When integrating a new backend feature/module, follow this systematic 5-step process:

### Step 1: Register Endpoints in `src/api/config/endpoints.ts`
Add endpoint paths under the corresponding domain namespace:
```typescript
export const ENDPOINTS = {
  HABITS: {
    BASE: '/habits',
    DETAIL: (id: string) => `/habits/${id}`,
    LOGS: (id: string) => `/habits/${id}/logs`,
  },
  // ...
};
```

### Step 2: Define Request & Response Models in `src/api/types/`
Create or extend feature types using TypeScript interfaces without importing UI components:
```typescript
// Example: src/api/types/habits.types.ts
export interface CreateHabitRequest {
  name: string;
  category: string;
  target?: number;
}

export interface HabitResponse {
  id: string;
  name: string;
  category: string;
  target?: number;
  createdAt: string;
}
```

### Step 3: Implement Repository in `src/api/repositories/`
Extend `BaseRepository` and use the protected HTTP helper methods (`this.get`, `this.post`, `this.put`, `this.delete`):
```typescript
// Example: src/api/repositories/habits.repository.ts
import { BaseRepository } from './base.repository';
import { ENDPOINTS } from '../config/endpoints';
import type { CreateHabitRequest, HabitResponse } from '../types/habits.types';
import type { PaginatedResponse, PaginationParams } from '../types/common.types';

export class HabitsRepository extends BaseRepository {
  async getHabits(params?: PaginationParams): Promise<PaginatedResponse<HabitResponse>> {
    return this.get<PaginatedResponse<HabitResponse>>(ENDPOINTS.HABITS.BASE, params);
  }

  async createHabit(data: CreateHabitRequest): Promise<HabitResponse> {
    return this.post<HabitResponse>(ENDPOINTS.HABITS.BASE, data);
  }

  async getHabitById(id: string): Promise<HabitResponse> {
    return this.get<HabitResponse>(ENDPOINTS.HABITS.DETAIL(id));
  }
}

export const habitsRepository = new HabitsRepository();
```

### Step 4: Add Business Logic in the Service Layer (if applicable)
If a feature requires local caching, data aggregation, or transformations before reaching UI components, place that in `src/services/<feature>.service.ts`.

### Step 5: Consume in UI via Hooks or Services
Use `useApiQuery` for data loading and `useApiMutation` for updates:
```tsx
import { useApiQuery, useApiMutation } from '@/api';
import { habitsRepository } from '@/api/repositories/habits.repository';

export function HabitsList() {
  const { data, isLoading, error, refetch } = useApiQuery(
    () => habitsRepository.getHabits({ page: 1, limit: 20 })
  );

  const { mutate: addHabit, isLoading: isCreating } = useApiMutation(
    (newHabit) => habitsRepository.createHabit(newHabit),
    {
      onSuccess: () => refetch(),
    }
  );

  if (isLoading) return <div>Loading habits...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.data.map((habit) => (
        <li key={habit.id}>{habit.name}</li>
      ))}
    </ul>
  );
}
```

---

## 4. Error Handling (`ApiError`)

All HTTP errors are automatically intercepted and normalized into an `ApiError` instance:

```typescript
try {
  await habitsRepository.createHabit(data);
} catch (error) {
  if (error instanceof ApiError) {
    if (error.isValidationError) {
      // Access specific field errors:
      const nameError = error.getFieldError('name');
      console.error('Validation issue:', nameError);
    } else if (error.isUnauthorized) {
      console.warn('Session expired');
    } else if (error.isNetworkError) {
      console.warn('User is offline');
    }
  }
}
```

---

## 5. Authentication & Token Management

- Tokens are held by `tokenManager` (`src/api/client/tokenManager.ts`).
- Access tokens are automatically included in the `Authorization: Bearer <token>` header of every outgoing request.
- Client IANA time zone is attached automatically via `X-Timezone` header.
- Token refresh is concurrency-safe: when multiple requests encounter `401 Unauthorized` simultaneously, only one refresh request is dispatched while others queue until the new token arrives.

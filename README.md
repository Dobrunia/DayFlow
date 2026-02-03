# DayFlow

## Локальная разработка

**БД (Docker):**

```bash
cd server && npm run docker:up
```

Поднимает MySQL на `localhost:3306`. Без `.env` сервер подставит `dayflow:dayflow@localhost:3306/dayflow`.

**Схема БД:**

```bash
cd server && cp .env.example .env && npm run db:push
```

Применяет Prisma-схему к базе (для Prisma нужен `.env`).

**Сервер:**

```bash
cd server && npm run dev
```

GraphQL на `http://localhost:4000/graphql`.

**Клиент:**

```bash
cd client && npm run dev
```

Фронт на `http://localhost:5173`, проксирует `/graphql` на сервер.

---

Итого: в двух терминалах — `server`: `docker:up` → `db:push` → `dev`; `client`: `dev`.

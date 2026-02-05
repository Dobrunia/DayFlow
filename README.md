# DayFlow

Персональный органайзер знаний: воркспейсы, карточки (заметки, ссылки, чеклисты), трекинг прогресса.

## Стек

**Клиент:** Vue 3, Vite, UnoCSS, Apollo Client, Pinia, Radix Vue, Vue Router  
**Сервер:** Node.js, GraphQL Yoga, Prisma, MySQL  
**Общее:** TypeScript, Zod, monorepo (shared)

## Возможности

- **Воркспейсы** — доски для тем/проектов с колонками и беклогом
- **Карточки** — три типа: заметка, ссылка (с превью), чеклист
- **Хаб (библиотека)** — все карточки пользователя без привязки к воркспейсу
- **Drag & Drop** — перетаскивание карточек между колонками
- **Поиск** — по заголовкам и тегам (Ctrl+K — быстрое добавление)
- **Статистика** — публичная страница `/user/:id` с прогрессом по воркспейсам
- **Темы** — светлая / тёмная (localStorage)
- **Авторизация** — email + пароль, httpOnly cookie сессия

<!-- ## Структура -->

```
├── client/          # Vue 3 SPA
│   ├── src/
│   │   ├── components/   # card/, common/, workspace/
│   │   ├── views/        # Home, Auth, Library, Workspace, Profile, UserStats
│   │   ├── stores/       # Pinia: auth, workspace, cards, theme
│   │   ├── graphql/      # queries, mutations, types
│   │   └── lib/          # apollo, utils
│   └── public/
├── server/          # GraphQL API
│   ├── src/
│   │   ├── resolvers/    # auth, workspace, column, card, user-stats
│   │   ├── schema/       # schema.graphql
│   │   └── lib/          # prisma, auth, context, errors
│   └── prisma/           # schema.prisma
└── shared/          # Общие типы и схемы (Zod)
```

## Локальная разработка

**1. БД (Docker):**
```bash
cd server && npm run docker:up
```

**2. Применить схему:**
```bash
cd server && cp .env.example .env && npm run db:push
```

**3. Сервер:**
```bash
cd server && npm run dev
```
→ GraphQL: `http://localhost:4000/graphql`

**4. Клиент:**
```bash
cd client && npm run dev
```
→ Фронт: `http://localhost:5173` (проксирует `/graphql`)

## Переменные окружения

**server/.env:**
```
DATABASE_URL=mysql://dayflow:dayflow@localhost:3306/dayflow
SESSION_SECRET=your-secret
CORS_ORIGINS=http://localhost:5173
```

**client/.env (prod):**
```
VITE_GRAPHQL_URL=https://api.example.com/graphql
```

## Деплой

- **Фронт:** GitHub Actions → FTP (ветка `front-prod`)
- **Бэк:** GitHub Actions → SSH + Docker (ветка `back-prod`)

Итого: в двух терминалах — `server`: `docker:up` → `db:push` → `dev`; `client`: `dev`.

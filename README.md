# DayFlow

Персональный органайзер знаний: воркспейсы, карточки (заметки, ссылки, чеклисты), инструменты, трекинг обучения и прогресса.

## Стек

**Клиент:** Vue 3, Vite, UnoCSS, Apollo Client, Pinia, Radix Vue, Vue Router  
**Сервер:** Node.js, GraphQL Yoga, Prisma, MySQL  
**Общее:** TypeScript, Zod, monorepo (shared)

## Возможности

- **Воркспейсы** — доски для тем/проектов с колонками и беклогом
- **Карточки** — три типа: заметка, ссылка (с превью), чеклист
- **Хаб (библиотека)** — все карточки пользователя без привязки к воркспейсу
- **Инструменты** — ссылки/ресурсы, привязанные к воркспейсу или хабу; поиск по названию и тегам
- **Теги** — фильтрация и навигация по тегам карточек
- **Обучение** — три статуса: «повторить», «остались вопросы», «углубить»; отдельные вью с группировкой по воркспейсам
- **Drag & Drop** — перетаскивание карточек между колонками
- **Поиск** — по заголовкам и тегам (Ctrl+K — быстрое добавление)
- **Скрытие выполненных** — кнопка-глазик в колонке, состояние хранится в БД
- **Сворачивание секций** — в обучении и инструментах секции по воркспейсам сворачиваются
- **Статистика** — публичная страница `/user/:id` с прогрессом по воркспейсам
- **7 тем оформления** — Light, Dark, Old Money, Nord, Solarized Dark, Full Moon, Old Money 2
- **Авторизация** — email + пароль, httpOnly cookie сессия

## Структура

```
├── client/          # Vue 3 SPA
│   ├── src/
│   │   ├── components/   # card/, common/, workspace/, toolbox/
│   │   ├── views/        # Home, Auth, Library, Workspace, Profile,
│   │   │                 # UserStats, Tags, Tools, Learning
│   │   ├── composables/  # useCardActions, useCardForm, useInlineEdit
│   │   ├── stores/       # Pinia: auth, workspace, cards, theme
│   │   ├── graphql/      # queries, mutations, types
│   │   └── lib/          # apollo, graphql-error, constants, utils
│   └── public/
├── server/          # GraphQL API
│   ├── src/
│   │   ├── resolvers/    # auth, workspace, column, card, tool, user-stats
│   │   ├── schema/       # schema.graphql
│   │   └── lib/          # prisma, auth, context, errors, constants
│   └── prisma/           # schema.prisma
└── shared/          # Общие типы и ErrorCodes (dayflow-shared)
```

## Модели данных

| Модель | Описание |
|--------|----------|
| **User** | email, пароль (argon2), аватар |
| **Session** | httpOnly cookie сессии |
| **Workspace** | доска с колонками, карточками и инструментами; пин |
| **Column** | колонка воркспейса; порядок, скрытие выполненных |
| **Card** | заметка / ссылка / чеклист; теги, статус обучения, порядок |
| **Tool** | инструмент (ссылка + описание + иконка + теги) |

## Обработка ошибок

- Сервер: все ошибки создаются через `lib/errors.ts` → `UnauthenticatedError`, `NotFoundError`, `ForbiddenError`, `BadRequestError`, `InternalError`, `RateLimitExceededError`
- Общие коды ошибок в `shared/types.ts` → `ErrorCodes`
- Клиент: `lib/graphql-error.ts` → `getGraphQLErrorMessage()` извлекает код и человекочитаемое сообщение
- Все ошибки показываются через `toast.error()` с русскоязычными сообщениями
- В production неожиданные ошибки не утекают — отдаётся generic «Ошибка сервера»

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

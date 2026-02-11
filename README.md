# DayFlow

Персональный органайзер знаний: воркспейсы, карточки (заметки, ссылки, чеклисты), роадмапы, инструменты, совместное редактирование, трекинг обучения и прогресса.

## Стек

**Клиент:** Vue 3, Vite, UnoCSS, Apollo Client, Pinia, Radix Vue, Vue Router  
**Сервер:** Node.js, GraphQL Yoga, Prisma, MySQL  
**Общее:** TypeScript, Zod, monorepo (shared)

## Возможности

### Воркспейсы
- Доски для тем/проектов с колонками и беклогом
- Эмодзи-иконка для каждого воркспейса
- Два режима: **Доска** и **Роадмап** (табы)
- Цвет колонок (хедер + бордер)
- Скрытие выполненных карточек (кнопка-глазик, состояние в БД)
- Пин (закрепление воркспейсов)

### Карточки
- Три типа: **заметка**, **ссылка**, **чеклист**
- Теги, статус обучения, порядок (drag & drop между колонками)
- **Конспект** — markdown-конспект в каждой карточке (все типы), редактор через модалку
- **AI-промпт** — генерация промпта для ИИ по содержимому карточки
- Модалка «Все конспекты» — просмотр и экспорт в `.md`

### Роадмап
- Один роадмап на воркспейс — дерево узлов (до 4 уровней вложенности)
- Создание из вложенного текста (вставка + парсинг отступов)
- Добавление / редактирование / удаление / реордер узлов
- Прогресс-бар (done/total)
- LLM-промпт для генерации роадмапа и промпт по конкретному узлу

### Совместное редактирование
- **Приглашения** — владелец генерирует invite-ссылку (`/invite/:token`), другие принимают
- **Участники** — список членов воркспейса, удаление участника (только владелец)
- **Блокировка редактирования** — один редактирует, остальные в read-only; heartbeat каждые 15с
- **Передача лока** — передать права редактирования другому участнику
- **Индикатор** — замочек + аватар редактирующего в хедере
- **Smart-синхронизация** — фоновый poll каждые 10с с точечным патчем изменившихся полей (без полного ре-рендера)

### Хаб (библиотека)
- Все карточки пользователя без привязки к воркспейсу
- Пагинация, фильтры, сортировка

### Инструменты
- Ссылки/ресурсы, привязанные к воркспейсу или хабу
- Иконка, описание, теги
- Поиск и фильтрация по названию и тегам

### Обучение
- Три статуса: «повторить», «остались вопросы», «углубить»
- Вью с группировкой по воркспейсам, сворачиваемые секции

### Прочее
- **Теги** — фильтрация и навигация по тегам карточек
- **Поиск** — по заголовкам и тегам (Ctrl+K — быстрое добавление)
- **Drag & Drop** — перетаскивание карточек между колонками и беклогом
- **Статистика** — публичная страница `/user/:id` с прогрессом по воркспейсам
- **Профиль** — смена аватара (URL)
- **7 тем оформления** — Light, Dark (Obsidian), Old Money, Old Money II, Nord, Solarized Dark, Full Moon; переключение light/dark с запоминанием предпочтений
- **Авторизация** — email + пароль (argon2), httpOnly cookie сессия
- **Rate limiting** — ограничение запросов по IP/пользователю

## Структура

```
├── client/          # Vue 3 SPA
│   ├── src/
│   │   ├── components/   # card/, common/, workspace/, toolbox/, roadmap/
│   │   ├── views/        # Home, Auth, Library, Workspace (Board + Roadmap),
│   │   │                 # Profile, UserStats, Tags, Tools, Learning, Invite
│   │   ├── composables/  # useCardActions, useCardForm, useInlineEdit,
│   │   │                 # useCardGrouping
│   │   ├── stores/       # Pinia: auth, workspace, roadmap, cards, theme
│   │   ├── graphql/      # queries, mutations, types
│   │   └── lib/          # apollo, graphql-error, constants, utils,
│   │                     # patch-workspace, card-payload
│   └── public/
├── server/          # GraphQL API
│   ├── src/
│   │   ├── resolvers/    # auth, workspace, column, card, tool,
│   │   │                 # roadmap, user-stats
│   │   ├── schema/       # schema.graphql
│   │   └── lib/          # prisma, auth, context, errors, constants,
│   │                     # lock-middleware, workspace-access, rate-limiter,
│   │                     # dataloaders
│   └── prisma/           # schema.prisma
└── shared/          # Общие типы, ErrorCodes, лимиты (dayflow-shared)
```

## Модели данных

| Модель | Описание |
|--------|----------|
| **User** | email, пароль (argon2), аватар |
| **Session** | httpOnly cookie сессии |
| **Workspace** | доска с колонками, карточками, инструментами; пин, иконка (эмодзи), invite-токен, editingBy (лок) |
| **WorkspaceMember** | участник воркспейса (userId, joinedAt) |
| **Column** | колонка воркспейса; порядок, скрытие выполненных, цвет |
| **Card** | заметка / ссылка / чеклист; теги, статус обучения, порядок, конспект (в payload) |
| **Tool** | инструмент (ссылка + описание + иконка + теги) |
| **Roadmap** | роадмап воркспейса (один на воркспейс); title, sourceText |
| **RoadmapNode** | узел роадмапа; parent/children, order, done |

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

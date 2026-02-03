# DayFlow

Веб-приложение для глубокого погружения в темы через воркспейсы и быстрого сохранения ссылок/идей/видео "на потом".

## Структура проекта

```
DayFlow/
├── client/     # Vue 3 + TypeScript + Vite
├── server/     # GraphQL API + Prisma + MySQL
└── README.md
```

## Технологии

### Frontend (client)

- Vue 3 + TypeScript
- Vite
- Vue Router + Pinia
- Apollo Client (GraphQL)
- UnoCSS + Radix Vue
- Lucide Icons

### Backend (server)

- GraphQL Yoga
- Prisma ORM + MySQL
- Lucia Auth
- Zod (валидация)
- DataLoader

## Запуск

### Требования

- Node.js 20+
- MySQL 8+

### Настройка базы данных

1. Создайте MySQL базу данных:

```sql
CREATE DATABASE dayflow;
```

2. Настройте переменные окружения в `server/.env`:

```
DATABASE_URL="mysql://root:password@localhost:3306/dayflow"
SESSION_SECRET="your-super-secret-key"
```

### Установка и запуск

```bash
# Установка зависимостей
cd server && npm install
cd ../client && npm install

# Генерация Prisma клиента и миграции
cd server
npm run db:generate
npm run db:push

# Запуск сервера (в отдельном терминале)
cd server && npm run dev

# Запуск клиента (в отдельном терминале)
cd client && npm run dev
```

Приложение будет доступно по адресу: http://localhost:5173

GraphQL Playground: http://localhost:4000/graphql

## Основные сущности

- **User** — пользователь с email авторизацией
- **Workspace** — доска для изучения темы (колонки + карточки)
- **Column** — столбец в воркспейсе
- **Card** — карточка (видео/заметка/чеклист) внутри столбца
- **Item** — универсальная запись для Library

## Скрипты

### Server

```bash
npm run dev          # Запуск в режиме разработки
npm run build        # Сборка
npm run db:push      # Применить схему к БД
npm run db:migrate   # Создать миграцию
npm run db:studio    # Открыть Prisma Studio
```

### Client

```bash
npm run dev          # Запуск в режиме разработки
npm run build        # Сборка для продакшена
npm run preview      # Просмотр сборки
npm run typecheck    # Проверка типов
```

## Лицензия

MIT

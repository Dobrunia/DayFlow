# DayFlow Client — техническая запись для LLM

## 1. Компоненты и сущности

### Маршруты и экраны

- **/** — HomeView: для гостя — лендинг и кнопка «Начать»; для авторизованного — список воркспейсов (карточки) и кнопка «Новый воркспейс».
- **/auth** — AuthView: вход/регистрация (guest-only).
- **/library** — LibraryView: библиотека элементов (Item) с фильтрами; элементы без воркспейса или привязанные к воркспейсу.
- **/workspace/:id** — WorkspaceView: доска воркспейса — заголовок, колонки (и при наличии — колонка «Беклог»).

### Общие компоненты (common)

- **AppHeader** — шапка: логотип, поиск (SearchBar), ссылки (Библиотека), кнопка «Добавить» (GlobalAddButton), иконка пользователя (меню), переключатель темы.
- **GlobalAddButton** — открывает AddItemDialog (добавление элемента в библиотеку или в выбранный воркспейс). Горячая клавиша Ctrl+K.
- **SearchBar** — поиск по элементам (searchItems), выдача с переходом в библиотеку или воркспейс.

### Библиотека (library)

- **LibraryView** — использует store library (items, filter), LibraryFilters и сетку ItemCard.
- **LibraryFilters** — фильтр по типу (все / ссылка / видео / заметка / репо / задача) и «показывать выполненные».
- **ItemCard** — карточка одного Item: заголовок, тип, url/content, чекбокс done, кнопки редактировать/удалить. Редактирование — открытие AddItemDialog с пропом item.
- **AddItemDialog** — создание/редактирование Item: название, тип (LINK/VIDEO/NOTE/REPO/TASK), URL или content или подзадачи (для TASK в meta), выбор воркспейса (опционально). При редактировании тип менять нельзя. Используется и из хедера (GlobalAddButton), и из ItemCard (редактировать).

### Воркспейс (workspace)

- **WorkspaceView** — заголовок воркспейса (редактируемый), кнопки «Колонка» и удаление воркспейса. Горизонтальный скролл: при backlogItems.length > 0 — одна колонка-беклог (WorkspaceColumn в режиме беклога), затем колонки (WorkspaceColumn), затем кнопка «Добавить колонку».
- **WorkspaceColumn** — универсальная колонка:
  - Обычный режим: column + workspaceId. Заголовок колонки редактируется (useInlineEdit), счётчик карточек, кнопка удаления колонки. Список CardItem по column.cards, кнопка «Добавить карточку», AddCardDialog. Sortable: группа `cards`; при дропе — moveCard или addItemToColumn (если перетащили элемент из беклога).
  - Режим беклога: те же пропсы + backlogItems (массив Item). Заголовок «Беклог» без редактирования и без кнопки удаления, список — CardItem с пропом item (без кнопки «Добавить карточку»). Контейнер списка data-backlog="true"; при дропе карточки в беклог — deleteCard.
- **CardItem** — одна карточка. Принимает либо card + columnId (карточка в колонке), либо item (элемент в беклоге). Внутри единый объект отображения (display): из card или собран из item (title, тип, url/content/checklist из meta). Один и тот же UI: чекбокс (в беклоге только отображение), заголовок, контент заметки/чеклиста/превью видео, бейдж типа, кнопки редактировать/удалить. Редактирование: AddCardDialog для card, AddItemDialog для item. Удаление: deleteCard или deleteItem + refetch воркспейса.
- **AddCardDialog** — создание/редактирование карточки в колонке: название, тип (NOTE/VIDEO/CHECKLIST), поля по типу (videoUrl, noteContent, checklistItems). При редактировании (проп card) тип менять нельзя. Создание — createCard; редактирование — updateCard.
- **CreateWorkspaceDialog** — создание воркспейса (название, описание).

### Сторы

- **auth** — user, initialized; fetchMe, signIn, signUp, signOut. Роутер использует requiresAuth / guest.
- **theme** — dark (bool), init (из localStorage), toggle, apply (добавление/снятие класса .dark на document.documentElement).
- **library** — items, filter, loading, error; fetchLibrary, createItem, updateItem, deleteItem, toggleItemDone. Реактивное обновление списка через замену массива/элементов.
- **workspace** — workspaces, currentWorkspace, loading, error; fetchWorkspaces, fetchWorkspace, CRUD воркспейсов/колонок/карточек, moveCard, addItemToColumn (элемент беклога → карточка в колонке), toggleCardChecked. После мутаций с позициями — refetch воркспейса.

### Данные и API

- GraphQL (Apollo): queries (Me, MyWorkspaces, Workspace с columns/cards/backlogItems, Library, SearchItems), mutations (auth, workspace, column, item, card, в т.ч. addItemToColumn, moveCard, reorderColumns). Типы в graphql/types.ts.
- Беклог: элементы с workspaceId и без карточки (card: null). Отображаются только если backlogItems.length > 0. Перетаскивание: из беклога в колонку — addItemToColumn; из колонки в беклог — deleteCard (item остаётся в воркспейсе).

---

## 2. Правила проекта

### Цвета и темы

- Все цвета задаются через CSS-переменные в **client/src/assets/main.css**.
- Светлая тема — :root; тёмная — класс **.dark** на корне (document.documentElement).
- Переменные: --fg, --fg-muted, --bg, --muted, --muted-hover, --border, --border-hover, --primary, --on-primary, --success, --danger, --overlay, --card-shadow, --card-shadow-hover. Использовать только их; не хардкодить hex в компонентах.
- Переключение темы: **client/src/stores/theme.ts**. themeStore.init() в App.vue onMounted; toggle() сохраняет в localStorage (dayflow-theme: 'light' | 'dark') и вызывает apply() (добавить/убрать .dark). Тема должна применяться только через этот стор.

### UnoCSS и классы

- **client/uno.config.ts**: darkMode: 'class' (совпадает с .dark на корне).
- В theme.extend заданы цвета как var(--…): fg, fg-muted, bg, muted, muted-hover, border, border-hover, primary, on-primary, success, danger, overlay. В разметке использовать их: text-fg, bg-bg, border-border, bg-primary, text-on-primary и т.д.
- Если комбинация классов повторяется в нескольких местах — вынести в **shortcuts** в uno.config.ts (например workspace-card, btn-primary, input, dialog-content, form-label, card-type-badge, checkbox-btn, btn-add-dashed). Новые повторяющиеся паттерны добавлять туда же.
- Иконки: Lucide через presetIcons, коллекция lucide; в коде класс вида i-lucide-<name>. Нужные иконки добавлены в safelist.

### Компоненты

- Если подходящий компонент уже есть — использовать его, не дублировать разметку/логику. Примеры: одна CardItem для карточки в колонке и для элемента в беклоге (проп card или item); один WorkspaceColumn для обычной колонки и для беклога (проп backlogItems); AddItemDialog — и для «Добавить» из хедера, и для редактирования в библиотеке.
- Модальные окна: общая обёртка (DialogRoot/Portal/Overlay/Content из radix-vue), классы dialog-overlay, dialog-content/dialog-content-scroll, dialog-header, dialog-title, dialog-close из shortcuts.

### Прочее

- Формы: подписи полей — form-label или form-label-fg; кнопки отправки/отмены — form-actions, btn-primary, btn-secondary.
- Пустые состояния: empty-state-icon, empty-state-title, empty-state-desc.
- Загрузка: loading-spinner. Тосты — vue-sonner (Toaster в App.vue).

# ARCHITECTURE

## Схема
Пользователь (iPhone, PWA) → `index.html` (UI + логика) → `localStorage['pln6']`
Выкладка: Claude → GitHub (`Kirill-Kachan/planner`, ветка `main`) → Netlify (автодеплой 30–60 с) → https://planner-go.netlify.app/

## Стек
| Слой | Решение |
|---|---|
| Фронтенд | Один файл `index.html`, ванильный JS, без сборки |
| Стили | CSS-переменные, 11 тем через `data-theme` |
| Бэкенд / БД | Нет. `localStorage`, ключ `pln6` (миграция с pln1–5) |
| Офлайн | Файл `sw.js` (кэш `pln-v5`): страница — сеть до 3,5 с, иначе кэш; остальное — кэш + фоновое обновление |
| Иконка/манифест | PNG и manifest как data URI внутри файла |
| Деплой | GitHub → Netlify (непрерывный деплой из `main`) |
| Внешнее | Notion API (опционально, не используется), погода |

## Структура репозитория
```
index.html   всё приложение
sw.js        service worker (офлайн)
README.md
CLAUDE.md    инструкции для Claude
docs/        PRD, ARCHITECTURE, RULES, DESIGN, TASKS, MEMORY
```

## Ключевые функции в index.html
- Состояние: объект `A`; `loadState` / `saveState` / миграции.
- Рендер: `render`, `renderNav`, `pgTasks`, `pgWorkouts`, `pgAuto`, `pgMemos`, `pgReport`, `pgSettings`.
- Тренировки: `openWorkoutForm`, `saveWorkout`, `groupExs`, `totalReps`, `fmtEx`, `fmtExPrev`, `exVol`, `wVol`.
- Резерв: `exportBackup`, `importBackup`, `resetWorkouts`.
- Даты: `today()`, `addDays(n, база?)`, `getWeekDates()`, `getMondayOf()` — только локальное время.
- Форма тренировки: блок = упражнение + список подходов `{r,w}`; `exToBlock` / `blockToEx` переводят в форматы хранения (одна запись на упражнение, даже при разных повторах и весе).
- Долгое нажатие: атрибуты `data-del="тип:id"` + `data-grp`; удаление и перетаскивание (`LP_MOVE`).
- Мышцы: `muscleOf(название)` по ключевым словам + ручная привязка `A.exMuscle`.

## Данные (`A`)
`tasks`, `workouts`, `reminders`, `cats`, `notion`, `theme`, `autoTasks`, `autoService`, `workoutTypes`, `memos`, `payments` (платежи с повтором и отметками оплаты), `waits` («Жду ответа», этапы), `exMuscle` (ручное назначение мышцы упражнению), `ui` (прозрачность/размытие).

Форматы упражнения:
- `{n,s,r,w}` — обычное
- `{n,s,r:[...],w,mixed:true}` — разные повторы
- `{n,s,sets:[{r,w}],mixedW:true}` — разный вес
- `{n,ladder:N,w:0}` — лесенка (объём N×(N+1))

## Важно
- Данные PWA с домашнего экрана **отделены** от Safari. Удаление ярлыка удаляет данные.
- Вспомогательные функции — только в глобальной области (иначе «Can't find variable»).

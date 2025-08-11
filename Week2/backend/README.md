# CrazyGift Backend

FastAPI backend для телеграм miniApp "рулетка подарков" с интеграцией Telegram Stars и TON блокчейн.

## Архитектура

- **Framework**: FastAPI + Uvicorn
- **База данных**: SQLite (async) / PostgreSQL
- **ORM**: SQLAlchemy 2.0 (async)
- **Валидация**: Pydantic v2
- **Платежи**: Telegram Stars + TON Connect

## Структура проекта

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Основное приложение FastAPI
│   ├── config.py            # Конфигурация и настройки
│   ├── database.py          # Подключение к БД
│   ├── models.py            # SQLAlchemy модели
│   ├── schemas.py           # Pydantic схемы
│   ├── api/                 # API эндпоинты
│   │   ├── __init__.py
│   │   ├── users.py         # Пользователи
│   │   ├── cases.py         # Кейсы и открытие
│   │   ├── inventory.py     # Инвентарь
│   │   └── payments.py      # Платежи
│   └── services/            # Бизнес логика
│       ├── __init__.py
│       ├── telegram.py      # Telegram Bot API
│       └── ton.py           # TON блокчейн
├── tests/                   # Тестирование
├── requirements.txt         # Зависимости
├── run.py                   # Точка входа
└── .env                     # Переменные окружения
```

## Установка и запуск

### Требования

- Python 3.8+
- pip

### Быстрый старт

```bash
# Клонирование и переход в директорию
cd backend

# Установка зависимостей
pip install -r requirements.txt

# Создание .env файла
cp .env.example .env

# Запуск сервера
python3 run.py
```

Сервер запустится на `http://localhost:8000`

### Конфигурация (.env)

```env
# База данных
DATABASE_URL=sqlite+aiosqlite:///./crazygift.db

# Безопасность
SECRET_KEY=your_secret_key_here

# CORS
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,file://

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_here

# TON блокчейн
TON_WALLET_ADDRESS=your_ton_wallet
TON_PRIVATE_KEY=your_ton_private_key

# Разработка
DEBUG=true
PORT=8000
```

## База данных

### Модели

#### Users
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    telegram_id INTEGER UNIQUE,
    username VARCHAR(255),
    first_name VARCHAR(255),
    balance_stars INTEGER DEFAULT 1000,
    total_cases_opened INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    referral_code VARCHAR(50) UNIQUE,
    referred_by INTEGER,
    created_at DATETIME,
    last_active DATETIME
);
```

#### Cases
```sql
CREATE TABLE cases (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_stars INTEGER NOT NULL,
    items JSON NOT NULL,
    active BOOLEAN DEFAULT true,
    total_opened INTEGER DEFAULT 0,
    image_url VARCHAR(500),
    category VARCHAR(100),
    created_at DATETIME
);
```

#### Inventory
```sql
CREATE TABLE inventory (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    item_value DECIMAL(10,2) NOT NULL,
    item_stars INTEGER NOT NULL,
    rarity VARCHAR(50) NOT NULL,
    image_url VARCHAR(500),
    case_name VARCHAR(255),
    case_id INTEGER,
    is_withdrawn BOOLEAN DEFAULT false,
    withdrawal_requested_at DATETIME,
    created_at DATETIME
);
```

#### Transactions
```sql
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(15,8) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    status VARCHAR(50) NOT NULL,
    description TEXT,
    external_id VARCHAR(255),
    created_at DATETIME,
    completed_at DATETIME
);
```

### Миграции

```bash
# Создание новой миграции
alembic revision --autogenerate -m "description"

# Применение миграций
alembic upgrade head

# Откат миграции
alembic downgrade -1
```

## API Эндпоинты

### Аутентификация
- `POST /api/users/auth` - Авторизация через Telegram WebApp
- `GET /api/users/{user_id}` - Профиль пользователя
- `GET /api/users/{user_id}/stats` - Статистика пользователя

### Кейсы
- `GET /api/cases` - Список всех кейсов
- `GET /api/cases/{case_id}` - Детали кейса
- `POST /api/cases/{case_id}/open` - Открыть кейс

### Инвентарь
- `GET /api/inventory/{user_id}` - Инвентарь пользователя
- `POST /api/inventory/{item_id}/sell` - Продать предмет
- `POST /api/inventory/{item_id}/withdraw` - Запрос на вывод

### Платежи
- `POST /api/payments/ton/deposit` - Создать TON депозит
- `POST /api/payments/stars/invoice` - Создать Telegram Stars инвойс
- `POST /api/payments/webhook/ton` - TON webhook
- `POST /api/payments/webhook/telegram` - Telegram webhook

### Системные
- `GET /` - Статус API
- `GET /health` - Проверка здоровья
- `GET /api/stats` - Публичная статистика

Полная документация доступна на `/docs` при запуске в режиме DEBUG.

## Тестирование

### Ручное тестирование

```bash
# Запуск всех тестов
cd tests
python3 test_complete.py

# Отдельные модули
python3 test_system.py
python3 test_auth.py
python3 test_cases.py
python3 test_payments.py
python3 test_inventory.py

# Через скрипт
./run_tests.sh
```

### Автоматическое тестирование

```bash
# Установка тестовых зависимостей
pip install httpx pytest pytest-asyncio

# Запуск pytest
pytest tests/
```

## Безопасность

### Аутентификация
- Валидация Telegram WebApp `initData`
- Проверка подписи через HMAC-SHA256
- JWT токены для сессий

### Платежи
- Webhook верификация
- Двойная проверка платежей
- Защита от replay атак

### База данных
- Параметризованные запросы (защита от SQL-инъекций)
- Валидация входных данных через Pydantic
- Транзакционность операций

## Производительность

### Оптимизации
- Async/await для всех операций
- Connection pooling для БД
- Кэширование частых запросов
- Индексы на часто используемых полях

### Мониторинг
```python
# Логирование времени выполнения
import time
start_time = time.time()
# операция
logger.info(f"Operation took {time.time() - start_time:.2f}s")
```

## Развертывание

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["python", "run.py"]
```

### Docker Compose

```yaml
services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/crazygift
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: crazygift
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
```

### Systemd Service

```ini
[Unit]
Description=CrazyGift Backend
After=network.target

[Service]
Type=simple
User=crazygift
WorkingDirectory=/opt/crazygift/backend
ExecStart=/opt/crazygift/venv/bin/python run.py
Restart=always

[Install]
WantedBy=multi-user.target
```

## Мониторинг и логирование

### Логи
```python
import logging

# Настройка в config.py
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

### Метрики
- Количество активных пользователей
- Скорость открытия кейсов
- Объем платежей
- Время ответа API

## Часто задаваемые вопросы

### Q: Как добавить новый кейс?
A: Добавьте запись в таблицу `cases` с JSON массивом предметов в поле `items`.

### Q: Как изменить курс TON/Stars?
A: Измените константу в `app/services/ton.py` или сделайте динамический курс через внешний API.

### Q: Как добавить новый способ оплаты?
A: Создайте новый сервис в `app/services/` и добавьте эндпоинты в `app/api/payments.py`.

### Q: База данных не создается
A: Проверьте права доступа к папке и корректность `DATABASE_URL` в `.env`.

## Поддержка

При возникновении проблем:

1. Проверьте логи сервера
2. Убедитесь в корректности `.env` файла
3. Проверьте доступность базы данных
4. Запустите тесты для диагностики

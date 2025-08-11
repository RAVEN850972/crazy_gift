import hmac
import hashlib
import json
import time
from urllib.parse import unquote, parse_qsl
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from .config import settings
import logging

logger = logging.getLogger(__name__)


def verify_telegram_auth(init_data: str) -> Dict[str, Any]:
    """
    Проверка подлинности данных Telegram WebApp
    С обходом валидации в DEBUG режиме для разработки
    
    Args:
        init_data: Строка с данными от Telegram WebApp
        
    Returns:
        Dict с данными пользователя
        
    Raises:
        HTTPException: Если данные невалидны
    """
    
    # ========================================
    # DEBUG РЕЖИМ - ПРОПУСКАЕМ ВАЛИДАЦИЮ
    # ========================================
    if settings.debug:
        logger.warning("🔧 DEBUG MODE: Пропускаем валидацию Telegram auth для разработки")
        
        try:
            # Парсим параметры без проверки подписи
            parsed_data = dict(parse_qsl(init_data))
            logger.info(f"🔧 DEBUG: Получены параметры: {list(parsed_data.keys())}")
            
            # Убираем hash из данных
            parsed_data.pop('hash', None)
            
            # Парсим данные пользователя
            user_data_str = parsed_data.get('user')
            if not user_data_str:
                # Если нет данных пользователя, создаем тестовые
                logger.info("🧪 Создаем тестового пользователя для DEBUG режима")
                return {
                    'id': 123456789,
                    'first_name': 'Test',
                    'last_name': 'User',
                    'username': 'testuser',
                    'language_code': 'en',
                    'is_bot': False
                }
            
            try:
                user_data = json.loads(unquote(user_data_str))
                logger.info(f"🔧 DEBUG: Пользователь из параметров: {user_data}")
                
                # Проверяем обязательные поля
                if not user_data.get('id'):
                    logger.warning("🔧 DEBUG: Нет ID пользователя, используем тестовые данные")
                    return {
                        'id': 123456789,
                        'first_name': 'Test',
                        'last_name': 'User',
                        'username': 'testuser',
                        'language_code': 'en',
                        'is_bot': False
                    }
                
                return user_data
                
            except json.JSONDecodeError as e:
                logger.warning(f"🔧 DEBUG: Ошибка парсинга user data ({e}), используем тестовые данные")
                return {
                    'id': 123456789,
                    'first_name': 'Test',
                    'last_name': 'User',
                    'username': 'testuser',
                    'language_code': 'en',
                    'is_bot': False
                }
                
        except Exception as e:
            logger.warning(f"🔧 DEBUG: Общая ошибка обработки init_data ({e}), используем тестовые данные")
            return {
                'id': 123456789,
                'first_name': 'Test',
                'last_name': 'User',  
                'username': 'testuser',
                'language_code': 'en',
                'is_bot': False
            }
    
    # ========================================
    # ПРОДАКШЕН РЕЖИМ - ПОЛНАЯ ВАЛИДАЦИЯ
    # ========================================
    
    try:
        # Парсим параметры
        parsed_data = dict(parse_qsl(init_data))
        
        # Получаем hash
        received_hash = parsed_data.pop('hash', None)
        if not received_hash:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing hash parameter"
            )
        
        # Проверяем auth_date (данные не должны быть старше 24 часов)
        auth_date = parsed_data.get('auth_date')
        if auth_date:
            try:
                auth_timestamp = int(auth_date)
                current_timestamp = int(time.time())
                
                # Данные старше 24 часов считаем невалидными
                if current_timestamp - auth_timestamp > 86400:  # 24 часа
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Auth data is too old"
                    )
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid auth_date format"
                )
        
        # Создаем строку для проверки подписи
        check_string = '\n'.join(
            f"{key}={value}" 
            for key, value in sorted(parsed_data.items())
        )
        
        # Создаем секретный ключ
        secret_key = hmac.new(
            "WebAppData".encode(),
            settings.telegram_bot_token.encode(),
            hashlib.sha256
        ).digest()
        
        # Вычисляем ожидаемый hash
        calculated_hash = hmac.new(
            secret_key,
            check_string.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Проверяем подпись
        if not hmac.compare_digest(calculated_hash, received_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid hash signature"
            )
        
        # Парсим данные пользователя
        user_data_str = parsed_data.get('user')
        if not user_data_str:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing user data"
            )
        
        try:
            user_data = json.loads(unquote(user_data_str))
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user data format"
            )
        
        # Проверяем обязательные поля
        if not user_data.get('id'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing user ID"
            )
        
        return user_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected auth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication processing error"
        )


def extract_referral_code(start_param: Optional[str]) -> Optional[str]:
    """
    Извлекает реферальный код из start_param
    
    Args:
        start_param: Параметр запуска от Telegram
        
    Returns:
        Реферальный код или None
    """
    if not start_param:
        return None
    
    # Простая логика: если start_param начинается с "ref_", извлекаем код
    if start_param.startswith("ref_"):
        return start_param[4:]  # Убираем префикс "ref_"
    
    return None


def generate_referral_code(telegram_id: int) -> str:
    """
    Генерирует уникальный реферальный код для пользователя
    
    Args:
        telegram_id: ID пользователя в Telegram
        
    Returns:
        Реферальный код
    """
    # Простой алгоритм: CG + последние 6 цифр от telegram_id + checksum
    base = str(telegram_id)[-6:].zfill(6)
    
    # Простая контрольная сумма
    checksum = sum(int(digit) for digit in base) % 10
    
    return f"CG{base}{checksum}"


def validate_user_data(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Валидирует и очищает данные пользователя
    
    Args:
        user_data: Сырые данные пользователя от Telegram
        
    Returns:
        Очищенные данные пользователя
    """
    logger.info(f"🔍 Валидация данных пользователя: {user_data}")
    
    # Обязательные поля
    telegram_id = user_data.get('id')
    
    if not telegram_id:
        logger.error("❌ Отсутствует telegram ID")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing telegram ID"
        )
    
    # Преобразуем в int если это строка
    if isinstance(telegram_id, str) and telegram_id.isdigit():
        telegram_id = int(telegram_id)
        
    if not isinstance(telegram_id, int) or telegram_id <= 0:
        logger.error(f"❌ Невалидный telegram ID: {telegram_id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid telegram ID"
        )
    
    # Опциональные поля с очисткой
    username = user_data.get('username', '').strip()[:255] or None
    first_name = user_data.get('first_name', '').strip()[:255] or None
    last_name = user_data.get('last_name', '').strip()[:255] or None
    
    # Проверяем валидность username (если есть)
    if username and not username.replace('_', '').replace('-', '').isalnum():
        username = None
    
    result = {
        'telegram_id': telegram_id,
        'username': username,
        'first_name': first_name,
        'last_name': last_name,
        'is_bot': user_data.get('is_bot', False),
        'language_code': user_data.get('language_code', 'en'),
        'auth_date': user_data.get('auth_date'),
        'start_param': user_data.get('start_param'),
    }
    
    logger.info(f"✅ Валидация успешна: {result}")
    return result
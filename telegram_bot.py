"""
Автономный Telegram-бот для изучения стихов с локальной базой данных SQLite
и поддержкой запуска Telegram WebApp.
"""

import os
import re
import sqlite3
import random
from typing import Optional
import telebot
from telebot.types import (
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    Message,
    CallbackQuery,
    WebAppInfo,
)

BOT_TOKEN = os.getenv("BOT_TOKEN", "YOUR_BOT_TOKEN_HERE")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://psychomanya.github.io/stikhi/")

bot = telebot.TeleBot(BOT_TOKEN)

# Инициализация базы данных SQLite
DB_PATH = "poetry.db"


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS poems (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            text TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS user_progress (
            user_id INTEGER NOT NULL,
            poem_id INTEGER NOT NULL,
            percentage REAL DEFAULT 0.1,
            is_mastered INTEGER DEFAULT 0,
            PRIMARY KEY (user_id, poem_id)
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS active_sessions (
            user_id INTEGER PRIMARY KEY,
            poem_id INTEGER NOT NULL,
            percentage REAL DEFAULT 0.1,
            is_peek INTEGER DEFAULT 0
        )
    """)
    conn.commit()
    conn.close()


init_db()

SYMBOL = "▒"
PERCENT_STEP = 0.33


def escape_markdown_v2(text: str) -> str:
    return re.sub(r"([_*\[\]()~`>#+\-=|{}.!])", r"\\\1", text)


def spoilerize_poetry(text: str, percentage: float, symbol: str = SYMBOL) -> str:
    lines = text.strip().split("\n")
    spoilerized_lines = []

    for line_idx, line in enumerate(lines):
        if not line.strip():
            spoilerized_lines.append("")
            continue

        words = line.split()
        eligible = [i for i, w in enumerate(words) if sum(1 for c in w if c.isalpha()) > 2]

        if not eligible or percentage < 0.05:
            spoilerized_lines.append(escape_markdown_v2(line))
            continue

        num_to_spoiler = min(len(eligible), max(1, int(len(eligible) * percentage)))
        random.seed(line_idx * 739 + int(percentage * 100))
        to_mask = set(random.sample(eligible, num_to_spoiler))

        new_words = []
        for i, word in enumerate(words):
            if i in to_mask:
                masked = "".join(symbol if c.isalpha() else c for c in word)
                new_words.append(masked)
            else:
                new_words.append(word)

        escaped_line = escape_markdown_v2(" ".join(new_words))
        spoilerized_lines.append(escaped_line)

    return "\n".join(spoilerized_lines)


def get_step_keyboard(poem_id: int, percentage: float, is_peek: bool = False) -> InlineKeyboardMarkup:
    kb = InlineKeyboardMarkup(row_width=3)
    buttons = []

    if percentage > 0.11:
        buttons.append(InlineKeyboardButton("⬅️ Легче", callback_data=f"prev_{poem_id}"))

    peek_label = "🙈 Спрятать" if is_peek else "🫣 Подглядеть"
    buttons.append(InlineKeyboardButton(peek_label, callback_data=f"peek_{poem_id}"))

    if percentage < 0.99:
        buttons.append(InlineKeyboardButton("Сложнее ➡️", callback_data=f"next_{poem_id}"))

    kb.add(*buttons)
    kb.row(
        InlineKeyboardButton("🌐 Открыть WebApp", web_app=WebAppInfo(url=WEBAPP_URL)),
        InlineKeyboardButton("📚 Библиотека", callback_data="library"),
    )
    return kb


@bot.message_handler(commands=["start", "help"])
def cmd_start(message: Message):
    text = (
        "👋 *Добро пожаловать в СтихоУм\\!*\n\n"
        "Здесь вы можете учить стихотворения наизусть по шагам с помощью скрытия слов\\.\n\n"
        "📱 Вы можете использовать нашего бота или открыть удобное *Web\\-приложение*\\:\n"
        f"[Открыть СтихоУм в браузере]({WEBAPP_URL})\n\n"
        "Команды:\n"
        "/add — Добавить своё стихотворение через пошаговый диалог\n"
        "/library — Моя библиотека стихов\n"
        "/app — Запустить WebApp"
    )
    kb = InlineKeyboardMarkup()
    kb.add(InlineKeyboardButton("🚀 Открыть Web-приложение", web_app=WebAppInfo(url=WEBAPP_URL)))
    kb.add(InlineKeyboardButton("➕ Добавить стих в бота", callback_data="add_poem"))
    kb.add(InlineKeyboardButton("📚 Моя библиотека", callback_data="library"))
    bot.send_message(message.chat.id, text, parse_mode="MarkdownV2", reply_markup=kb)


@bot.message_handler(commands=["app"])
def cmd_app(message: Message):
    kb = InlineKeyboardMarkup()
    kb.add(InlineKeyboardButton("🌟 Открыть СтихоУм", web_app=WebAppInfo(url=WEBAPP_URL)))
    bot.send_message(message.chat.id, "Нажмите кнопку ниже, чтобы открыть веб-приложение:", reply_markup=kb)


# Пошаговый диалог добавления стиха (FSM)
@bot.message_handler(commands=["add"])
def cmd_add(message: Message):
    msg = bot.send_message(
        message.chat.id,
        "Шаг 1 из 3:\nУкажите *Имя автора* стихотворения (например: Александр Пушкин):",
        parse_mode="Markdown",
    )
    bot.register_next_step_handler(msg, step_get_author)


def step_get_author(message: Message):
    author = message.text.strip()
    msg = bot.send_message(
        message.chat.id,
        f"Автор: *{author}*\n\nШаг 2 из 3:\nТеперь введите *Название стихотворения*:",
        parse_mode="Markdown",
    )
    bot.register_next_step_handler(msg, step_get_title, author)


def step_get_title(message: Message, author: str):
    title = message.text.strip()
    msg = bot.send_message(
        message.chat.id,
        f"Произведение: *«{title}»*\n\nШаг 3 из 3:\nОтправьте *текст стихотворения*.\n"
        "Бот автоматически очистит лишние пробелы и приведет строфы в порядок.",
        parse_mode="Markdown",
    )
    bot.register_next_step_handler(msg, step_get_text, author, title)


def step_get_text(message: Message, author: str, title: str):
    raw_text = message.text.strip()

    # Очистка и приведение в порядок
    cleaned = re.sub(r"#\S+", "", raw_text)  # убираем хештеги
    cleaned = re.sub(r"https?://\S+", "", cleaned)  # убираем ссылки
    cleaned = re.sub(r"[ \t]{2,}", " ", cleaned)  # лишние пробелы

    # Сохраняем в SQLite
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO poems (user_id, title, author, text) VALUES (?, ?, ?, ?)",
        (message.from_user.id, title, author, cleaned),
    )
    poem_id = cur.lastrowid
    conn.commit()
    conn.close()

    kb = InlineKeyboardMarkup()
    kb.add(InlineKeyboardButton("📖 Начать учить сейчас!", callback_data=f"learn_{poem_id}"))
    kb.add(InlineKeyboardButton("📚 В библиотеку", callback_data="library"))

    bot.send_message(
        message.chat.id,
        f"✅ Стихотворение *«{title}»* успешно сохранено в вашу библиотеку!",
        parse_mode="Markdown",
        reply_markup=kb,
    )


@bot.callback_query_handler(func=lambda call: True)
def handle_callbacks(call: CallbackQuery):
    data = call.data
    user_id = call.from_user.id

    if data == "library":
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT id, title, author FROM poems WHERE user_id = ? ORDER BY id DESC", (user_id,))
        poems = cur.fetchall()
        conn.close()

        if not poems:
            kb = InlineKeyboardMarkup()
            kb.add(InlineKeyboardButton("➕ Добавить стихотворение", callback_data="add_poem"))
            kb.add(InlineKeyboardButton("🌐 Открыть WebApp", web_app=WebAppInfo(url=WEBAPP_URL)))
            bot.edit_message_text(
                "У вас пока нет сохранённых стихотворений.\nНажмите кнопку ниже, чтобы добавить первое!",
                call.message.chat.id,
                call.message.message_id,
                reply_markup=kb,
            )
            return

        kb = InlineKeyboardMarkup()
        for pid, ptitle, pauthor in poems:
            kb.add(InlineKeyboardButton(f"📖 {pauthor} — {ptitle}", callback_data=f"learn_{pid}"))
        kb.add(InlineKeyboardButton("➕ Добавить ещё стих", callback_data="add_poem"))
        bot.edit_message_text("Ваша библиотека стихов:", call.message.chat.id, call.message.message_id, reply_markup=kb)

    elif data == "add_poem":
        msg = bot.send_message(call.message.chat.id, "Шаг 1 из 3:\nУкажите *Имя автора* стихотворения:", parse_mode="Markdown")
        bot.register_next_step_handler(msg, step_get_author)

    elif data.startswith("learn_"):
        poem_id = int(data.split("_")[1])
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT title, author, text FROM poems WHERE id = ?", (poem_id,))
        poem = cur.fetchone()
        conn.close()

        if not poem:
            bot.answer_callback_query(call.id, "Стихотворение не найдено.")
            return

        title, author, text = poem
        percentage = 0.1
        spoilerized = spoilerize_poetry(f"**{author} — {title}**\n\n{text}", percentage)

        bot.send_message(
            call.message.chat.id,
            spoilerized,
            parse_mode="MarkdownV2",
            reply_markup=get_step_keyboard(poem_id, percentage, is_peek=False),
        )
        bot.answer_callback_query(call.id)

    elif data.startswith("next_") or data.startswith("prev_"):
        action, pid_str = data.split("_")
        poem_id = int(pid_str)

        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT percentage FROM user_progress WHERE user_id = ? AND poem_id = ?", (user_id, poem_id))
        row = cur.fetchone()
        curr_p = row[0] if row else 0.1

        new_p = min(1.0, curr_p + PERCENT_STEP) if action == "next" else max(0.1, curr_p - PERCENT_STEP)
        cur.execute("INSERT OR REPLACE INTO user_progress (user_id, poem_id, percentage) VALUES (?, ?, ?)", (user_id, poem_id, new_p))
        conn.commit()

        cur.execute("SELECT title, author, text FROM poems WHERE id = ?", (poem_id,))
        title, author, text = cur.fetchone()
        conn.close()

        spoilerized = spoilerize_poetry(f"**{author} — {title}**\n\n{text}", new_p)
        try:
            bot.edit_message_text(
                spoilerized,
                call.message.chat.id,
                call.message.message_id,
                parse_mode="MarkdownV2",
                reply_markup=get_step_keyboard(poem_id, new_p, is_peek=False),
            )
        except Exception:
            pass
        bot.answer_callback_query(call.id)

    elif data.startswith("peek_"):
        poem_id = int(data.split("_")[1])
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT percentage FROM user_progress WHERE user_id = ? AND poem_id = ?", (user_id, poem_id))
        row = cur.fetchone()
        curr_p = row[0] if row else 0.1

        cur.execute("SELECT title, author, text FROM poems WHERE id = ?", (poem_id,))
        title, author, text = cur.fetchone()
        conn.close()

        is_currently_peek = SYMBOL not in call.message.text
        if is_currently_peek:
            # Снова скрыть
            display_text = spoilerize_poetry(f"**{author} — {title}**\n\n{text}", curr_p)
            kb = get_step_keyboard(poem_id, curr_p, is_peek=False)
        else:
            # Подглядеть (показать оригинал)
            display_text = escape_markdown_v2(f"{author} — {title}\n\n{text}")
            kb = get_step_keyboard(poem_id, curr_p, is_peek=True)

        try:
            bot.edit_message_text(
                display_text,
                call.message.chat.id,
                call.message.message_id,
                parse_mode="MarkdownV2",
                reply_markup=kb,
            )
        except Exception:
            pass
        bot.answer_callback_query(call.id)


if __name__ == "__main__":
    print("Бот запускается...")
    bot.infinity_polling()

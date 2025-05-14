# -------------------------------------------------------------------------
# vocabulary_service.py - Vocabulary Management Utilities
# -------------------------------------------------------------------------
# This module provides utilities for working with vocabulary lists in the 
# LanguagePal application. It includes functions for parsing user input
# of vocabulary words and providing example vocabulary for different
# languages.
# -------------------------------------------------------------------------

import logging

# Configure module logger
logger = logging.getLogger(__name__)

def parse_vocabulary_text(text):
    """
    Parse a text input of vocabulary words/phrases.
    Separates by newlines and commas, then cleans up the results.
    
    Args:
        text (str): The vocabulary text
        
    Returns:
        list: List of vocabulary words/phrases
    """
    # First split by newlines
    lines = text.strip().split('\n')
    words = []
    
    for line in lines:
        # Then split by commas
        parts = line.split(',')
        for part in parts:
            word = part.strip()
            if word:  # Only add non-empty words
                words.append(word)
    
    return words

def get_example_vocabulary(language):
    """
    Get example vocabulary words for the given language.
    
    Args:
        language (str): Target language
        
    Returns:
        list: Example vocabulary words
    """
    vocabularies = {
        "Spanish": [
            "hola", "adiós", "por favor", "gracias", "sí", "no", 
            "yo", "tú", "él", "ella", "nosotros", "ellos", "agua", 
            "pan", "libro", "casa", "perro", "gato", "comer", "beber", 
            "hablar", "leer", "escribir", "caminar", "correr", "bueno", 
            "malo", "grande", "pequeño", "rojo", "azul", "verde", "amarillo"
        ],
        "French": [
            "bonjour", "au revoir", "s'il vous plaît", "merci", "oui", "non", 
            "je", "tu", "il", "elle", "nous", "ils", "elles", "eau", "pain", 
            "livre", "maison", "chien", "chat", "manger", "boire", "parler", 
            "lire", "écrire", "marcher", "courir", "bon", "mauvais", 
            "grand", "petit", "rouge", "bleu", "vert", "jaune"
        ],
        "German": [
            "hallo", "auf wiedersehen", "bitte", "danke", "ja", "nein", 
            "ich", "du", "er", "sie", "wir", "sie", "wasser", "brot", 
            "buch", "haus", "hund", "katze", "essen", "trinken", "sprechen", 
            "lesen", "schreiben", "gehen", "laufen", "gut", "schlecht", 
            "groß", "klein", "rot", "blau", "grün", "gelb"
        ],
        "Italian": [
            "ciao", "arrivederci", "per favore", "grazie", "sì", "no", 
            "io", "tu", "lui", "lei", "noi", "loro", "acqua", "pane", 
            "libro", "casa", "cane", "gatto", "mangiare", "bere", "parlare", 
            "leggere", "scrivere", "camminare", "correre", "buono", "cattivo", 
            "grande", "piccolo", "rosso", "blu", "verde", "giallo"
        ],
        "Portuguese": [
            "olá", "adeus", "por favor", "obrigado", "sim", "não", 
            "eu", "tu", "ele", "ela", "nós", "eles", "elas", "água", "pão", 
            "livro", "casa", "cão", "gato", "comer", "beber", "falar", 
            "ler", "escrever", "andar", "correr", "bom", "mau", 
            "grande", "pequeno", "vermelho", "azul", "verde", "amarelo"
        ],
        "Russian": [
            "привет", "до свидания", "пожалуйста", "спасибо", "да", "нет", 
            "я", "ты", "он", "она", "мы", "они", "вода", "хлеб", 
            "книга", "дом", "собака", "кот", "есть", "пить", "говорить", 
            "читать", "писать", "ходить", "бегать", "хороший", "плохой", 
            "большой", "маленький", "красный", "синий", "зеленый", "желтый"
        ],
        "Japanese": [
            "こんにちは", "さようなら", "お願いします", "ありがとう", "はい", "いいえ", 
            "私", "あなた", "彼", "彼女", "私たち", "彼ら", "水", "パン", 
            "本", "家", "犬", "猫", "食べる", "飲む", "話す", 
            "読む", "書く", "歩く", "走る", "良い", "悪い", 
            "大きい", "小さい", "赤", "青", "緑", "黄色"
        ],
        "Chinese": [
            "你好", "再见", "请", "谢谢", "是", "不", 
            "我", "你", "他", "她", "我们", "他们", "水", "面包", 
            "书", "家", "狗", "猫", "吃", "喝", "说话", 
            "读", "写", "走", "跑", "好", "坏", 
            "大", "小", "红色", "蓝色", "绿色", "黄色"
        ],
        "Korean": [
            "안녕하세요", "안녕히 가세요", "제발", "감사합니다", "예", "아니요", 
            "나", "너", "그", "그녀", "우리", "그들", "물", "빵", 
            "책", "집", "개", "고양이", "먹다", "마시다", "말하다", 
            "읽다", "쓰다", "걷다", "달리다", "좋은", "나쁜", 
            "큰", "작은", "빨간색", "파란색", "녹색", "노란색"
        ]
    }
    
    return vocabularies.get(language, ["hello", "goodbye", "please", "thank you", "yes", "no"])

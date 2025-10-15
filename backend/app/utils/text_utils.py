"""
Text processing utilities for answer validation and normalization.
"""
import re
from difflib import SequenceMatcher


def normalize_answer(text: str) -> str:
    """
    Normalize answer text for better fuzzy matching.
    Handles common variations like punctuation, extra spaces, articles, etc.

    Args:
        text: The text to normalize

    Returns:
        Normalized text string
    """
    # Convert to lowercase and strip
    text = text.lower().strip()

    # Remove common punctuation
    text = re.sub(r'[.,!?;:\-\'"()\[\]{}]', '', text)

    # Replace multiple spaces with single space
    text = re.sub(r'\s+', ' ', text)

    # Remove common articles at the start (the, a, an)
    text = re.sub(r'^(the|a|an)\s+', '', text)

    return text


def calculate_similarity(user_input: str, correct_answer: str) -> float:
    """
    Calculate similarity score between user input and correct answer.

    Args:
        user_input: The user's answer
        correct_answer: The correct answer

    Returns:
        Similarity score from 0.0 to 1.0
    """
    user_normalized = normalize_answer(user_input)
    correct_normalized = normalize_answer(correct_answer)

    return SequenceMatcher(None, user_normalized, correct_normalized).ratio()


def map_similarity_to_quality(similarity_score: float) -> int:
    """
    Map similarity score to SM-2 response quality (0-4).

    Quality levels:
    - 4: Perfect recall (95%+)
    - 3: Correct with hesitation (80-94%)
    - 2: Recalled with difficulty (60-79%)
    - 1: Incorrect but remembered something (40-59%)
    - 0: Complete blank (<40%)

    Args:
        similarity_score: Score from 0.0 to 1.0

    Returns:
        SM-2 response quality (0-4)
    """
    if similarity_score >= 0.95:
        return 4  # Perfect recall
    elif similarity_score >= 0.8:
        return 3  # Correct with hesitation
    elif similarity_score >= 0.6:
        return 2  # Recalled with difficulty
    elif similarity_score >= 0.4:
        return 1  # Incorrect but remembered something
    else:
        return 0  # Complete blank

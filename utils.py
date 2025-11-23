import re

def safety_filter(text: str) -> str:
    """Filter inappropriate content"""
    return re.sub(
        r"(?i)\b(sex|violence|hate|suicide|racism)\b",
        "[content moderated]", 
        text
    )

def truncate_response(text: str, max_sentences: int = 3) -> str:
    """Clean and shorten responses"""
    # Remove incomplete lists
    if text.count('\n') > 0 and not text.endswith(')'):
        items = text.split('\n')
        text = '\n'.join(items[:-1])
    
    # Split into complete sentences
    sentences = re.split(r'(?<=[.!?]) +', text)
    return ' '.join(sentences[:max_sentences]).strip()
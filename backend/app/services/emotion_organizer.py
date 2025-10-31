"""
Emotion Organizer Service
Integrates with existing Buddy AI to add file-based emotional organization
"""
from __future__ import annotations

from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional


class SimpleEmotionAnalyzer:
    """
    Rule-based emotion analyzer (no ML dependencies)
    Fast, reasonable for common cases
    """

    EMOTION_KEYWORDS = {
        'happy': ['happy', 'joy', 'excited', 'great', 'awesome', 'wonderful', 'love', 'amazing', 'fantastic', 'proud', 'accomplished', 'achieved'],
        'sad': ['sad', 'down', 'depressed', 'unhappy', 'miserable', 'disappointed', 'upset', 'hurt', 'heartbroken'],
        'stressed': ['stressed', 'anxious', 'worried', 'overwhelmed', 'pressure', 'busy', 'exhausted', 'tired', 'burned out'],
        'angry': ['angry', 'mad', 'furious', 'annoyed', 'frustrated', 'irritated', 'hate'],
        'excited': ['excited', 'thrilled', 'pumped', 'energized', 'motivated', 'inspired'],
        'calm': ['calm', 'peaceful', 'relaxed', 'content', 'satisfied', 'comfortable'],
        'neutral': []
    }

    INTENT_KEYWORDS = {
        'idea': ['idea', 'concept', 'thought', 'brainstorm', 'maybe', 'what if', 'could', 'imagine'],
        'plan': ['plan', 'goal', 'target', 'aim', 'intend', 'will', 'going to', 'schedule'],
        'task': ['task', 'todo', 'need to', 'must', 'should', 'have to', 'work on', 'finish', 'complete'],
        'question': ['?', 'how', 'what', 'why', 'when', 'where', 'who'],
        'reflection': ['think', 'feel', 'believe', 'realize', 'understand', 'learned'],
        'achievement': ['finished', 'completed', 'done', 'accomplished', 'achieved', 'succeeded']
    }

    def analyze(self, text: str) -> Dict:
        text_lower = text.lower()

        # emotion
        emotion_scores: Dict[str, int] = {}
        for emotion, words in self.EMOTION_KEYWORDS.items():
            score = sum(1 for w in words if w in text_lower)
            if score:
                emotion_scores[emotion] = score

        if emotion_scores:
            detected = max(emotion_scores, key=emotion_scores.get)
            max_score = emotion_scores[detected]
            confidence = min(95, 50 + max_score * 15)
            if any(x in text_lower for x in ['very', 'really', 'extremely', 'so']):
                intensity = 'high'
                confidence = min(95, confidence + 10)
            elif max_score >= 3:
                intensity = 'high'
            elif max_score == 2:
                intensity = 'medium'
            else:
                intensity = 'low'
        else:
            detected = 'neutral'
            confidence = 60
            intensity = 'low'

        # intent
        intent_scores: Dict[str, int] = {}
        for intent, words in self.INTENT_KEYWORDS.items():
            score = sum(1 for w in words if w in text_lower)
            if score:
                intent_scores[intent] = score
        intent = max(intent_scores, key=intent_scores.get) if intent_scores else 'general'

        return {
            'emotion': detected,
            'confidence': confidence,
            'intensity': intensity,
            'intent': intent,
        }


class EmotionOrganizer:
    """File-based emotion/intent organization per user."""

    def __init__(self, base_path: str = "./user_data") -> None:
        self.base_path = Path(base_path)
        self.base_path.mkdir(exist_ok=True, parents=True)
        self.analyzer = SimpleEmotionAnalyzer()

    def _user_folder(self, user_id: str) -> Path:
        p = self.base_path / user_id
        p.mkdir(exist_ok=True, parents=True)
        return p

    def _determine_categories(self, analysis: Dict) -> List[str]:
        cats: List[str] = []
        emotion = analysis.get('emotion', 'neutral')
        intent = analysis.get('intent', 'general')

        # emotion-based
        if emotion in {'happy', 'excited', 'proud'}:
            cats.append('Feelings/Positive')
        elif emotion in {'sad', 'stressed', 'angry'}:
            cats.append('Feelings/Difficult')
        elif emotion == 'calm':
            cats.append('Feelings/Calm')

        # intent-based
        mapping = {
            'idea': 'Ideas',
            'plan': 'Plans',
            'task': 'Tasks',
            'achievement': 'Achievements',
            'question': 'Questions',
            'reflection': 'Reflections',
        }
        if intent in mapping:
            cats.append(mapping[intent])

        if not cats:
            cats.append('Notes')
        # remove dupes
        return list(dict.fromkeys(cats))

    async def organize_message(self, user_id: str, message: str, analysis: Optional[Dict] = None) -> Dict:
        # Normalize inbound analysis payloads from external callers
        if analysis:
            # Some callers may provide 'emotion_confidence' instead of 'confidence'
            if 'confidence' not in analysis and 'emotion_confidence' in analysis:
                try:
                    analysis = {**analysis, 'confidence': int(analysis.get('emotion_confidence') or 0)}
                except Exception:
                    analysis = {**analysis, 'confidence': analysis.get('emotion_confidence')}
            # Ensure emotion is lowercase for consistency
            if isinstance(analysis.get('emotion'), str):
                analysis = {**analysis, 'emotion': analysis['emotion'].lower()}
        em = analysis if (analysis and 'emotion' in analysis) else self.analyzer.analyze(message)
        user_dir = self._user_folder(user_id)
        categories = self._determine_categories(em)

        saved_files: List[str] = []
        now = datetime.now()
        date_str = now.strftime('%Y-%m-%d')
        time_str = now.strftime('%H:%M:%S')
        divider = '─' * 80

        for cat in categories:
            cat_dir = user_dir / cat
            cat_dir.mkdir(parents=True, exist_ok=True)
            file_path = cat_dir / f"{date_str}.txt"
            entry = f"\n[{time_str}] Emotion: {em['emotion'].title()} ({em['confidence']}%)\n{message}\n{divider}\n\n"
            with open(file_path, 'a', encoding='utf-8') as f:
                f.write(entry)
            saved_files.append(str(file_path.relative_to(self.base_path)))

        return {
            'user_id': user_id,
            'timestamp': now.isoformat(),
            'emotion': em,
            'categories': categories,
            'saved_to': saved_files,
            'message_preview': message[:100],
        }

    async def get_emotion_summary(self, user_id: str, days: int = 7) -> Dict:
        user_dir = self._user_folder(user_id)
        feelings = user_dir / 'Feelings'
        if not feelings.exists():
            return {
                'user_id': user_id,
                'period_days': days,
                'total_entries': 0,
                'emotions': {},
                'message': 'No emotional data yet',
            }
        cutoff = datetime.now() - timedelta(days=days)
        counts: Dict[str, int] = {}
        total = 0
        for sub in feelings.iterdir():
            if not sub.is_dir():
                continue
            emotion_name = sub.name
            num = 0
            for txt in sub.glob('*.txt'):
                try:
                    d = datetime.strptime(txt.stem, '%Y-%m-%d')
                    if d < cutoff:
                        continue
                    with open(txt, 'r', encoding='utf-8') as f:
                        content = f.read()
                        num += content.count('─' * 80)
                except Exception:
                    continue
            if num:
                counts[emotion_name] = num
                total += num
        perc = {k: round(v * 100.0 / total, 1) for k, v in counts.items()} if total else {}
        dom = max(counts, key=counts.get) if counts else None
        return {
            'user_id': user_id,
            'period_days': days,
            'total_entries': total,
            'emotions': counts,
            'emotion_percentages': perc,
            'dominant_emotion': dom,
        }

    async def get_category_list(self, user_id: str) -> List[Dict]:
        user_dir = self._user_folder(user_id)
        out: List[Dict] = []
        if not user_dir.exists():
            return out
        for item in user_dir.iterdir():
            if item.is_dir():
                count = len(list(item.rglob('*.txt')))
                out.append({
                    'name': item.name,
                    'path': str(item.relative_to(user_dir)),
                    'file_count': count,
                    'last_modified': datetime.fromtimestamp(item.stat().st_mtime).isoformat(),
                })
        return sorted(out, key=lambda x: x['last_modified'], reverse=True)

    async def search_notes(self, user_id: str, keyword: str, category: Optional[str] = None) -> List[Dict]:
        user_dir = self._user_folder(user_id)
        results: List[Dict] = []
        if category:
            paths = [user_dir / category]
        else:
            paths = [user_dir]
        for p in paths:
            if not p.exists():
                continue
            for txt in p.rglob('*.txt'):
                try:
                    with open(txt, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if keyword.lower() in content.lower():
                            # simple preview around first match
                            lower = content.lower()
                            kpos = lower.find(keyword.lower())
                            start = max(0, kpos - 150)
                            end = min(len(content), kpos + len(keyword) + 150)
                            preview = ('' if start == 0 else '...') + content[start:end] + ('' if end == len(content) else '...')
                            results.append({
                                'file': str(txt.relative_to(user_dir)),
                                'category': txt.parent.name,
                                'date': txt.stem,
                                'matches': lower.count(keyword.lower()),
                                'preview': preview,
                            })
                except Exception:
                    continue
        results.sort(key=lambda x: x['matches'], reverse=True)
        return results
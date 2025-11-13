import re
from typing import List
from dataclasses import dataclass
import os

try:
    from groq import Groq  # type: ignore
except Exception:
    Groq = None  # type: ignore

from app.config import settings
from app.schemas import Heading, OrganizeResult


@dataclass
class SimpleTopic:
    name: str


def _heuristic_topics(text: str) -> List[str]:
    keywords = [
        "project", "meeting", "task", "todo", "idea", "goal", "bug", "fix",
        "research", "study", "plan", "deadline", "note", "learn", "design",
    ]
    text_l = text.lower()
    found = {k for k in keywords if k in text_l}
    return sorted(found)[:10] or ["general"]


def _heuristic_headings(text: str) -> List[Heading]:
    # Split by blank lines, make first sentence the heading
    blocks = [b.strip() for b in re.split(r"\n\s*\n", text) if b.strip()]
    headings: List[Heading] = []
    for i, b in enumerate(blocks):
        first_line = b.split("\n", 1)[0]
        first_sentence = re.split(r"[.!?]", first_line)[0][:80]
        headings.append(Heading(level=1 if i == 0 else 2, text=first_sentence or "Section"))
    return headings or [Heading(level=1, text="Notes")]


def _groq_topics_headings(text: str):
    if not (settings.groq_api_key and Groq):
        return None
    try:
        client = Groq(api_key=settings.groq_api_key)
        prompt = (
            "Analyze the user's notes. Return JSON with two fields: "
            "headings: array of {level:int,text:string} describing major sections; "
            "topics: array of short tags (kebab-case). Keep it concise.\n\nNotes:\n" + text[:4000]
        )
        resp = client.chat.completions.create(
            model=settings.groq_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=512,
        )
        content = resp.choices[0].message.content or ""
        import json
        data = json.loads(content)
        headings = [Heading(**h) for h in data.get("headings", [])]
        topics = [str(t) for t in data.get("topics", [])]
        if not headings:
            headings = _heuristic_headings(text)
        if not topics:
            topics = _heuristic_topics(text)
        return OrganizeResult(headings=headings, topics=topics)
    except Exception:
        return None


def organize_text(text: str) -> OrganizeResult:
    # Try Groq first, fallback to heuristics
    groq_res = _groq_topics_headings(text)
    if groq_res:
        return groq_res
    return OrganizeResult(
        headings=_heuristic_headings(text),
        topics=_heuristic_topics(text),
    )

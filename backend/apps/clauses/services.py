import difflib
import re

from .models import Clause
from .models import ClauseLibraryEntry


def create_clause(validated_data):
    return Clause.objects.create(**validated_data)


def reorder_clauses(draft, ordered_ids):
    """
    ordered_ids = [3, 5, 1, 2]
    """
    for index, clause_id in enumerate(ordered_ids):
        Clause.objects.filter(id=clause_id, draft=draft).update(position=index)


def _tokenize(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", (text or "").lower()))


def _semantic_score(query: str, text: str) -> float:
    query_tokens = _tokenize(query)
    text_tokens = _tokenize(text)
    if not query_tokens or not text_tokens:
        return 0.0
    overlap = len(query_tokens & text_tokens) / max(len(query_tokens), 1)
    ratio = difflib.SequenceMatcher(None, query.lower(), (text or "").lower()).ratio()
    return (overlap * 0.7) + (ratio * 0.3)


def semantic_clause_search(query: str, document_type_id=None, clause_type=None, limit=5):
    queryset = ClauseLibraryEntry.objects.filter(is_active=True)
    if document_type_id:
        queryset = queryset.filter(document_type_id=document_type_id)
    if clause_type:
        queryset = queryset.filter(clause_type=clause_type)

    ranked = []
    for entry in queryset:
        score = _semantic_score(query, f"{entry.title}\n{entry.text}\n{' '.join(entry.tags)}")
        if score > 0:
            ranked.append((score, entry))
    ranked.sort(key=lambda item: item[0], reverse=True)
    return ranked[:limit]


def build_redline_diff(original_text: str, suggested_text: str) -> str:
    original_lines = (original_text or "").splitlines()
    suggested_lines = (suggested_text or "").splitlines()
    diff = difflib.unified_diff(
        original_lines,
        suggested_lines,
        fromfile="original",
        tofile="suggested",
        lineterm="",
    )
    return "\n".join(diff)

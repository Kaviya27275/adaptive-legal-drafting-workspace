from apps.versions.models import Version
from apps.drafts.models import Draft
from apps.clauses.models import Clause
from .diff_engine import word_diff, line_diff
from .models import ComparisonLog


def compare_versions(version_id_a, version_id_b, user):

    version_a = Version.objects.get(id=version_id_a)
    version_b = Version.objects.get(id=version_id_b)

    word_level = word_diff(version_a.snapshot, version_b.snapshot)
    line_level = line_diff(version_a.snapshot, version_b.snapshot)

    ComparisonLog.objects.create(
        draft_id=version_a.draft.id,
        version_a=version_a.version_number,
        version_b=version_b.version_number,
        compared_by=user
    )

    return {
        "word_diff": word_level,
        "line_diff": line_level,
        "version_a": version_a.version_number,
        "version_b": version_b.version_number
    }


def _normalize_clause_title(title):
    return (title or "").strip().lower()


def _clause_payload(clause):
    return {
        "id": clause.id,
        "title": clause.title,
        "text": clause.text,
        "clause_type": clause.clause_type,
        "position": clause.position,
    }


def compare_drafts(draft_id_a, draft_id_b, user):
    draft_a = Draft.objects.get(id=draft_id_a)
    draft_b = Draft.objects.get(id=draft_id_b)

    content_a = draft_a.content or ""
    content_b = draft_b.content or ""

    clauses_a = Clause.objects.filter(draft=draft_a, is_active=True).order_by("position", "id")
    clauses_b = Clause.objects.filter(draft=draft_b, is_active=True).order_by("position", "id")

    map_a = {_normalize_clause_title(c.title): c for c in clauses_a}
    map_b = {_normalize_clause_title(c.title): c for c in clauses_b}

    keys_a = set(map_a.keys())
    keys_b = set(map_b.keys())

    added = [_clause_payload(map_b[key]) for key in sorted(keys_b - keys_a)]
    removed = [_clause_payload(map_a[key]) for key in sorted(keys_a - keys_b)]

    modified = []
    unchanged = []

    for key in sorted(keys_a & keys_b):
        left = map_a[key]
        right = map_b[key]
        if left.text != right.text or left.clause_type != right.clause_type:
            modified.append(
                {
                    "title": right.title or left.title,
                    "before": _clause_payload(left),
                    "after": _clause_payload(right),
                }
            )
        else:
            unchanged.append(_clause_payload(right))

    ComparisonLog.objects.create(
        draft_id=draft_a.id,
        version_a=0,
        version_b=0,
        compared_by=user,
    )

    return {
        "draft_a": {"id": draft_a.id, "title": draft_a.title},
        "draft_b": {"id": draft_b.id, "title": draft_b.title},
        "content_diff": {
            "word_diff": word_diff(content_a, content_b),
            "line_diff": line_diff(content_a, content_b),
        },
        "clause_diff": {
            "added": added,
            "removed": removed,
            "modified": modified,
            "unchanged": unchanged,
        },
    }

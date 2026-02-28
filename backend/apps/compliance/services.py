import json
import re
from typing import Any

import requests
from django.conf import settings
from django.db.models import Q

from .models import (
    ComplianceRule,
    DocumentActMapping,
    MandatoryClause,
    ProhibitedWord,
    RequiredTerm,
    RiskPattern,
    StructureRule,
)
from .validators import (
    check_legal_terms,
    check_mandatory_clauses,
    check_prohibited_words,
    check_structure_order,
)


RULE_CODE_MISSING_MANDATORY_CLAUSE = "missing_mandatory_clause"
RULE_CODE_PROHIBITED_WORD = "prohibited_word_used"
RULE_CODE_MISSING_REQUIRED_TERM = "missing_required_term"
RULE_CODE_STRUCTURE_VIOLATION = "structure_violation"

AI_RISK_PENALTY = {
    "LOW": 0,
    "MEDIUM": 10,
    "HIGH": 20,
}

DEFAULT_RULE_PENALTIES = {
    RULE_CODE_MISSING_MANDATORY_CLAUSE: 15,
    RULE_CODE_PROHIBITED_WORD: 10,
    RULE_CODE_MISSING_REQUIRED_TERM: 10,
    RULE_CODE_STRUCTURE_VIOLATION: 5,
}


def _dedupe_strings(items: list[str]) -> list[str]:
    seen: set[str] = set()
    output: list[str] = []
    for item in items:
        key = (item or "").strip().lower()
        if not key or key in seen:
            continue
        seen.add(key)
        output.append(item)
    return output


def _jurisdiction_filter(jurisdiction: str) -> Q:
    return (
        Q(jurisdiction__iexact=jurisdiction)
        | Q(jurisdiction__isnull=True)
        | Q(jurisdiction="")
    )


def _build_rule_context(draft) -> dict[str, Any]:
    if not draft.document_type_id:
        raise ValueError("Draft must have a document_type.")

    structure_rule = (
        StructureRule.objects.filter(document_type=draft.document_type)
        .filter(_jurisdiction_filter(draft.jurisdiction))
        .order_by("-jurisdiction", "-updated_at")
        .first()
    )

    mandatory_qs = (
        MandatoryClause.objects.select_related("clause_type")
        .filter(document_type=draft.document_type)
        .filter(_jurisdiction_filter(draft.jurisdiction))
    )
    required_terms_qs = (
        RequiredTerm.objects.filter(document_type=draft.document_type)
        .filter(_jurisdiction_filter(draft.jurisdiction))
    )
    prohibited_words_qs = (
        ProhibitedWord.objects.filter(
            Q(document_type=draft.document_type) | Q(document_type__isnull=True)
        )
        .filter(_jurisdiction_filter(draft.jurisdiction))
    )
    risk_patterns_qs = (
        RiskPattern.objects.filter(
            Q(document_type=draft.document_type) | Q(document_type__isnull=True)
        )
        .filter(_jurisdiction_filter(draft.jurisdiction))
    )
    legal_acts_qs = (
        DocumentActMapping.objects.select_related("legal_act")
        .filter(document_type=draft.document_type)
        .filter(_jurisdiction_filter(draft.jurisdiction))
    )
    compliance_rules_qs = (
        ComplianceRule.objects.filter(
            Q(document_type=draft.document_type) | Q(document_type__isnull=True)
        )
        .filter(_jurisdiction_filter(draft.jurisdiction))
    )

    mandatory_clauses = _dedupe_strings(
        [clause.required_text or clause.clause_type.name for clause in mandatory_qs]
    )
    required_terms = _dedupe_strings([item.term for item in required_terms_qs])
    prohibited_words = _dedupe_strings([item.word for item in prohibited_words_qs])

    risk_patterns: list[dict[str, str]] = []
    seen_risk_patterns: set[str] = set()
    for item in risk_patterns_qs:
        key = (item.pattern or "").strip().lower()
        if not key or key in seen_risk_patterns:
            continue
        seen_risk_patterns.add(key)
        risk_patterns.append(
            {
                "pattern": item.pattern,
                "risk_level": item.risk_level,
                "explanation": item.explanation,
            }
        )

    legal_acts: list[dict[str, str]] = []
    seen_acts: set[tuple[str, str]] = set()
    for mapping in legal_acts_qs:
        key = (
            (mapping.legal_act.act_name or "").strip().lower(),
            (mapping.legal_act.section_reference or "").strip().lower(),
        )
        if key in seen_acts:
            continue
        seen_acts.add(key)
        legal_acts.append(
            {
                "act_name": mapping.legal_act.act_name,
                "section_reference": mapping.legal_act.section_reference,
            }
        )

    compliance_rules: dict[str, int] = {}
    # Apply global first, then override with jurisdiction-specific rule.
    for item in compliance_rules_qs.filter(Q(jurisdiction__isnull=True) | Q(jurisdiction="")):
        compliance_rules[item.rule_code] = item.penalty
    for item in compliance_rules_qs.filter(jurisdiction__iexact=draft.jurisdiction):
        compliance_rules[item.rule_code] = item.penalty

    return {
        "structure_sections": structure_rule.section_order if structure_rule else [],
        "mandatory_clauses": mandatory_clauses,
        "required_terms": required_terms,
        "prohibited_words": prohibited_words,
        "risk_patterns": risk_patterns,
        "legal_acts": legal_acts,
        "compliance_rules": compliance_rules,
    }


def _calculate_rule_score(
    missing_mandatory_clauses: list[str],
    prohibited_words_found: list[str],
    missing_legal_terms: list[str],
    structure_violations: list[str],
    penalty_map: dict[str, int],
) -> int:
    # Keep scoring meaningful even when ComplianceRule seed data is not present.
    effective_penalty_map = {**DEFAULT_RULE_PENALTIES, **(penalty_map or {})}
    penalty = 0
    penalty += len(missing_mandatory_clauses) * effective_penalty_map.get(
        RULE_CODE_MISSING_MANDATORY_CLAUSE, 0
    )
    penalty += len(prohibited_words_found) * effective_penalty_map.get(
        RULE_CODE_PROHIBITED_WORD, 0
    )
    penalty += len(missing_legal_terms) * effective_penalty_map.get(
        RULE_CODE_MISSING_REQUIRED_TERM, 0
    )
    penalty += len(structure_violations) * effective_penalty_map.get(
        RULE_CODE_STRUCTURE_VIOLATION, 0
    )
    return max(0, 100 - penalty)


def _detect_missing_values(content: str) -> list[str]:
    placeholders = set()
    for match in re.findall(r"\{\{\s*([a-zA-Z0-9_ .-]+)\s*\}\}", content or ""):
        placeholders.add(match.strip())
    if "____" in (content or ""):
        placeholders.add("Unfilled blank placeholder (____)")
    return sorted(placeholders)


def _build_validation_warnings(
    missing_mandatory_clauses: list[str],
    prohibited_words_found: list[str],
    missing_legal_terms: list[str],
    structure_violations: list[str],
    missing_values: list[str],
) -> list[str]:
    warnings = []
    if missing_mandatory_clauses:
        warnings.append(
            f"{len(missing_mandatory_clauses)} mandatory clause(s) missing."
        )
    if missing_legal_terms:
        warnings.append(f"{len(missing_legal_terms)} required legal term(s) missing.")
    if prohibited_words_found:
        warnings.append(f"{len(prohibited_words_found)} prohibited word(s) detected.")
    if structure_violations:
        warnings.append(f"{len(structure_violations)} structure violation(s) detected.")
    if missing_values:
        warnings.append(f"{len(missing_values)} missing value placeholder(s) detected.")
    return warnings


def run_compliance_check(draft) -> dict[str, Any]:
    context = _build_rule_context(draft)
    content = draft.content or ""

    missing_mandatory_clauses = check_mandatory_clauses(
        content, context["mandatory_clauses"]
    )
    prohibited_words_found = check_prohibited_words(content, context["prohibited_words"])
    missing_legal_terms = check_legal_terms(content, context["required_terms"])
    structure_violations = check_structure_order(content, context["structure_sections"])
    missing_values = _detect_missing_values(content)
    validation_warnings = _build_validation_warnings(
        missing_mandatory_clauses,
        prohibited_words_found,
        missing_legal_terms,
        structure_violations,
        missing_values,
    )

    compliance_score = _calculate_rule_score(
        missing_mandatory_clauses=missing_mandatory_clauses,
        prohibited_words_found=prohibited_words_found,
        missing_legal_terms=missing_legal_terms,
        structure_violations=structure_violations,
        penalty_map=context["compliance_rules"],
    )

    return {
        "missing_mandatory_clauses": missing_mandatory_clauses,
        "prohibited_words_found": prohibited_words_found,
        "missing_legal_terms": missing_legal_terms,
        "structure_violations": structure_violations,
        "missing_values": missing_values,
        "validation_warnings": validation_warnings,
        "compliance_score": compliance_score,
    }


def _build_ai_prompt(draft, context: dict[str, Any]) -> str:
    payload = {
        "instructions": {
            "task": "Analyze a legal draft for risk and legal quality.",
            "response_format": "JSON only, no markdown and no extra text.",
            "required_json_schema": {
                "overall_risk": "Low/Medium/High",
                "risk_explanation": "string",
                "missing_sections": [],
                "risky_clauses": [],
                "grammar_issues": [],
                "legal_improvements": [],
                "structural_suggestions": [],
            },
        },
        "draft": {
            "document_type": draft.document_type.name,
            "jurisdiction": draft.jurisdiction,
            "content": draft.content or "",
        },
        "database_rules": {
            "mandatory_clauses": context["mandatory_clauses"],
            "required_terms": context["required_terms"],
            "prohibited_words": context["prohibited_words"],
            "risk_patterns": context["risk_patterns"],
            "legal_acts": context["legal_acts"],
            "required_structure_sections": context["structure_sections"],
        },
    }
    return json.dumps(payload, ensure_ascii=True)


def run_ai_legal_review(draft) -> dict[str, Any]:
    context = _build_rule_context(draft)
    prompt = _build_ai_prompt(draft, context)

    ollama_url = getattr(settings, "OLLAMA_URL", "http://localhost:11434")
    ollama_model = getattr(settings, "OLLAMA_MODEL", "llama3")

    try:
        response = requests.post(
            f"{ollama_url}/api/generate",
            json={
                "model": ollama_model,
                "prompt": prompt,
                "stream": False,
                "format": "json",
            },
            timeout=120,
        )
        response.raise_for_status()
        raw_response = response.json().get("response", "").strip()
        parsed = json.loads(raw_response)
    except (requests.RequestException, json.JSONDecodeError, ValueError) as exc:
        return {
            "overall_risk": "Medium",
            "risk_explanation": f"AI analysis unavailable: {exc}",
            "missing_sections": [],
            "risky_clauses": [],
            "grammar_issues": [],
            "legal_improvements": [],
            "structural_suggestions": [],
        }

    return {
        "overall_risk": parsed.get("overall_risk", "Medium"),
        "risk_explanation": parsed.get("risk_explanation", ""),
        "missing_sections": parsed.get("missing_sections", []),
        "risky_clauses": parsed.get("risky_clauses", []),
        "grammar_issues": parsed.get("grammar_issues", []),
        "legal_improvements": parsed.get("legal_improvements", []),
        "structural_suggestions": parsed.get("structural_suggestions", []),
    }


def review_draft_compliance(draft) -> dict[str, Any]:
    rule_results = run_compliance_check(draft)
    ai_analysis = run_ai_legal_review(draft)
    risk_penalty = AI_RISK_PENALTY.get(ai_analysis["overall_risk"].upper(), 10)
    final_score = max(0, rule_results["compliance_score"] - risk_penalty)

    return {
        "draft_id": str(draft.id),
        "document_type": draft.document_type.name,
        "jurisdiction": draft.jurisdiction,
        "rule_engine_results": rule_results,
        "ai_analysis": ai_analysis,
        "final_compliance_score": final_score,
    }

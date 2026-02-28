from apps.compliance.services import run_ai_legal_review

from .llm_client import call_llm


def analyze_clause(text: str) -> dict:
    prompt = f"""
You are a legal AI reviewer.
Analyze this legal clause and return JSON only:
{{
  "risk_level": "Low/Medium/High",
  "issues": [],
  "improved_clause": ""
}}

Clause:
\"\"\"{text}\"\"\"
"""
    return call_llm(prompt)


def review_full_draft(text: str) -> dict:
    prompt = f"""
You are a legal AI reviewer.
Review the draft and return JSON only:
{{
  "overall_risk": "Low/Medium/High",
  "risk_explanation": "",
  "missing_sections": [],
  "risky_clauses": [],
  "grammar_issues": [],
  "legal_improvements": [],
  "structural_suggestions": []
}}

Draft:
\"\"\"{text}\"\"\"
"""
    return call_llm(prompt)


def review_draft_with_rules(draft):
    return run_ai_legal_review(draft)

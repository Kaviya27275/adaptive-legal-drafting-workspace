def build_full_review_prompt(
    text,
    mandatory,
    required_terms,
    prohibited_words,
    risk_patterns,
    structure_sections
):
    return f"""
You are an expert Indian legal AI compliance reviewer.

STRICTLY analyze the draft based on the following database rules.

MANDATORY CLAUSES:
{mandatory}

REQUIRED LEGAL TERMS:
{required_terms}

PROHIBITED WORDS:
{prohibited_words}

RISK PATTERNS:
{risk_patterns}

REQUIRED STRUCTURE SECTIONS:
{structure_sections}

------------------------------
DRAFT:
{text}
------------------------------

Return response ONLY in JSON:

{{
  "missing_mandatory_clauses": [],
  "missing_required_terms": [],
  "prohibited_words_found": [],
  "risk_patterns_detected": [],
  "structure_issues": [],
  "grammar_issues": [],
  "overall_risk": "Low/Medium/High",
  "compliance_score_estimate": 0,
  "suggested_improvements": []
}}
"""
import re
from shared.utils import normalize_text


# ----------------------------------------
# 1️⃣ Mandatory Clause Check
# ----------------------------------------
def check_mandatory_clauses(content, clause_list):
    missing = []
    content_normalized = normalize_text(content)

    for clause in clause_list:
        if normalize_text(clause) not in content_normalized:
            missing.append(clause)

    return missing


# ----------------------------------------
# 2️⃣ Prohibited Words
# ----------------------------------------
def check_prohibited_words(content, prohibited_list):
    found = []
    content_lower = content.lower()

    for word in prohibited_list:
        if word.lower() in content_lower:
            found.append(word)

    return found


# ----------------------------------------
# 3️⃣ Required Legal Terms
# ----------------------------------------
def check_legal_terms(content, required_terms):
    missing = []
    content_lower = content.lower()

    for term in required_terms:
        if term.lower() not in content_lower:
            missing.append(term)

    return missing


# ----------------------------------------
# 4️⃣ Structure Validation
# ----------------------------------------
def check_structure_order(content, expected_sections):
    issues = []
    content_lower = content.lower()
    current_position = 0

    for section in expected_sections:
        index = content_lower.find(section.lower())

        if index == -1:
            issues.append(f"Missing section: {section}")

        elif index < current_position:
            issues.append(f"Section out of order: {section}")

        else:
            current_position = index

    return issues


# ----------------------------------------
# 5️⃣ Risk Pattern Detection
# ----------------------------------------
def check_risk_patterns(content, risk_list):
    detected = []
    content_lower = content.lower()

    for pattern, level in risk_list:
        if pattern.lower() in content_lower:
            detected.append({
                "pattern": pattern,
                "risk_level": level
            })

    return detected
from .models import (
    DocumentType,
    LegalAct,
    DocumentActMapping,
    StructureRule,
    ClauseType,
    MandatoryClause,
    RequiredTerm,
    ProhibitedWord,
    RiskPattern,
    ComplianceRule,
)

# -----------------------------
# 1️⃣ DOCUMENT TYPES
# -----------------------------

DOCUMENT_TYPES = [
    "Non Disclosure Agreement",
    "Employment Agreement",
    "Service Agreement",
    "Consultancy Agreement",
    "Commercial Lease Agreement",
]

# -----------------------------
# 2️⃣ INDIAN LEGAL ACTS
# -----------------------------

LEGAL_ACTS = [
    ("Indian Contract Act, 1872", "Section 10"),
    ("Arbitration and Conciliation Act, 1996", ""),
    ("Information Technology Act, 2000", ""),
    ("Transfer of Property Act", ""),
    ("Payment of Wages Act", ""),
    ("Indian Stamp Act", ""),
]

# -----------------------------
# 3️⃣ STRUCTURE RULES
# -----------------------------

STRUCTURE_RULES = {
    "Non Disclosure Agreement": [
        "Title",
        "Parties",
        "Recitals",
        "Definitions",
        "Confidential Information",
        "Obligations",
        "Exclusions",
        "Term",
        "Termination",
        "Dispute Resolution",
        "Governing Law",
        "Jurisdiction",
        "Signatures"
    ],
    "Employment Agreement": [
        "Title",
        "Parties",
        "Position",
        "Compensation",
        "Working Hours",
        "Leave Policy",
        "Confidentiality",
        "Non-Compete",
        "Termination",
        "Notice Period",
        "Dispute Resolution",
        "Governing Law",
        "Signatures"
    ],
    "Service Agreement": [
        "Title",
        "Parties",
        "Scope of Services",
        "Payment Terms",
        "Indemnity",
        "Limitation of Liability",
        "Force Majeure",
        "Termination",
        "Arbitration",
        "Governing Law",
        "Signatures"
    ],
    "Consultancy Agreement": [
        "Title",
        "Parties",
        "Scope of Work",
        "Fees",
        "Independent Contractor",
        "Confidentiality",
        "Intellectual Property",
        "Termination",
        "Arbitration",
        "Governing Law",
        "Signatures"
    ],
    "Commercial Lease Agreement": [
        "Title",
        "Parties",
        "Property Description",
        "Lease Term",
        "Rent",
        "Security Deposit",
        "Maintenance",
        "Termination",
        "Governing Law",
        "Signatures"
    ],
}

# -----------------------------
# 4️⃣ MANDATORY CLAUSES
# -----------------------------

MANDATORY_CLAUSES = [
    "Confidentiality",
    "Termination",
    "Governing Law",
    "Dispute Resolution",
    "Arbitration",
    "Indemnity",
    "Limitation of Liability",
]

# -----------------------------
# 5️⃣ REQUIRED LEGAL TERMS
# -----------------------------

REQUIRED_TERMS = [
    "Governing Law",
    "Jurisdiction",
    "Arbitration",
    "Notice Period",
    "Force Majeure",
]

# -----------------------------
# 6️⃣ PROHIBITED & ABUSIVE WORDS
# -----------------------------

PROHIBITED_WORDS = [
    ("illegal", "Legal Risk", "High"),
    ("unlimited liability", "Legal Risk", "High"),
    ("at sole discretion without review", "Legal Risk", "Medium"),
    ("irrevocable forever", "Ambiguous", "Medium"),
    ("without notice", "Legal Risk", "High"),
]

# -----------------------------
# 7️⃣ RISK PATTERNS
# -----------------------------

RISK_PATTERNS = [
    ("at any time without notice", "High", "Unfair termination risk"),
    ("waive all legal rights", "High", "Unenforceable waiver risk"),
    ("best effort", "Medium", "Ambiguous performance obligation"),
]

# -----------------------------
# 8️⃣ COMPLIANCE SCORING RULES
# -----------------------------

COMPLIANCE_RULES = [
    ("Missing Mandatory Clause", "missing_mandatory_clause", 15),
    ("Missing Required Term", "missing_required_term", 10),
    ("Prohibited Word Used", "prohibited_word_used", 10),
    ("Structure Violation", "structure_violation", 5),
]


# -----------------------------
# SEED FUNCTION
# -----------------------------

def seed_compliance_data():

    # Create Document Types
    doc_objects = {}
    for name in DOCUMENT_TYPES:
        doc, _ = DocumentType.objects.get_or_create(name=name)
        doc_objects[name] = doc

    # Create Legal Acts
    act_objects = {}
    for act_name, section in LEGAL_ACTS:
        act, _ = LegalAct.objects.get_or_create(
            act_name=act_name,
            section_reference=section
        )
        act_objects[act_name] = act

    # Map Acts to All Document Types
    for doc in doc_objects.values():
        for act in act_objects.values():
            DocumentActMapping.objects.get_or_create(
                document_type=doc,
                legal_act=act
            )

    # Create Structure Rules
    for doc_name, sections in STRUCTURE_RULES.items():
        StructureRule.objects.get_or_create(
            document_type=doc_objects[doc_name],
            section_order=sections
        )

    # Create Clause Types
    clause_objects = {}
    for clause in MANDATORY_CLAUSES:
        ct, _ = ClauseType.objects.get_or_create(name=clause)
        clause_objects[clause] = ct

    # Assign Mandatory Clauses to Each Document
    for doc in doc_objects.values():
        for clause in clause_objects.values():
            MandatoryClause.objects.get_or_create(
                document_type=doc,
                clause_type=clause
            )

    # Required Terms
    for doc in doc_objects.values():
        for term in REQUIRED_TERMS:
            RequiredTerm.objects.get_or_create(
                document_type=doc,
                term=term
            )

    # Prohibited Words
    for word, category, severity in PROHIBITED_WORDS:
        ProhibitedWord.objects.get_or_create(
            word=word,
            category=category,
            severity=severity
        )

    # Risk Patterns
    for pattern, level, explanation in RISK_PATTERNS:
        RiskPattern.objects.get_or_create(
            pattern=pattern,
            risk_level=level,
            explanation=explanation
        )

    # Compliance Rules
    for name, code, penalty in COMPLIANCE_RULES:
        ComplianceRule.objects.get_or_create(
            rule_name=name,
            rule_code=code,
            penalty=penalty
        )

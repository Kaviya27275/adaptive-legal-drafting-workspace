from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.drafts.models import Draft
from .models import ClauseType, ComplianceRule, DocumentType, MandatoryClause
from .services import run_compliance_check

User = get_user_model()


class ComplianceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="compuser", password="pass123")
        self.document_type = DocumentType.objects.create(name="NDA")
        clause_type = ClauseType.objects.create(name="Confidentiality")
        MandatoryClause.objects.create(
            document_type=self.document_type,
            clause_type=clause_type,
        )
        ComplianceRule.objects.create(
            rule_name="Missing Mandatory Clause",
            rule_code="missing_mandatory_clause",
            penalty=10,
        )
        ComplianceRule.objects.create(
            rule_name="Missing Required Term",
            rule_code="missing_required_term",
            penalty=10,
        )
        ComplianceRule.objects.create(
            rule_name="Prohibited Word Used",
            rule_code="prohibited_word_used",
            penalty=10,
        )
        ComplianceRule.objects.create(
            rule_name="Structure Violation",
            rule_code="structure_violation",
            penalty=10,
        )
        self.draft = Draft.objects.create(
            title="Test Draft",
            document_type=self.document_type,
            jurisdiction="India",
            content="This agreement includes payment terms.",
            created_by=self.user,
        )

    def test_compliance(self):
        result = run_compliance_check(self.draft)
        self.assertIn("compliance_score", result)

    def test_compliance_uses_default_penalties_when_rules_missing(self):
        ComplianceRule.objects.all().delete()

        result = run_compliance_check(self.draft)

        self.assertGreater(len(result["missing_mandatory_clauses"]), 0)
        self.assertGreater(len(result["validation_warnings"]), 0)
        self.assertLess(result["compliance_score"], 100)

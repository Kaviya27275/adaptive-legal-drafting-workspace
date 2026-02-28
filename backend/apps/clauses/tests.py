from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.compliance.models import DocumentType
from apps.drafts.models import Draft
from .models import Clause, ClauseLibraryEntry, ClauseRedlineSuggestion
from .services import semantic_clause_search

User = get_user_model()


class ClauseTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="clauseuser",
            password="pass123"
        )
        self.document_type = DocumentType.objects.create(name="NDA")

        self.draft = Draft.objects.create(
            title="Test Draft",
            document_type=self.document_type,
            jurisdiction="India",
            created_by=self.user
        )

    def test_create_clause(self):
        clause = Clause.objects.create(
            draft=self.draft,
            title="Payment Clause",
            text="Payment must be made within 30 days.",
            clause_type="PAYMENT",
            position=1
        )
        self.assertEqual(clause.clause_type, "PAYMENT")

    def test_semantic_clause_library_search(self):
        ClauseLibraryEntry.objects.create(
            document_type=self.document_type,
            title="Confidentiality Core",
            text="Receiving party must keep confidential information secret.",
            clause_type="CONFIDENTIALITY",
            tags=["nda", "confidentiality"],
            fallback_alternatives=["Use mutual confidentiality wording"],
            negotiation_playbook={"fallback": "mutual NDA"},
        )
        results = semantic_clause_search("confidentiality obligations", self.document_type.id)
        self.assertTrue(len(results) >= 1)

    def test_redline_acceptance_updates_clause(self):
        clause = Clause.objects.create(
            draft=self.draft,
            title="Termination",
            text="Either party may terminate immediately.",
            clause_type="TERMINATION",
            position=1,
        )
        suggestion = ClauseRedlineSuggestion.objects.create(
            draft=self.draft,
            clause=clause,
            original_text=clause.text,
            suggested_text="Either party may terminate with 30 days written notice.",
            rationale="Adds clearer notice period.",
            suggested_by=self.user,
        )
        suggestion.mark_accepted(self.user)
        clause.text = suggestion.suggested_text
        clause.save()
        clause.refresh_from_db()
        self.assertIn("30 days", clause.text)

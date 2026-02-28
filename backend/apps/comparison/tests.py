from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.compliance.models import DocumentType
from apps.drafts.models import Draft
from apps.versions.services import save_version
from .services import compare_versions

User = get_user_model()


class ComparisonTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="compareuser",
            password="pass123"
        )
        self.document_type = DocumentType.objects.create(name="NDA")

        self.draft = Draft.objects.create(
            title="Compare Draft",
            document_type=self.document_type,
            jurisdiction="India",
            content="First version content",
            created_by=self.user
        )

        self.v1 = save_version(self.draft, self.user)

        self.draft.content = "Second version modified content"
        self.draft.save()

        self.v2 = save_version(self.draft, self.user)

    def test_compare(self):
        result = compare_versions(self.v1.id, self.v2.id, self.user)
        self.assertIn("word_diff", result)

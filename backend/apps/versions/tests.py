from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.compliance.models import DocumentType
from apps.drafts.models import Draft
from .services import save_version

User = get_user_model()


class VersionTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="versionuser",
            password="pass123"
        )
        self.document_type = DocumentType.objects.create(name="NDA")

        self.draft = Draft.objects.create(
            title="Version Draft",
            document_type=self.document_type,
            jurisdiction="India",
            content="Initial content",
            created_by=self.user
        )

    def test_save_version(self):
        version = save_version(self.draft, self.user)
        self.assertEqual(version.version_number, 1)

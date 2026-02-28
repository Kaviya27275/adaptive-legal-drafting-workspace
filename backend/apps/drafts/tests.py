from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.compliance.models import DocumentType
from apps.versions.models import Version
from apps.versions.services import save_version
from .models import Draft, DraftSandbox

User = get_user_model()


class DraftFeatureTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="testuser", password="pass123")
        self.client.force_authenticate(self.user)
        self.document_type = DocumentType.objects.create(name="Non Disclosure Agreement")
        self.draft = Draft.objects.create(
            title="Test Draft",
            document_type=self.document_type,
            jurisdiction="India",
            content="Initial draft content",
            created_by=self.user,
        )

    def test_template_render_contains_dynamic_date_and_jurisdiction(self):
        response = self.client.get(
            f"/api/drafts/templates/{self.document_type.id}/render/?jurisdiction=India"
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("Date:", response.data["template_content"])
        self.assertIn("India", response.data["template_content"])

    def test_sandbox_commit_updates_draft(self):
        start = self.client.post(f"/api/drafts/sandbox/start/{self.draft.id}/")
        self.assertEqual(start.status_code, 200)
        sandbox_id = start.data["sandbox"]["id"]

        update = self.client.patch(
            f"/api/drafts/sandbox/{sandbox_id}/update/",
            {"sandbox_content": "Sandbox revised content"},
            format="json",
        )
        self.assertEqual(update.status_code, 200)

        commit = self.client.post(f"/api/drafts/sandbox/{sandbox_id}/commit/")
        self.assertEqual(commit.status_code, 200)

        self.draft.refresh_from_db()
        self.assertEqual(self.draft.content, "Sandbox revised content")
        self.assertFalse(DraftSandbox.objects.get(id=sandbox_id).is_active)

    def test_draft_versions_increment_on_save(self):
        self.draft.content = "Version one content"
        save_version(self.draft, self.user)

        self.draft.content = "Version two content"
        save_version(self.draft, self.user)

        versions = Version.objects.filter(draft=self.draft).order_by("version_number")
        self.assertEqual(versions.count(), 2)
        self.assertEqual(versions[0].version_number, 1)
        self.assertEqual(versions[0].snapshot, "Version one content")
        self.assertEqual(versions[1].version_number, 2)
        self.assertEqual(versions[1].snapshot, "Version two content")

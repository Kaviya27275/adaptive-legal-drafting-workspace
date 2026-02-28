from django.db import models
from django.conf import settings
from shared.base_models import TimeStampedModel
from apps.compliance.models import DocumentType


class Draft(TimeStampedModel):
    title = models.CharField(max_length=255)
    document_type = models.ForeignKey(
        DocumentType,
        on_delete=models.CASCADE,
        related_name="drafts",
    )
    jurisdiction = models.CharField(max_length=100)
    content = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="drafts",
    )
    is_active = models.BooleanField(default=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.title} ({self.document_type.name})"


class DraftSandbox(TimeStampedModel):
    draft = models.ForeignKey(
        Draft,
        on_delete=models.CASCADE,
        related_name="sandboxes",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="draft_sandboxes",
    )
    sandbox_content = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Sandbox {self.id} for draft {self.draft_id}"

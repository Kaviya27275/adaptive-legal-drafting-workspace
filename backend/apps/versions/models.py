from django.db import models
from apps.drafts.models import Draft
from shared.base_models import TimeStampedModel


class Version(TimeStampedModel):

    draft = models.ForeignKey(
        Draft,
        on_delete=models.CASCADE,
        related_name="versions"
    )

    snapshot = models.TextField()  # TipTap HTML/JSON
    version_number = models.PositiveIntegerField()

    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True
    )

    class Meta:
        ordering = ['-version_number']

    def __str__(self):
        return f"Version {self.version_number} - {self.draft.title}"
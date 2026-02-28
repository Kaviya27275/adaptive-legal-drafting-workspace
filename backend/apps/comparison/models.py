from django.db import models
from shared.base_models import TimeStampedModel


class ComparisonLog(TimeStampedModel):

    draft_id = models.IntegerField()
    version_a = models.IntegerField()
    version_b = models.IntegerField()
    compared_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True
    )

    def __str__(self):
        return f"Draft {self.draft_id} - V{self.version_a} vs V{self.version_b}"
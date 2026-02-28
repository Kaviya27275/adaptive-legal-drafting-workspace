from django.db import models
from shared.base_models import TimeStampedModel


class Precedent(TimeStampedModel):

    DOCUMENT_TYPES = (
        ('NDA', 'Non Disclosure Agreement'),
        ('EMPLOYMENT', 'Employment Contract'),
        ('SERVICE', 'Service Agreement'),
        ('NOTICE', 'Legal Notice'),
    )

    title = models.CharField(max_length=255)
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPES)
    content = models.TextField()

    is_clause_template = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.title} ({self.document_type})"
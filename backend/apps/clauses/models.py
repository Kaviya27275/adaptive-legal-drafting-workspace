from django.db import models
from django.utils import timezone
from apps.compliance.models import DocumentType
from apps.drafts.models import Draft
from shared.base_models import TimeStampedModel


class Clause(TimeStampedModel):

    CLAUSE_TYPES = (
        ('PAYMENT', 'Payment'),
        ('TERMINATION', 'Termination'),
        ('CONFIDENTIALITY', 'Confidentiality'),
        ('LIABILITY', 'Liability'),
        ('OTHER', 'Other'),
    )

    draft = models.ForeignKey(
        Draft,
        on_delete=models.CASCADE,
        related_name="clauses"
    )

    title = models.CharField(max_length=255)
    text = models.TextField()

    clause_type = models.CharField(
        max_length=50,
        choices=CLAUSE_TYPES,
        default='OTHER'
    )

    position = models.PositiveIntegerField(default=0)

    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['position']

    def __str__(self):
        return f"{self.title} ({self.draft.title})"


class ClauseLibraryEntry(TimeStampedModel):
    document_type = models.ForeignKey(
        DocumentType,
        on_delete=models.CASCADE,
        related_name="clause_library_entries",
    )
    title = models.CharField(max_length=255)
    text = models.TextField()
    clause_type = models.CharField(max_length=50, choices=Clause.CLAUSE_TYPES, default="OTHER")
    tags = models.JSONField(default=list, blank=True)
    fallback_alternatives = models.JSONField(default=list, blank=True)
    negotiation_playbook = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.title} [{self.document_type.name}]"


class ClauseRedlineSuggestion(TimeStampedModel):
    STATUS_CHOICES = (
        ("proposed", "Proposed"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
    )

    draft = models.ForeignKey(Draft, on_delete=models.CASCADE, related_name="redline_suggestions")
    clause = models.ForeignKey(
        Clause,
        on_delete=models.SET_NULL,
        related_name="redline_suggestions",
        null=True,
        blank=True,
    )
    original_text = models.TextField()
    suggested_text = models.TextField()
    rationale = models.TextField(blank=True)
    diff_preview = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="proposed")
    suggested_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        related_name="proposed_redlines",
        null=True,
    )
    reviewed_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        related_name="reviewed_redlines",
        null=True,
        blank=True,
    )
    accepted_at = models.DateTimeField(null=True, blank=True)

    def mark_accepted(self, reviewer):
        self.status = "accepted"
        self.reviewed_by = reviewer
        self.accepted_at = timezone.now()
        self.save(update_fields=["status", "reviewed_by", "accepted_at", "updated_at"])

    def mark_rejected(self, reviewer):
        self.status = "rejected"
        self.reviewed_by = reviewer
        self.save(update_fields=["status", "reviewed_by", "updated_at"])

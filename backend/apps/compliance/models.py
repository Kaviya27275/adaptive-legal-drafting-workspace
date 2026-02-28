from django.db import models
from shared.base_models import TimeStampedModel


class DocumentType(TimeStampedModel):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name


class LegalAct(TimeStampedModel):
    act_name = models.CharField(max_length=255)
    section_reference = models.CharField(max_length=255, blank=True, null=True)
    jurisdiction = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return self.act_name


class DocumentActMapping(TimeStampedModel):
    document_type = models.ForeignKey(DocumentType, on_delete=models.CASCADE)
    legal_act = models.ForeignKey(LegalAct, on_delete=models.CASCADE)
    jurisdiction = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["document_type", "legal_act", "jurisdiction"],
                name="unique_document_act_mapping_per_jurisdiction",
            )
        ]


class StructureRule(TimeStampedModel):
    document_type = models.ForeignKey(DocumentType, on_delete=models.CASCADE)
    jurisdiction = models.CharField(max_length=100, blank=True, null=True)
    section_order = models.JSONField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["document_type", "jurisdiction"],
                name="unique_structure_rule_per_jurisdiction",
            )
        ]


class ClauseType(TimeStampedModel):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class MandatoryClause(TimeStampedModel):
    document_type = models.ForeignKey(DocumentType, on_delete=models.CASCADE)
    jurisdiction = models.CharField(max_length=100, blank=True, null=True)
    clause_type = models.ForeignKey(ClauseType, on_delete=models.CASCADE)
    required_text = models.TextField(blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["document_type", "jurisdiction", "clause_type"],
                name="unique_mandatory_clause_per_jurisdiction",
            )
        ]


class RequiredTerm(TimeStampedModel):
    document_type = models.ForeignKey(DocumentType, on_delete=models.CASCADE)
    jurisdiction = models.CharField(max_length=100, blank=True, null=True)
    term = models.CharField(max_length=255)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["document_type", "jurisdiction", "term"],
                name="unique_required_term_per_jurisdiction",
            )
        ]


class ProhibitedWord(TimeStampedModel):
    document_type = models.ForeignKey(
        DocumentType,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
    )
    jurisdiction = models.CharField(max_length=100, blank=True, null=True)
    word = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    severity = models.CharField(max_length=50)


class RiskPattern(TimeStampedModel):
    document_type = models.ForeignKey(
        DocumentType,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
    )
    jurisdiction = models.CharField(max_length=100, blank=True, null=True)
    pattern = models.CharField(max_length=255)
    risk_level = models.CharField(max_length=50)
    explanation = models.TextField()


class ComplianceRule(TimeStampedModel):
    document_type = models.ForeignKey(
        DocumentType,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
    )
    jurisdiction = models.CharField(max_length=100, blank=True, null=True)
    rule_name = models.CharField(max_length=255)
    rule_code = models.CharField(max_length=64)
    penalty = models.IntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["document_type", "jurisdiction", "rule_code"],
                name="unique_compliance_rule_per_jurisdiction",
            )
        ]

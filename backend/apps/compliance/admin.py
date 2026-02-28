from django.contrib import admin
from .models import (
    DocumentType,
    LegalAct,
    DocumentActMapping,
    StructureRule,
    ClauseType,
    MandatoryClause,
    RequiredTerm,
    ProhibitedWord,
    RiskPattern,
    ComplianceRule,
)


admin.site.register(DocumentType)
admin.site.register(LegalAct)
admin.site.register(DocumentActMapping)
admin.site.register(StructureRule)
admin.site.register(ClauseType)
admin.site.register(MandatoryClause)
admin.site.register(RequiredTerm)
admin.site.register(ProhibitedWord)
admin.site.register(RiskPattern)
admin.site.register(ComplianceRule)
from django.contrib import admin
from .models import Precedent


@admin.register(Precedent)
class PrecedentAdmin(admin.ModelAdmin):
    list_display = ['title', 'document_type', 'is_clause_template']
    list_filter = ['document_type']
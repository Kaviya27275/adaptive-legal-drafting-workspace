from django.contrib import admin
from .models import Clause


@admin.register(Clause)
class ClauseAdmin(admin.ModelAdmin):
    list_display = ['title', 'draft', 'clause_type', 'position']
    list_filter = ['clause_type']
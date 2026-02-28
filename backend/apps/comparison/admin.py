from django.contrib import admin
from .models import ComparisonLog


@admin.register(ComparisonLog)
class ComparisonAdmin(admin.ModelAdmin):
    list_display = ['draft_id', 'version_a', 'version_b', 'compared_by']
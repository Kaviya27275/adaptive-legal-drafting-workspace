from django.contrib import admin
from .models import Version


@admin.register(Version)
class VersionAdmin(admin.ModelAdmin):
    list_display = ['draft', 'version_number', 'created_by', 'created_at']
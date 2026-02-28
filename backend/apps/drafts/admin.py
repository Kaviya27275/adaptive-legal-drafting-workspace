from django.contrib import admin
from .models import Draft, DraftSandbox


@admin.register(Draft)
class DraftAdmin(admin.ModelAdmin):
    list_display = ["title", "document_type", "jurisdiction", "created_by", "created_at"]
    list_filter = ["document_type", "jurisdiction"]


@admin.register(DraftSandbox)
class DraftSandboxAdmin(admin.ModelAdmin):
    list_display = ["id", "draft", "created_by", "is_active", "created_at"]
    list_filter = ["is_active", "created_at"]

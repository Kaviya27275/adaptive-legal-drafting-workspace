from rest_framework.routers import DefaultRouter
from django.urls import path

from .views import (
    DraftAIAssistView,
    DraftAIDraftView,
    DraftDocumentAnalysisView,
    DraftSandboxAssistView,
    DraftSandboxCommitView,
    DraftSandboxDiscardView,
    DraftSandboxStartView,
    DraftSandboxUpdateView,
    DraftTemplateListView,
    DraftTemplateRenderView,
    DraftTrashListView,
    DraftTrashDeleteView,
    DraftTrashDeleteAllView,
    DraftTrashRestoreView,
    DraftUploadAnalyzeView,
    DraftViewSet,
    DraftExportView,
)

router = DefaultRouter()
router.register('', DraftViewSet, basename='draft')

urlpatterns = [
    path("upload-analyze/", DraftUploadAnalyzeView.as_view()),
    path("templates/", DraftTemplateListView.as_view()),
    path("templates/<int:document_type_id>/render/", DraftTemplateRenderView.as_view()),
    path("assist/", DraftAIAssistView.as_view()),
    path("analyze-document/", DraftDocumentAnalysisView.as_view()),
    path("ai-draft/", DraftAIDraftView.as_view()),
    path("<int:draft_id>/export/", DraftExportView.as_view()),
    path("trash/", DraftTrashListView.as_view()),
    path("trash/<int:draft_id>/delete/", DraftTrashDeleteView.as_view()),
    path("trash/delete-all/", DraftTrashDeleteAllView.as_view()),
    path("trash/<int:draft_id>/restore/", DraftTrashRestoreView.as_view()),
    path("sandbox/start/<int:draft_id>/", DraftSandboxStartView.as_view()),
    path("sandbox/<int:sandbox_id>/update/", DraftSandboxUpdateView.as_view()),
    path("sandbox/<int:sandbox_id>/assist/", DraftSandboxAssistView.as_view()),
    path("sandbox/<int:sandbox_id>/commit/", DraftSandboxCommitView.as_view()),
    path("sandbox/<int:sandbox_id>/discard/", DraftSandboxDiscardView.as_view()),
] + router.urls

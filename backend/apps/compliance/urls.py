from django.urls import path
from .views import ComplianceCheckView, ComplianceReviewView, DocumentTypeListView

urlpatterns = [
    path("document-types/", DocumentTypeListView.as_view()),
    path("check/<int:draft_id>/", ComplianceCheckView.as_view()),
    path("review/<int:draft_id>/", ComplianceReviewView.as_view()),
]

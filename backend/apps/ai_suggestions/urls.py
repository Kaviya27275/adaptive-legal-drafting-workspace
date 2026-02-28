from django.urls import path
from .views import ClauseAIAnalysisView, FullDraftAIReviewView

urlpatterns = [
    path('clause-analyze/', ClauseAIAnalysisView.as_view()),
    path('draft-review/<int:draft_id>/', FullDraftAIReviewView.as_view()),
]
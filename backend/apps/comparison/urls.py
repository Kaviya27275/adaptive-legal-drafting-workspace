from django.urls import path
from .views import CompareDraftsView, CompareVersionsView, ComparisonLogListView

urlpatterns = [
    path('versions/', CompareVersionsView.as_view()),
    path('drafts/', CompareDraftsView.as_view()),
    path('logs/', ComparisonLogListView.as_view()),
]

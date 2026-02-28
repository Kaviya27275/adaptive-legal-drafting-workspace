from django.urls import path
from .views import (
    CompareDraftVersionsView,
    ListVersionsView,
    RestoreVersionView,
    SaveVersionView,
)

urlpatterns = [
    path('save/<int:draft_id>/', SaveVersionView.as_view()),
    path('list/<int:draft_id>/', ListVersionsView.as_view()),
    path('restore/<int:version_id>/', RestoreVersionView.as_view()),
    path("compare/", CompareDraftVersionsView.as_view()),
]

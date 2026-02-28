from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    ClauseLibrarySemanticSearchView,
    ClauseLibraryByDocumentTypeView,
    ClauseLibraryViewSet,
    ClauseRedlineActionView,
    ClauseRedlineSuggestionView,
    ClauseViewSet,
)

router = DefaultRouter()
router.register("library", ClauseLibraryViewSet, basename="clause-library")
router.register('', ClauseViewSet, basename='clause')

urlpatterns = [
    path("library/semantic-search/", ClauseLibrarySemanticSearchView.as_view()),
    path("redlines/", ClauseRedlineSuggestionView.as_view()),
    path("redlines/<int:suggestion_id>/<str:action>/", ClauseRedlineActionView.as_view()),
    path("library/by-document-type/", ClauseLibraryByDocumentTypeView.as_view()),
] + router.urls

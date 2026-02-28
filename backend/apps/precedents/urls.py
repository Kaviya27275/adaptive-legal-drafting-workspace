from django.urls import path
from .views import (
    PrecedentListView,
    PrecedentByTypeView,
    PrecedentSearchView,
    InsertPrecedentView
)

urlpatterns = [
    path('', PrecedentListView.as_view()),
    path('type/<str:document_type>/', PrecedentByTypeView.as_view()),
    path('search/', PrecedentSearchView.as_view()),
    path('insert/<int:draft_id>/<int:precedent_id>/', InsertPrecedentView.as_view()),
]
"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from django.http import JsonResponse


def api_root(_request):
    return JsonResponse(
        {
            "name": "Lexora API",
            "status": "running",
            "docs_hint": "Use /api/users/, /api/drafts/, /api/clauses/, /api/compliance/ and other /api/* routes.",
        }
    )

urlpatterns = [
    path("", api_root),
    path("admin/", admin.site.urls),
    path("api/users/", include("apps.users.urls")),
    path("api/drafts/", include("apps.drafts.urls")),
    path("api/clauses/", include("apps.clauses.urls")),
    path("api/compliance/", include("apps.compliance.urls")),
    path("api/ai/", include("apps.ai_suggestions.urls")),
    path("api/versions/", include("apps.versions.urls")),
    path("api/comparison/", include("apps.comparison.urls")),
    path("api/precedents/", include("apps.precedents.urls")),
]

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.versions.models import Version
from apps.drafts.models import Draft
from core.permissions import IsLegalRole
from .models import ComparisonLog
from .services import compare_drafts, compare_versions


class CompareVersionsView(APIView):

    permission_classes = [IsAuthenticated, IsLegalRole]

    def post(self, request):

        version_a = request.data.get("version_a")
        version_b = request.data.get("version_b")

        if not version_a or not version_b:
            return Response({"error": "Both version IDs required"}, status=400)

        versions = Version.objects.select_related("draft").filter(id__in=[version_a, version_b])
        if versions.count() != 2:
            return Response({"error": "Version not found"}, status=404)
        if request.user.role != "admin" and versions.filter(draft__created_by=request.user).count() != 2:
            return Response({"error": "Version not found"}, status=404)

        result = compare_versions(version_a, version_b, request.user)

        return Response(result)


class CompareDraftsView(APIView):

    permission_classes = [IsAuthenticated, IsLegalRole]

    def _draft_queryset(self, request):
        if request.user.role == "admin":
            return Draft.objects.filter(is_active=True, deleted_at__isnull=True)
        return Draft.objects.filter(created_by=request.user, is_active=True, deleted_at__isnull=True)

    def post(self, request):
        draft_a = request.data.get("draft_a")
        draft_b = request.data.get("draft_b")

        if not draft_a or not draft_b:
            return Response({"error": "Both draft IDs required"}, status=400)

        drafts = self._draft_queryset(request).filter(id__in=[draft_a, draft_b])
        if drafts.count() != 2:
            return Response({"error": "Draft not found"}, status=404)

        result = compare_drafts(draft_a, draft_b, request.user)
        return Response(result)


class ComparisonLogListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role == "admin":
            logs = ComparisonLog.objects.all().order_by("-created_at")[:200]
        else:
            logs = ComparisonLog.objects.filter(compared_by=request.user).order_by("-created_at")[:200]
        return Response(
            [
                {
                    "draft_id": log.draft_id,
                    "version_a": log.version_a,
                    "version_b": log.version_b,
                    "created_at": log.created_at,
                }
                for log in logs
            ]
        )

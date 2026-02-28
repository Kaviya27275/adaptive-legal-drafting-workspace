from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.drafts.models import Draft
from apps.comparison.services import compare_versions
from core.permissions import IsLegalRole, IsRoleWriteAllowed
from .models import Version
from .services import save_version, restore_version
from .serializers import VersionSerializer


class SaveVersionView(APIView):
    permission_classes = [IsAuthenticated, IsRoleWriteAllowed]

    def _draft_queryset(self, request):
        if request.user.role == "admin":
            return Draft.objects.filter(is_active=True, deleted_at__isnull=True)
        return Draft.objects.filter(created_by=request.user, is_active=True, deleted_at__isnull=True)

    def post(self, request, draft_id):
        draft = self._draft_queryset(request).filter(id=draft_id).first()
        if not draft:
            return Response({"error": "Draft not found"}, status=404)

        version = save_version(draft, request.user)

        return Response({
            "message": "Version saved",
            "version_number": version.version_number
        })


class ListVersionsView(APIView):
    permission_classes = [IsAuthenticated, IsLegalRole]

    def _draft_queryset(self, request):
        if request.user.role == "admin":
            return Draft.objects.filter(is_active=True, deleted_at__isnull=True)
        return Draft.objects.filter(created_by=request.user, is_active=True, deleted_at__isnull=True)

    def get(self, request, draft_id):
        if not self._draft_queryset(request).filter(id=draft_id).exists():
            return Response({"error": "Draft not found"}, status=404)
        versions = Version.objects.filter(draft_id=draft_id)
        serializer = VersionSerializer(versions, many=True)

        return Response(serializer.data)


class RestoreVersionView(APIView):
    permission_classes = [IsAuthenticated, IsRoleWriteAllowed]

    def _version_queryset(self, request):
        if request.user.role == "admin":
            return Version.objects.select_related("draft")
        return Version.objects.select_related("draft").filter(draft__created_by=request.user)

    def post(self, request, version_id):
        version = self._version_queryset(request).filter(id=version_id).first()
        if not version:
            return Response({"error": "Version not found"}, status=404)

        restore_version(version.draft, version)

        return Response({"message": "Version restored successfully"})


class CompareDraftVersionsView(APIView):
    permission_classes = [IsAuthenticated, IsLegalRole]

    def _version_queryset(self, request):
        if request.user.role == "admin":
            return Version.objects.select_related("draft")
        return Version.objects.select_related("draft").filter(draft__created_by=request.user)

    def post(self, request):
        version_a_id = request.data.get("version_a")
        version_b_id = request.data.get("version_b")
        if not version_a_id or not version_b_id:
            return Response({"error": "version_a and version_b are required"}, status=400)

        version_a = self._version_queryset(request).filter(id=version_a_id).first()
        version_b = self._version_queryset(request).filter(id=version_b_id).first()
        if not version_a or not version_b:
            return Response({"error": "Version not found"}, status=404)
        if version_a.draft_id != version_b.draft_id:
            return Response({"error": "Versions must belong to same draft"}, status=400)

        return Response(compare_versions(version_a.id, version_b.id, request.user))

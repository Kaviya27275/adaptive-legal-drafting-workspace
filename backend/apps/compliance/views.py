from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.drafts.models import Draft
from core.permissions import IsLegalRole, IsRoleWriteAllowed
from .models import DocumentType
from .services import review_draft_compliance, run_compliance_check


class ComplianceCheckView(APIView):
    permission_classes = [IsAuthenticated, IsLegalRole]

    def _get_draft(self, request, draft_id):
        if request.user.role == "admin":
            return Draft.objects.filter(id=draft_id, deleted_at__isnull=True).first()
        return Draft.objects.filter(id=draft_id, created_by=request.user, deleted_at__isnull=True).first()

    def post(self, request, draft_id):
        draft = self._get_draft(request, draft_id)
        if not draft:
            return Response({"error": "Draft not found"}, status=404)

        result = run_compliance_check(draft)
        return Response(result)


class ComplianceReviewView(APIView):
    permission_classes = [IsAuthenticated, IsLegalRole]

    def _get_draft(self, request, draft_id):
        if request.user.role == "admin":
            return Draft.objects.filter(id=draft_id, deleted_at__isnull=True).first()
        return Draft.objects.filter(id=draft_id, created_by=request.user, deleted_at__isnull=True).first()

    def post(self, request, draft_id):
        draft = self._get_draft(request, draft_id)
        if not draft:
            return Response({"error": "Draft not found"}, status=404)

        try:
            result = review_draft_compliance(draft)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=400)

        return Response(result)


class DocumentTypeListView(APIView):
    permission_classes = [IsAuthenticated, IsRoleWriteAllowed]

    def get(self, request):
        items = DocumentType.objects.order_by("name").values("id", "name")
        return Response(list(items))

    def post(self, request):
        name = (request.data.get("name") or "").strip()
        if not name:
            return Response({"error": "name is required"}, status=400)
        item, _ = DocumentType.objects.get_or_create(name=name)
        return Response({"id": item.id, "name": item.name}, status=201)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.drafts.models import Draft
from core.permissions import IsLegalRole
from .services import analyze_clause, review_draft_with_rules


class ClauseAIAnalysisView(APIView):

    permission_classes = [IsAuthenticated, IsLegalRole]

    def post(self, request):
        text = request.data.get("text")

        if not text:
            return Response({"error": "Text is required"}, status=400)

        result = analyze_clause(text)

        return Response({"analysis": result})


class FullDraftAIReviewView(APIView):

    permission_classes = [IsAuthenticated, IsLegalRole]

    def _get_draft(self, request, draft_id):
        if request.user.role == "admin":
            return Draft.objects.filter(id=draft_id).first()
        return Draft.objects.filter(id=draft_id, created_by=request.user).first()

    def post(self, request, draft_id):
        draft = self._get_draft(request, draft_id)
        if not draft:
            return Response({"error": "Draft not found"}, status=404)

        result = review_draft_with_rules(draft)

        return Response({"review": result})

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.drafts.models import Draft
from apps.versions.services import save_version
from core.permissions import IsLegalRole, IsRoleWriteAllowed

from .models import Clause, ClauseLibraryEntry, ClauseRedlineSuggestion
from .serializers import (
    ClauseLibraryEntrySerializer,
    ClauseRedlineSuggestionSerializer,
    ClauseSerializer,
)
from .services import build_redline_diff, reorder_clauses, semantic_clause_search


class ClauseViewSet(viewsets.ModelViewSet):
    serializer_class = ClauseSerializer
    permission_classes = [permissions.IsAuthenticated, IsRoleWriteAllowed]

    def _draft_queryset(self):
        if self.request.user.role == "admin":
            return Draft.objects.filter(is_active=True, deleted_at__isnull=True)
        return Draft.objects.filter(created_by=self.request.user, is_active=True, deleted_at__isnull=True)

    def get_queryset(self):
        draft_id = self.request.query_params.get("draft")
        queryset = Clause.objects.filter(is_active=True, draft__in=self._draft_queryset())
        if draft_id:
            queryset = queryset.filter(draft_id=draft_id)
        return queryset

    def perform_create(self, serializer):
        draft = serializer.validated_data["draft"]
        if not self._draft_queryset().filter(id=draft.id).exists():
            raise permissions.PermissionDenied("You do not have access to this draft.")
        if "position" not in serializer.validated_data:
            max_position = (
                Clause.objects.filter(draft=draft, is_active=True)
                .order_by("-position")
                .values_list("position", flat=True)
                .first()
            )
            serializer.save(position=(max_position + 1) if max_position is not None else 0)
            return
        serializer.save()

    def perform_update(self, serializer):
        clause = serializer.save()
        save_version(clause.draft, self.request.user)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active"])
        save_version(instance.draft, self.request.user)

    @action(detail=False, methods=["post"], url_path="reorder")
    def reorder(self, request):
        draft_id = request.data.get("draft_id")
        ordered_ids = request.data.get("ordered_clause_ids")
        if not draft_id or not isinstance(ordered_ids, list):
            return Response(
                {"error": "draft_id and ordered_clause_ids are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        draft = self._draft_queryset().filter(id=draft_id).first()
        if not draft:
            return Response({"error": "Draft not found."}, status=status.HTTP_404_NOT_FOUND)
        active_count = Clause.objects.filter(draft=draft, is_active=True).count()
        if active_count != len(ordered_ids):
            return Response(
                {"error": "ordered_clause_ids must include all active clauses in draft."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        reorder_clauses(draft, ordered_ids)
        save_version(draft, request.user)
        return Response({"message": "Clauses reordered successfully."})


class ClauseLibraryViewSet(viewsets.ModelViewSet):
    serializer_class = ClauseLibraryEntrySerializer
    permission_classes = [permissions.IsAuthenticated, IsRoleWriteAllowed]

    def get_queryset(self):
        queryset = ClauseLibraryEntry.objects.filter(is_active=True)
        document_type_id = self.request.query_params.get("document_type_id")
        clause_type = self.request.query_params.get("clause_type")
        if document_type_id:
            queryset = queryset.filter(document_type_id=document_type_id)
        if clause_type:
            queryset = queryset.filter(clause_type=clause_type)
        return queryset.order_by("title")


class ClauseLibrarySemanticSearchView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsLegalRole]

    def get(self, request):
        query = request.query_params.get("q", "")
        if not query:
            return Response({"error": "q is required"}, status=400)
        document_type_id = request.query_params.get("document_type_id")
        clause_type = request.query_params.get("clause_type")
        results = semantic_clause_search(
            query=query,
            document_type_id=document_type_id,
            clause_type=clause_type,
            limit=int(request.query_params.get("limit", 5)),
        )
        return Response(
            {
                "query": query,
                "results": [
                    {
                        "score": round(score, 4),
                        "entry": ClauseLibraryEntrySerializer(entry).data,
                        "fallback_alternatives": entry.fallback_alternatives,
                        "negotiation_playbook": entry.negotiation_playbook,
                    }
                    for score, entry in results
                ],
            }
        )


class ClauseLibraryByDocumentTypeView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsLegalRole]

    def get(self, request):
        document_type_id = request.query_params.get("document_type_id")
        if not document_type_id:
            return Response({"error": "document_type_id is required"}, status=400)
        items = ClauseLibraryEntry.objects.filter(
            document_type_id=document_type_id,
            is_active=True
        ).order_by("title")
        return Response(ClauseLibraryEntrySerializer(items, many=True).data)


class ClauseRedlineSuggestionView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsRoleWriteAllowed]

    def _draft_queryset(self, request):
        if request.user.role == "admin":
            return Draft.objects.filter(is_active=True, deleted_at__isnull=True)
        return Draft.objects.filter(created_by=request.user, is_active=True, deleted_at__isnull=True)

    def get(self, request):
        draft_id = request.query_params.get("draft_id")
        if not draft_id:
            return Response({"error": "draft_id is required"}, status=400)
        draft = self._draft_queryset(request).filter(id=draft_id).first()
        if not draft:
            return Response({"error": "Draft not found"}, status=404)
        suggestions = ClauseRedlineSuggestion.objects.filter(draft=draft).order_by("-created_at")
        return Response(ClauseRedlineSuggestionSerializer(suggestions, many=True).data)

    def post(self, request):
        draft_id = request.data.get("draft_id")
        clause_id = request.data.get("clause_id")
        suggested_text = request.data.get("suggested_text")
        rationale = request.data.get("rationale", "")
        if not draft_id or not suggested_text:
            return Response(
                {"error": "draft_id and suggested_text are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        draft = self._draft_queryset(request).filter(id=draft_id).first()
        if not draft:
            return Response({"error": "Draft not found"}, status=404)

        clause = None
        original_text = draft.content or ""
        if clause_id:
            clause = Clause.objects.filter(id=clause_id, draft=draft, is_active=True).first()
            if not clause:
                return Response({"error": "Clause not found"}, status=404)
            original_text = clause.text

        suggestion = ClauseRedlineSuggestion.objects.create(
            draft=draft,
            clause=clause,
            original_text=original_text,
            suggested_text=suggested_text,
            rationale=rationale,
            diff_preview=build_redline_diff(original_text, suggested_text),
            suggested_by=request.user,
        )
        return Response(ClauseRedlineSuggestionSerializer(suggestion).data, status=201)


class ClauseRedlineActionView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsRoleWriteAllowed]

    def _suggestion_queryset(self, request):
        if request.user.role == "admin":
            return ClauseRedlineSuggestion.objects.select_related("draft", "clause")
        return ClauseRedlineSuggestion.objects.select_related("draft", "clause").filter(
            draft__created_by=request.user
        )

    def post(self, request, suggestion_id, action):
        suggestion = self._suggestion_queryset(request).filter(id=suggestion_id).first()
        if not suggestion:
            return Response({"error": "Suggestion not found"}, status=404)
        if suggestion.status != "proposed":
            return Response({"error": "Suggestion already processed"}, status=400)

        if action == "accept":
            if suggestion.clause_id:
                clause = suggestion.clause
                clause.text = suggestion.suggested_text
                clause.save(update_fields=["text", "updated_at"])
            else:
                draft = suggestion.draft
                draft.content = suggestion.suggested_text
                draft.save(update_fields=["content", "updated_at"])
            suggestion.mark_accepted(request.user)
            save_version(suggestion.draft, request.user)
            return Response({"message": "Suggestion accepted"})

        if action == "reject":
            suggestion.mark_rejected(request.user)
            return Response({"message": "Suggestion rejected"})

        return Response({"error": "Invalid action"}, status=400)

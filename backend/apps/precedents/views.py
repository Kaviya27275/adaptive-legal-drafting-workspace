from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.drafts.models import Draft
from core.permissions import IsLegalRole, IsRoleWriteAllowed
from .models import Precedent
from .serializers import PrecedentSerializer
from .services import (
    get_precedents_by_type,
    search_precedents,
    insert_precedent_into_draft
)


class PrecedentListView(generics.ListCreateAPIView):
    queryset = Precedent.objects.all()
    serializer_class = PrecedentSerializer
    permission_classes = [permissions.IsAuthenticated, IsRoleWriteAllowed]


class PrecedentByTypeView(APIView):

    permission_classes = [permissions.IsAuthenticated, IsLegalRole]

    def get(self, request, document_type):
        precedents = get_precedents_by_type(document_type)
        serializer = PrecedentSerializer(precedents, many=True)
        return Response(serializer.data)


class PrecedentSearchView(APIView):

    permission_classes = [permissions.IsAuthenticated, IsLegalRole]

    def get(self, request):
        keyword = request.query_params.get("q", "")
        precedents = search_precedents(keyword)
        serializer = PrecedentSerializer(precedents, many=True)
        return Response(serializer.data)


class InsertPrecedentView(APIView):

    permission_classes = [permissions.IsAuthenticated, IsRoleWriteAllowed]

    def post(self, request, draft_id, precedent_id):

        try:
            draft = Draft.objects.get(id=draft_id)
            precedent = Precedent.objects.get(id=precedent_id)
        except (Draft.DoesNotExist, Precedent.DoesNotExist):
            return Response({"error": "Draft or Precedent not found"}, status=404)

        insert_precedent_into_draft(draft, precedent)

        return Response({"message": "Template inserted successfully"})

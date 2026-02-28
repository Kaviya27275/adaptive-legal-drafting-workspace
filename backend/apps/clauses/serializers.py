from rest_framework import serializers
from .models import Clause, ClauseLibraryEntry, ClauseRedlineSuggestion


class ClauseSerializer(serializers.ModelSerializer):

    class Meta:
        model = Clause
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class ClauseLibraryEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = ClauseLibraryEntry
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class ClauseRedlineSuggestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClauseRedlineSuggestion
        fields = "__all__"
        read_only_fields = [
            "status",
            "diff_preview",
            "suggested_by",
            "reviewed_by",
            "accepted_at",
            "created_at",
            "updated_at",
        ]

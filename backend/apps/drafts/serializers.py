from rest_framework import serializers
from .models import Draft, DraftSandbox


class DraftSerializer(serializers.ModelSerializer):

    class Meta:
        model = Draft
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at']

    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        title = attrs.get("title")

        if self.instance:
            if title and title != self.instance.title:
                raise serializers.ValidationError(
                    {"title": "Draft file name cannot be changed once created."}
                )
            return attrs

        if user and title:
            exists = Draft.objects.filter(
                created_by=user, title__iexact=title, is_active=True
            ).exists()
            if exists:
                raise serializers.ValidationError(
                    {"title": "A draft with this file name already exists."}
                )

        return attrs


class DraftSandboxSerializer(serializers.ModelSerializer):
    class Meta:
        model = DraftSandbox
        fields = "__all__"
        read_only_fields = ["created_by", "created_at", "updated_at", "is_active"]

from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role']

    def validate_role(self, value):
        allowed = {"admin", "lawyer", "law_student"}
        if value not in allowed:
            raise serializers.ValidationError("role must be admin, lawyer, or law_student")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            role=validated_data.get('role', 'lawyer')
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

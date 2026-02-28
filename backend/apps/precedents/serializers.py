from rest_framework import serializers
from .models import Precedent


class PrecedentSerializer(serializers.ModelSerializer):

    class Meta:
        model = Precedent
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
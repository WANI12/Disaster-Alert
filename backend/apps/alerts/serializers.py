from __future__ import annotations

from rest_framework import serializers

from apps.alerts.models import Alert


class AlertSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source="location.name", read_only=True)
    location_state = serializers.CharField(source="location.state", read_only=True)

    class Meta:
        model = Alert
        fields = [
            "id",
            "disaster_type",
            "severity",
            "title",
            "description",
            "status",
            "source",
            "occurred_at",
            "created_at",
            "updated_at",
            "location",
            "location_name",
            "location_state",
        ]


from __future__ import annotations

from rest_framework import serializers

from apps.reports.models import Report


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = [
            "id",
            "alert",
            "reporter_name",
            "reporter_phone",
            "description",
            "location",
            "created_at",
        ]


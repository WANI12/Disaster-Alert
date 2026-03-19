from __future__ import annotations

from rest_framework import serializers

from apps.locations.models import Location


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = [
            "id",
            "name",
            "state",
            "county",
            "payam",
            "boma",
            "latitude",
            "longitude",
            "created_at",
        ]


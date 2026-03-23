from __future__ import annotations

from rest_framework import generics
from rest_framework.permissions import AllowAny

from apps.locations.models import Location
from apps.locations.serializers import LocationSerializer


class LocationListCreateView(generics.ListCreateAPIView):
    queryset = Location.objects.order_by("state", "county", "name")
    serializer_class = LocationSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        state = self.request.query_params.get("state")
        if state:
            qs = qs.filter(state=state)
        return qs


class LocationRetrieveView(generics.RetrieveAPIView):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [AllowAny]


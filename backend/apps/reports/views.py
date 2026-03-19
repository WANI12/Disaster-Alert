from __future__ import annotations

from rest_framework import generics
from rest_framework.permissions import AllowAny

from apps.reports.models import Report
from apps.reports.serializers import ReportSerializer


class ReportListCreateView(generics.ListCreateAPIView):
    queryset = Report.objects.select_related("location", "alert").order_by("-created_at")
    serializer_class = ReportSerializer
    permission_classes = [AllowAny]


class ReportRetrieveView(generics.RetrieveAPIView):
    queryset = Report.objects.select_related("location", "alert").all()
    serializer_class = ReportSerializer
    permission_classes = [AllowAny]


from __future__ import annotations

from datetime import timedelta

from django.db.models import Count
from django.utils.timezone import now
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.alerts.models import Alert


class SummaryAnalyticsView(APIView):
    """
    Lightweight analytics for dashboards:
    - counts by disaster type (last N days)
    - counts by state (last N days)
    - severity distribution (last N days)
    """

    def get(self, request):
        days = request.query_params.get("days", "30")
        try:
            days_i = max(1, min(365, int(days)))
        except ValueError:
            days_i = 30

        since = now() - timedelta(days=days_i)
        base = Alert.objects.select_related("location").filter(created_at__gte=since)

        by_type = list(base.values("disaster_type").annotate(count=Count("id")).order_by("-count"))
        by_state = list(base.values("location__state").annotate(count=Count("id")).order_by("-count"))
        by_severity = list(base.values("severity").annotate(count=Count("id")).order_by("severity"))

        return Response(
            {
                "since": since.isoformat(),
                "days": days_i,
                "by_type": by_type,
                "by_state": by_state,
                "by_severity": by_severity,
            }
        )


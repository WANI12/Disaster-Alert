from __future__ import annotations

import json
import time
from datetime import datetime, time as dt_time
from typing import Optional

from django.db.models.functions import Coalesce
from django.utils.dateparse import parse_date, parse_datetime
from django.utils.timezone import get_current_timezone, make_aware, now

from django.http import StreamingHttpResponse
from rest_framework import generics
from rest_framework.permissions import AllowAny

from apps.alerts.models import Alert
from apps.alerts.serializers import AlertSerializer


class AlertListCreateView(generics.ListCreateAPIView):
    queryset = Alert.objects.select_related("location").order_by("-created_at")
    serializer_class = AlertSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        disaster_type = self.request.query_params.get("disaster_type")
        status = self.request.query_params.get("status")
        state = self.request.query_params.get("state")
        min_severity = self.request.query_params.get("min_severity")
        time_field = self.request.query_params.get("time_field", "created_at").lower()
        from_param = self.request.query_params.get("from")
        to_param = self.request.query_params.get("to")
        since = self.request.query_params.get("since")

        if disaster_type:
            qs = qs.filter(disaster_type=disaster_type)
        if status:
            qs = qs.filter(status=status)
        if state:
            qs = qs.filter(location__state=state)
        if min_severity:
            try:
                qs = qs.filter(severity__gte=int(min_severity))
            except ValueError:
                pass

        def parse_dt(value: Optional[str]) -> Optional[datetime]:
            if not value:
                return None
            dt = parse_datetime(value)
            if dt is not None:
                if dt.tzinfo is None:
                    dt = make_aware(dt, get_current_timezone())
                return dt
            d = parse_date(value)
            if d is not None:
                return make_aware(datetime.combine(d, dt_time.min), get_current_timezone())
            return None

        # New time-range semantics (used by analytics/map):
        # - `from/to` with `time_field=created_at|occurred_at` (default created_at)
        # - Legacy `since` still filters `created_at__gte`
        if from_param or to_param:
            dt_from = parse_dt(from_param)
            dt_to = parse_dt(to_param)

            if time_field == "occurred_at":
                # occurred_at may be null; fall back to created_at.
                qs = qs.annotate(t=Coalesce("occurred_at", "created_at"))
                if dt_from is not None:
                    qs = qs.filter(t__gte=dt_from)
                if dt_to is not None:
                    qs = qs.filter(t__lte=dt_to)
            else:
                if dt_from is not None:
                    qs = qs.filter(created_at__gte=dt_from)
                if dt_to is not None:
                    qs = qs.filter(created_at__lte=dt_to)
        elif since:
            dt = parse_dt(since)
            if dt is not None:
                qs = qs.filter(created_at__gte=dt)
        return qs


class AlertRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Alert.objects.select_related("location").all()
    serializer_class = AlertSerializer
    permission_classes = [AllowAny]


def alerts_stream_sse(request):
    """
    Server-Sent Events stream for new/updated alerts.
    Simple implementation: polls DB every ~2s and emits any alerts newer than the last seen timestamp.
    """
    last = request.GET.get("since")
    last_dt = parse_datetime(last) if last else None
    if last_dt is None:
        last_dt = now()

    def event_iter():
        nonlocal last_dt
        yield f"event: hello\ndata: {json.dumps({'since': last_dt.isoformat()})}\n\n"
        while True:
            batch = (
                Alert.objects.select_related("location")
                .filter(updated_at__gt=last_dt)
                .order_by("updated_at")[:200]
            )
            sent_any = False
            for alert in batch:
                data = AlertSerializer(alert).data
                payload = json.dumps(data, default=str)
                yield f"event: alert\ndata: {payload}\n\n"
                last_dt = alert.updated_at
                sent_any = True

            if not sent_any:
                yield f"event: ping\ndata: {json.dumps({'ts': datetime.utcnow().isoformat()})}\n\n"
            time.sleep(2)

    resp = StreamingHttpResponse(event_iter(), content_type="text/event-stream")
    resp["Cache-Control"] = "no-cache"
    resp["X-Accel-Buffering"] = "no"
    return resp


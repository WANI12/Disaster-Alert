from __future__ import annotations

import json
import time
from datetime import datetime

from django.http import StreamingHttpResponse
from django.utils.dateparse import parse_datetime
from django.utils.timezone import now
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
        if since:
            dt = parse_datetime(since)
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


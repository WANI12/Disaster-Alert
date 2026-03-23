from __future__ import annotations

from datetime import datetime, time, timedelta
from typing import Any, Dict, List, Optional, Tuple

from django.db.models import Avg, Count, Max, Sum
from django.db.models.functions import Coalesce
from django.db.models.functions import TruncDay, TruncMonth, TruncYear
from django.utils.dateparse import parse_date, parse_datetime
from django.utils.timezone import get_current_timezone, make_aware, now
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.alerts.models import Alert


EARLY_2000 = "2000-01-01"


def _parse_dt_param(value: Optional[str], *, default_dt: datetime) -> datetime:
    """
    Parse ISO datetime/date (e.g. 2001-02-03 or 2001-02-03T10:00:00Z).
    Returned datetimes are timezone-aware (Django USE_TZ= True).
    """
    if not value:
        return default_dt

    tz = get_current_timezone()
    dt = parse_datetime(value)
    if dt is not None:
        if dt.tzinfo is None:
            dt = make_aware(dt, tz)
        return dt

    d = parse_date(value)
    if d is not None:
        naive = datetime.combine(d, time.min)
        return make_aware(naive, tz)

    return default_dt


def _get_time_bounds(request) -> Tuple[datetime, datetime]:
    tz = get_current_timezone()
    from_default = make_aware(datetime.fromisoformat(EARLY_2000), tz)
    to_default = now()

    from_param = request.query_params.get("from")
    to_param = request.query_params.get("to")

    from_dt = _parse_dt_param(from_param, default_dt=from_default)
    to_dt = _parse_dt_param(to_param, default_dt=to_default)

    if to_dt < from_dt:
        raise ValueError("Invalid time range: 'to' must be >= 'from'.")

    return from_dt, to_dt


def _apply_common_filters(request, qs):
    disaster_type = request.query_params.get("disaster_type")
    if disaster_type:
        qs = qs.filter(disaster_type=disaster_type)

    status = request.query_params.get("status")
    if status:
        qs = qs.filter(status=status)

    state = request.query_params.get("state")
    if state:
        qs = qs.filter(location__state=state)

    min_severity = request.query_params.get("min_severity")
    if min_severity:
        try:
            qs = qs.filter(severity__gte=int(min_severity))
        except ValueError:
            pass

    return qs


def _select_trunc(granularity: str, *, auto_hint_days: int):
    granularity = (granularity or "").lower()
    if granularity == "auto":
        if auto_hint_days <= 120:
            return TruncDay
        if auto_hint_days <= 730:
            return TruncMonth
        return TruncYear

    if granularity in {"day", "days"}:
        return TruncDay
    if granularity in {"month", "months"}:
        return TruncMonth
    if granularity in {"year", "years"}:
        return TruncYear

    return TruncMonth


class SummaryAnalyticsView(APIView):
    """
    Lightweight analytics for dashboards:
    - counts by disaster type
    - counts by state
    - severity distribution
    """

    def get(self, request):
        # Backwards compat: `days` still works if `from/to` are not provided.
        if request.query_params.get("from") or request.query_params.get("to"):
            try:
                from_dt, to_dt = _get_time_bounds(request)
            except ValueError as e:
                return Response({"detail": str(e)}, status=400)
            time_field = request.query_params.get("time_field", "created_at").lower()
            if time_field == "occurred_at":
                time_expr = Coalesce("occurred_at", "created_at")
                base = Alert.objects.select_related("location").annotate(t=time_expr).filter(t__gte=from_dt, t__lte=to_dt)
                since_payload: Dict[str, Any] = {"from": from_dt.isoformat(), "to": to_dt.isoformat()}
            else:
                base = Alert.objects.select_related("location").filter(created_at__gte=from_dt, created_at__lte=to_dt)
                since_payload = {"from": from_dt.isoformat(), "to": to_dt.isoformat()}
        else:
            days = request.query_params.get("days", "30")
            try:
                days_i = max(1, min(365, int(days)))
            except ValueError:
                days_i = 30

            from_dt = now() - timedelta(days=days_i)
            to_dt = now()
            base = Alert.objects.select_related("location").filter(created_at__gte=from_dt)
            since_payload = {"since": from_dt.isoformat(), "days": days_i}

        by_type = list(base.values("disaster_type").annotate(count=Count("id")).order_by("-count"))
        by_state = list(base.values("location__state").annotate(count=Count("id")).order_by("-count"))
        by_severity = list(base.values("severity").annotate(count=Count("id")).order_by("severity"))

        return Response({**since_payload, "by_type": by_type, "by_state": by_state, "by_severity": by_severity})


class TimelineAnalyticsView(APIView):
    """
    Time-series aggregation for dashboards (counts/severity over time).

    Intended for charting: line charts with `granularity` auto-selected.
    """

    def get(self, request):
        try:
            from_dt, to_dt = _get_time_bounds(request)
        except ValueError as e:
            return Response({"detail": str(e)}, status=400)

        time_field = request.query_params.get("time_field", "occurred_at").lower()
        granularity = request.query_params.get("granularity", "auto")
        include_by_type = request.query_params.get("include_by_type", "0").lower() in {"1", "true", "yes"}

        qs = Alert.objects.select_related("location").all()
        qs = _apply_common_filters(request, qs)

        if time_field == "created_at":
            qs = qs.filter(created_at__gte=from_dt, created_at__lte=to_dt)
            trunc = _select_trunc(granularity, auto_hint_days=(to_dt - from_dt).days)
            period_qs = qs.annotate(period=trunc("created_at"))
            total = list(
                period_qs.values("period").annotate(
                    count=Count("id"),
                    avg_severity=Avg("severity"),
                    max_severity=Max("severity"),
                ).order_by("period")
            )
            period_field = "created_at"
            latest_expression = "period"
        else:
            time_expr = Coalesce("occurred_at", "created_at")
            qs = qs.annotate(t=time_expr).filter(t__gte=from_dt, t__lte=to_dt)
            trunc = _select_trunc(granularity, auto_hint_days=(to_dt - from_dt).days)
            period_qs = qs.annotate(period=trunc("t"))
            total = list(
                period_qs.values("period").annotate(
                    count=Count("id"),
                    avg_severity=Avg("severity"),
                    max_severity=Max("severity"),
                ).order_by("period")
            )
            period_field = "t"
            latest_expression = "period"

        points = [
            {
                "period": row["period"].isoformat() if row["period"] else None,
                "count": row["count"],
                "avg_severity": float(row["avg_severity"]) if row["avg_severity"] is not None else None,
                "max_severity": row["max_severity"],
            }
            for row in total
        ]

        payload: Dict[str, Any] = {
            "from": from_dt.isoformat(),
            "to": to_dt.isoformat(),
            "granularity": granularity,
            "time_field": time_field,
            "total_by_period": points,
        }

        if include_by_type:
            type_rows = list(
                period_qs.values("period", "disaster_type")
                .annotate(count=Count("id"))
                .order_by("period")
            )
            by_type: Dict[str, List[Dict[str, Any]]] = {}
            for row in type_rows:
                dt = row["disaster_type"]
                by_type.setdefault(dt, []).append(
                    {"period": row["period"].isoformat() if row["period"] else None, "count": row["count"]}
                )
            payload["by_type"] = by_type

        return Response(payload)


class MapAnalyticsView(APIView):
    """
    GeoJSON map endpoint.

    Returns location markers aggregated over the selected time range and filters.
    """

    def get(self, request):
        try:
            from_dt, to_dt = _get_time_bounds(request)
        except ValueError as e:
            return Response({"detail": str(e)}, status=400)

        time_field = request.query_params.get("time_field", "occurred_at").lower()
        qs = Alert.objects.select_related("location").all()
        qs = _apply_common_filters(request, qs)

        if time_field == "created_at":
            qs = qs.filter(created_at__gte=from_dt, created_at__lte=to_dt)
            latest = Max("created_at")
            latest_key = "latest_occurrence"
        else:
            time_expr = Coalesce("occurred_at", "created_at")
            qs = qs.annotate(t=time_expr).filter(t__gte=from_dt, t__lte=to_dt)
            latest = Max("t")
            latest_key = "latest_occurrence"

        rows = list(
            qs.values(
                "location_id",
                "location__name",
                "location__state",
                "location__latitude",
                "location__longitude",
            )
            .exclude(location__latitude__isnull=True)
            .exclude(location__longitude__isnull=True)
            .annotate(
                count=Count("id"),
                max_severity=Max("severity"),
                **{latest_key: latest},
            )
            .order_by("-count")[: int(request.query_params.get("max_features", "2000"))]
        )

        features = []
        for row in rows:
            lat = row["location__latitude"]
            lon = row["location__longitude"]
            if lat is None or lon is None:
                continue

            # Risk heuristic used for map coloring on the client.
            max_sev = row["max_severity"] or 0
            if max_sev >= 5:
                risk = "catastrophic"
            elif max_sev >= 4:
                risk = "extreme"
            elif max_sev >= 3:
                risk = "high"
            elif max_sev >= 2:
                risk = "moderate"
            else:
                risk = "low"

            features.append(
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [float(lon), float(lat)]},
                    "properties": {
                        "location_id": row["location_id"],
                        "name": row["location__name"],
                        "state": row["location__state"],
                        "count": row["count"],
                        "max_severity": row["max_severity"],
                        "latest_occurrence": row.get(latest_key).isoformat() if row.get(latest_key) else None,
                        "risk_level": risk,
                    },
                }
            )

        return Response(
            {
                "type": "FeatureCollection",
                "from": from_dt.isoformat(),
                "to": to_dt.isoformat(),
                "time_field": time_field,
                "features": features,
            }
        )


class EarlyWarningAnalyticsView(APIView):
    """
    Early warning trigger endpoint.

    Triggers warnings when recent alert volume (or risk_score) exceeds thresholds.
    """

    def get(self, request):
        time_field = request.query_params.get("time_field", "occurred_at").lower()
        window_days = request.query_params.get("window_days", "7")
        threshold_count = request.query_params.get("threshold_count", "3")
        threshold_risk_score = request.query_params.get("threshold_risk_score", "10")
        mode = request.query_params.get("mode", "count").lower()
        limit = int(request.query_params.get("limit", "2000"))
        fmt = request.query_params.get("format", "geojson").lower()

        try:
            window_days_i = max(1, min(365, int(window_days)))
            threshold_count_i = max(1, int(threshold_count))
            threshold_risk_score_i = max(0, int(threshold_risk_score))
        except ValueError:
            return Response({"detail": "Invalid numeric parameters."}, status=400)

        # `to` drives the “recent” window; `from` is ignored here.
        try:
            _, to_dt = _get_time_bounds(request)
        except ValueError:
            to_dt = now()

        recent_start = to_dt - timedelta(days=window_days_i)

        qs = Alert.objects.select_related("location").all()
        qs = _apply_common_filters(request, qs)

        if time_field == "created_at":
            qs = qs.filter(created_at__gte=recent_start, created_at__lte=to_dt)
            time_annotated = None
        else:
            time_expr = Coalesce("occurred_at", "created_at")
            qs = qs.annotate(t=time_expr).filter(t__gte=recent_start, t__lte=to_dt)
            time_annotated = "t"

        group = qs.values(
            "location_id",
            "location__name",
            "location__state",
            "location__latitude",
            "location__longitude",
        ).exclude(location__latitude__isnull=True).exclude(location__longitude__isnull=True)

        if time_annotated:
            latest = Max(time_annotated)
        else:
            latest = Max("created_at")

        grouped = (
            group.annotate(
                count_recent=Count("id"),
                risk_score=Sum("severity"),
                max_severity=Max("severity"),
                latest_occurrence=latest,
            )
            .order_by("-risk_score")[:limit]
        )

        warnings: List[Dict[str, Any]] = []
        for row in grouped:
            count_recent = int(row["count_recent"])
            risk_score = int(row["risk_score"] or 0)
            triggered = (
                (mode == "risk_score" and risk_score >= threshold_risk_score_i)
                or (mode != "risk_score" and count_recent >= threshold_count_i)
            )
            if not triggered:
                continue

            lat = row["location__latitude"]
            lon = row["location__longitude"]
            warnings.append(
                {
                    "location_id": row["location_id"],
                    "name": row["location__name"],
                    "state": row["location__state"],
                    "count_recent": count_recent,
                    "risk_score": risk_score,
                    "max_severity": row["max_severity"],
                    "latest_occurrence": row["latest_occurrence"].isoformat() if row["latest_occurrence"] else None,
                    "coordinates": [float(lon), float(lat)],
                }
            )

        if fmt == "geojson":
            features = [
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": w["coordinates"]},
                    "properties": {
                        "location_id": w["location_id"],
                        "name": w["name"],
                        "state": w["state"],
                        "count_recent": w["count_recent"],
                        "risk_score": w["risk_score"],
                        "max_severity": w["max_severity"],
                        "latest_occurrence": w["latest_occurrence"],
                    },
                }
                for w in warnings
            ]

            return Response(
                {
                    "type": "FeatureCollection",
                    "from": recent_start.isoformat(),
                    "to": to_dt.isoformat(),
                    "window_days": window_days_i,
                    "mode": mode,
                    "threshold_count": threshold_count_i,
                    "threshold_risk_score": threshold_risk_score_i,
                    "features": features,
                }
            )

        return Response(
            {
                "from": recent_start.isoformat(),
                "to": to_dt.isoformat(),
                "window_days": window_days_i,
                "mode": mode,
                "threshold_count": threshold_count_i,
                "threshold_risk_score": threshold_risk_score_i,
                "warnings": warnings,
            }
        )


from django.urls import path

from apps.analytics.views import EarlyWarningAnalyticsView, MapAnalyticsView, SummaryAnalyticsView, TimelineAnalyticsView

urlpatterns = [
    path("analytics/summary/", SummaryAnalyticsView.as_view(), name="analytics-summary"),
    path("analytics/timeline/", TimelineAnalyticsView.as_view(), name="analytics-timeline"),
    path("analytics/map/", MapAnalyticsView.as_view(), name="analytics-map"),
    path("analytics/early-warning/", EarlyWarningAnalyticsView.as_view(), name="analytics-early-warning"),
]


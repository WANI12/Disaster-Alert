from django.urls import path

from apps.analytics.views import SummaryAnalyticsView

urlpatterns = [
    path("analytics/summary/", SummaryAnalyticsView.as_view(), name="analytics-summary"),
]


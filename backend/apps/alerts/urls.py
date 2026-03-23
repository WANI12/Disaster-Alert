from django.urls import path

from apps.alerts.views import AlertListCreateView, AlertRetrieveUpdateView, alerts_stream_sse

urlpatterns = [
    path("alerts/", AlertListCreateView.as_view(), name="alerts-list-create"),
    path("alerts/<int:pk>/", AlertRetrieveUpdateView.as_view(), name="alerts-detail"),
    path("alerts/stream/", alerts_stream_sse, name="alerts-stream"),
]


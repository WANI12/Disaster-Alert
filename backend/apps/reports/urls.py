from django.urls import path

from apps.reports.views import ReportListCreateView, ReportRetrieveView

urlpatterns = [
    path("reports/", ReportListCreateView.as_view(), name="reports-list-create"),
    path("reports/<int:pk>/", ReportRetrieveView.as_view(), name="reports-detail"),
]


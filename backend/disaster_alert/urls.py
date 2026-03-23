from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.alerts.urls")),
    path("api/", include("apps.reports.urls")),
    path("api/", include("apps.locations.urls")),
    path("api/", include("apps.analytics.urls")),
    path("api/", include("apps.accounts.urls")),
]


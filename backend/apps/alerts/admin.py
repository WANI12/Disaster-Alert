from django.contrib import admin

from apps.alerts.models import Alert


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ("id", "disaster_type", "severity", "status", "title", "location", "created_at")
    list_filter = ("disaster_type", "severity", "status", "location__state")
    search_fields = ("title", "description", "location__name")


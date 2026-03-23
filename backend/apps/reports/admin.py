from django.contrib import admin

from apps.reports.models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("id", "alert", "location", "reporter_name", "created_at")
    list_filter = ("location__state",)
    search_fields = ("description", "reporter_name", "reporter_phone", "location__name")


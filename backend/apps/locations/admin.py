from django.contrib import admin

from apps.locations.models import Location


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "state", "county", "latitude", "longitude", "created_at")
    list_filter = ("state", "county")
    search_fields = ("name", "county", "payam", "boma")


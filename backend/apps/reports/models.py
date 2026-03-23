from __future__ import annotations

from django.db import models


class Report(models.Model):
    alert = models.ForeignKey("alerts.Alert", on_delete=models.CASCADE, related_name="reports", null=True, blank=True)
    reporter_name = models.CharField(max_length=160, blank=True, default="")
    reporter_phone = models.CharField(max_length=32, blank=True, default="")
    description = models.TextField()
    location = models.ForeignKey("locations.Location", on_delete=models.PROTECT, related_name="reports")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["created_at"]),
        ]

    def __str__(self) -> str:
        return f"Report #{self.pk} @ {self.location}"


from __future__ import annotations

from django.db import models


class DisasterType(models.TextChoices):
    FLOOD = "Flood"
    FIRE = "Fire"
    CONFLICT = "Conflict"
    DISEASE = "Disease Outbreak"
    DROUGHT = "Drought"
    LANDSLIDE = "Landslide"
    OTHER = "Other"


class Severity(models.IntegerChoices):
    LOW = 1
    MODERATE = 2
    HIGH = 3
    EXTREME = 4
    CATASTROPHIC = 5


class AlertStatus(models.TextChoices):
    NEW = "New"
    VERIFIED = "Verified"
    RESOLVED = "Resolved"
    DISMISSED = "Dismissed"


class Alert(models.Model):
    disaster_type = models.CharField(max_length=64, choices=DisasterType.choices)
    severity = models.PositiveSmallIntegerField(choices=Severity.choices, default=Severity.MODERATE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    location = models.ForeignKey("locations.Location", on_delete=models.PROTECT, related_name="alerts")
    status = models.CharField(max_length=32, choices=AlertStatus.choices, default=AlertStatus.NEW)
    source = models.CharField(max_length=128, blank=True, default="Community")
    occurred_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["disaster_type", "severity"]),
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.disaster_type} ({self.get_severity_display()}): {self.title}"


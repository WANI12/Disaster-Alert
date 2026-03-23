from __future__ import annotations

from django.db import models


class SouthSudanState(models.TextChoices):
    CENTRAL_EQUATORIA = "Central Equatoria"
    EASTERN_EQUATORIA = "Eastern Equatoria"
    WESTERN_EQUATORIA = "Western Equatoria"
    JONGLEI = "Jonglei"
    LAKES = "Lakes"
    NORTHERN_BAHR_EL_GHAZAL = "Northern Bahr el Ghazal"
    WESTERN_BAHR_EL_GHAZAL = "Western Bahr el Ghazal"
    UNITY = "Unity"
    UPPER_NILE = "Upper Nile"
    WARRAP = "Warrap"


class Location(models.Model):
    name = models.CharField(max_length=200)
    state = models.CharField(max_length=64, choices=SouthSudanState.choices)
    county = models.CharField(max_length=128, blank=True, default="")
    payam = models.CharField(max_length=128, blank=True, default="")
    boma = models.CharField(max_length=128, blank=True, default="")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["state", "county"]),
        ]

    def __str__(self) -> str:
        parts = [self.name, self.county, self.state]
        return ", ".join([p for p in parts if p])


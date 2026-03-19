from django.urls import path

from apps.locations.views import LocationListCreateView, LocationRetrieveView

urlpatterns = [
    path("locations/", LocationListCreateView.as_view(), name="locations-list-create"),
    path("locations/<int:pk>/", LocationRetrieveView.as_view(), name="locations-detail"),
]


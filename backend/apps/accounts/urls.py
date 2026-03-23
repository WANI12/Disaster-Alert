from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token

from apps.accounts.views import MeView, RegisterView

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/login/", obtain_auth_token, name="auth-login"),
    path("auth/me/", MeView.as_view(), name="auth-me"),
]


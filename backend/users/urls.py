from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views

app_name = 'users'

urlpatterns = [
    # User authentication endpoints
    path('register/', views.UserCreateView.as_view(), name='user-register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', views.UserLogoutView.as_view(), name='user-logout'),
    
    # User profile endpoints
    path('me/', views.UserProfileView.as_view(), name='user-profile'),
    path('me/update/', views.UserDetailView.as_view(), name='user-update'),
]

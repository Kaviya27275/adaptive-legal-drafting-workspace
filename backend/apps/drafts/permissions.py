from rest_framework.permissions import BasePermission


class IsOwnerOrAdmin(BasePermission):

    def has_object_permission(self, request, view, obj):
        return (
            request.user.role == "admin"
            or obj.created_by == request.user
        )


class IsOwnerAdminOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return request.user.role in {"admin", "lawyer", "law_student"} and (
                request.user.role == "admin" or obj.created_by == request.user
            )
        return request.user.role == "admin" or obj.created_by == request.user

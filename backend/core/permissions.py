from rest_framework.permissions import BasePermission


VALID_ROLES = {"admin", "lawyer", "law_student"}


class IsLegalRole(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and getattr(request.user, "role", None) in VALID_ROLES
        )


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


class IsAdminOrLawyer(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and getattr(request.user, "role", None) in {"admin", "lawyer"}
        )


class IsRoleWriteAllowed(BasePermission):
    """
    Read: admin/lawyer/law_student
    Write: admin/lawyer
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        role = getattr(request.user, "role", None)
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return role in VALID_ROLES
        return role in {"admin", "lawyer", "law_student"}

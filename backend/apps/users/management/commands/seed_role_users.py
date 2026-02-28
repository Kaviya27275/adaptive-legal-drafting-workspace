from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create default role-based users with password 123"

    def handle(self, *args, **kwargs):
        User = get_user_model()
        accounts = [
            ("admin_user", "admin"),
            ("lawyer_user", "lawyer"),
            ("law_student_user", "law_student"),
        ]
        for username, role in accounts:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": f"{username}@example.com",
                    "role": role,
                },
            )
            if created:
                user.set_password("123")
                if role == "admin":
                    user.is_staff = True
                    user.is_superuser = True
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Created {username} ({role})"))
            else:
                user.role = role
                user.set_password("123")
                if role == "admin":
                    user.is_staff = True
                    user.is_superuser = True
                user.save(update_fields=["role", "password", "is_staff", "is_superuser"])
                self.stdout.write(self.style.WARNING(f"Updated {username} ({role})"))

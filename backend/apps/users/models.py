from django.contrib.auth.models import AbstractUser
from django.db import models
from shared.base_models import TimeStampedModel


class User(AbstractUser, TimeStampedModel):

    ROLE_CHOICES = (
        ("admin", "Admin"),
        ("lawyer", "Lawyer"),
        ("law_student", "Law Student"),
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="lawyer",
    )

    def __str__(self):
        return f"{self.username} ({self.role})"

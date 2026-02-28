from django.core.management.base import BaseCommand
from apps.compliance.seed_data import seed_compliance_data


class Command(BaseCommand):
    help = "Seed compliance dataset"

    def handle(self, *args, **kwargs):
        seed_compliance_data()
        self.stdout.write(self.style.SUCCESS("Compliance data seeded successfully"))
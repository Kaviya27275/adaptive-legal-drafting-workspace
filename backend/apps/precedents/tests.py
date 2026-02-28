from django.test import TestCase
from .models import Precedent


class PrecedentTest(TestCase):

    def test_create_precedent(self):
        precedent = Precedent.objects.create(
            title="NDA Template",
            document_type="NDA",
            content="Confidentiality clause..."
        )
        self.assertEqual(precedent.document_type, "NDA")
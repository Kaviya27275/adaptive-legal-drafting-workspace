from django.test import TestCase
from .services import analyze_clause


class AITest(TestCase):

    def test_clause_analysis_prompt(self):
        response = analyze_clause("Payment must be done immediately.")
        self.assertIsInstance(response, dict)

from django.core.management.base import BaseCommand

from apps.clauses.models import ClauseLibraryEntry
from apps.compliance.models import DocumentType


DEFAULT_CLAUSE_LIBRARY = {
    "Non Disclosure Agreement": [
        {
            "title": "Parties and Effective Date",
            "text": "This Non-Disclosure Agreement is entered into on [Effective Date] between [Disclosing Party Name] and [Receiving Party Name].",
            "clause_type": "OTHER",
            "tags": ["nda", "parties", "effective-date"],
        },
        {
            "title": "Definition of Confidential Information",
            "text": "Confidential Information means all non-public business, technical, and financial information disclosed by a party in written, oral, or electronic form.",
            "clause_type": "CONFIDENTIALITY",
            "tags": ["nda", "definitions", "confidentiality"],
        },
        {
            "title": "Non-Use and Non-Disclosure Obligations",
            "text": "The Receiving Party shall use Confidential Information solely for the Permitted Purpose and shall not disclose such information to any third party except as expressly permitted.",
            "clause_type": "CONFIDENTIALITY",
            "tags": ["nda", "obligations"],
        },
        {
            "title": "Term and Survival",
            "text": "This Agreement shall remain in force for two (2) years from the Effective Date, and confidentiality obligations shall survive for three (3) years after termination.",
            "clause_type": "TERMINATION",
            "tags": ["nda", "term"],
        },
    ],
    "Employment Contract": [
        {
            "title": "Parties and Commencement",
            "text": "This Employment Contract is made on [Date] between [Employer Name] and [Employee Name], and shall commence on [Start Date].",
            "clause_type": "OTHER",
            "tags": ["employment", "parties", "commencement"],
        },
        {
            "title": "Role and Duties",
            "text": "Employee shall serve as [Role] and perform duties reasonably assigned by Employer, with due care and professional diligence.",
            "clause_type": "OTHER",
            "tags": ["employment", "role"],
        },
        {
            "title": "Compensation and Benefits",
            "text": "Employer shall pay Employee a gross monthly salary of [Amount], subject to applicable deductions, together with benefits as per company policy.",
            "clause_type": "PAYMENT",
            "tags": ["employment", "salary"],
        },
        {
            "title": "Confidentiality and IP",
            "text": "Employee shall maintain confidentiality of proprietary information and assigns all work-product intellectual property created in the course of employment to Employer.",
            "clause_type": "CONFIDENTIALITY",
            "tags": ["employment", "ip", "confidentiality"],
        },
        {
            "title": "Termination and Notice",
            "text": "Either party may terminate this Contract by providing [Notice Period] written notice, subject to statutory requirements and contractual obligations.",
            "clause_type": "TERMINATION",
            "tags": ["employment", "termination"],
        },
    ],
    "Service Agreement": [
        {
            "title": "Parties and Effective Date",
            "text": "This Service Agreement is entered into between [Client Name] and [Service Provider Name] as of [Effective Date].",
            "clause_type": "OTHER",
            "tags": ["service", "parties", "effective-date"],
        },
        {
            "title": "Scope of Services",
            "text": "Service Provider shall perform the services described in Schedule A in accordance with professional standards and agreed milestones.",
            "clause_type": "OTHER",
            "tags": ["service", "scope"],
        },
        {
            "title": "Fees and Payment Terms",
            "text": "Client shall pay the fees specified in Schedule B within fifteen (15) days from receipt of a valid invoice.",
            "clause_type": "PAYMENT",
            "tags": ["service", "payment"],
        },
        {
            "title": "Limitation of Liability",
            "text": "Neither party shall be liable for indirect or consequential damages; aggregate liability shall not exceed the total fees paid in the preceding twelve months.",
            "clause_type": "LIABILITY",
            "tags": ["service", "liability"],
        },
        {
            "title": "Termination for Cause and Convenience",
            "text": "Either party may terminate for material breach if uncured within thirty (30) days of notice, or for convenience upon sixty (60) days prior written notice.",
            "clause_type": "TERMINATION",
            "tags": ["service", "termination"],
        },
    ],
    "Lease Agreement": [
        {
            "title": "Parties and Premises",
            "text": "This Lease Agreement is made between [Lessor Name] and [Lessee Name] for premises situated at [Address].",
            "clause_type": "OTHER",
            "tags": ["lease", "parties", "premises"],
        },
        {
            "title": "Premises and Permitted Use",
            "text": "Lessor leases to Lessee the premises located at [Address] solely for lawful commercial use specified in this Agreement.",
            "clause_type": "OTHER",
            "tags": ["lease", "premises"],
        },
        {
            "title": "Rent and Security Deposit",
            "text": "Lessee shall pay monthly rent of [Amount] in advance and provide a refundable security deposit of [Amount], subject to this Agreement.",
            "clause_type": "PAYMENT",
            "tags": ["lease", "rent", "deposit"],
        },
        {
            "title": "Maintenance and Repairs",
            "text": "Routine maintenance shall be borne by Lessee, while structural repairs remain the responsibility of Lessor unless damage is caused by Lessee.",
            "clause_type": "LIABILITY",
            "tags": ["lease", "maintenance"],
        },
        {
            "title": "Lease Termination",
            "text": "Either party may terminate this Lease in accordance with the notice period and termination events set forth herein.",
            "clause_type": "TERMINATION",
            "tags": ["lease", "termination"],
        },
    ],
    "Legal Notice": [
        {
            "title": "Notice Parties",
            "text": "This legal notice is issued on behalf of [Client Name] to [Recipient Name] at [Recipient Address].",
            "clause_type": "OTHER",
            "tags": ["legal-notice", "parties", "recipient"],
        },
        {
            "title": "Statement of Facts",
            "text": "Under instructions from my client, I hereby state that the following facts constitute the basis of this notice: [Insert facts].",
            "clause_type": "OTHER",
            "tags": ["legal-notice", "facts"],
        },
        {
            "title": "Demand for Compliance",
            "text": "You are called upon to remedy the above breach and comply with the stated demands within [Number] days from receipt of this notice.",
            "clause_type": "OTHER",
            "tags": ["legal-notice", "demand"],
        },
        {
            "title": "Consequences of Non-Compliance",
            "text": "Failing compliance within the stipulated period, my client shall initiate appropriate legal proceedings without further reference to you.",
            "clause_type": "TERMINATION",
            "tags": ["legal-notice", "consequence"],
        },
    ],
}


class Command(BaseCommand):
    help = "Seed default clause library entries for the five standard document types."

    def _upsert_clause(self, document_type, payload):
        existing = ClauseLibraryEntry.objects.filter(
            document_type=document_type,
            title=payload["title"],
        ).first()
        defaults = {
            "text": payload["text"],
            "clause_type": payload["clause_type"],
            "tags": payload.get("tags", []),
            "fallback_alternatives": payload.get("fallback_alternatives", []),
            "negotiation_playbook": payload.get("negotiation_playbook", {}),
            "is_active": True,
        }
        if existing:
            for key, value in defaults.items():
                setattr(existing, key, value)
            existing.save()
            return False
        ClauseLibraryEntry.objects.create(
            document_type=document_type,
            title=payload["title"],
            **defaults,
        )
        return True

    def handle(self, *args, **options):
        created = 0
        updated = 0
        for doc_name, entries in DEFAULT_CLAUSE_LIBRARY.items():
            document_type, _ = DocumentType.objects.get_or_create(name=doc_name)
            for payload in entries:
                was_created = self._upsert_clause(document_type, payload)
                if was_created:
                    created += 1
                else:
                    updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Clause library seed complete. Created: {created}, Updated: {updated}"
            )
        )

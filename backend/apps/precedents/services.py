from .models import Precedent


def get_precedents_by_type(document_type):
    return Precedent.objects.filter(document_type=document_type)


def search_precedents(keyword):
    return Precedent.objects.filter(
        title__icontains=keyword
    ) | Precedent.objects.filter(
        content__icontains=keyword
    )


def insert_precedent_into_draft(draft, precedent):
    draft.content += "\n\n" + precedent.content
    draft.save()
    return draft
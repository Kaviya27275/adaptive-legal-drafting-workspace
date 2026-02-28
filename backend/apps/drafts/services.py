from .models import Draft


def create_draft(user, validated_data):
    return Draft.objects.create(
        created_by=user,
        **validated_data
    )


def update_draft(draft, validated_data):
    for attr, value in validated_data.items():
        setattr(draft, attr, value)
    draft.save()
    return draft


def soft_delete_draft(draft):
    draft.is_active = False
    draft.save()
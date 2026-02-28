from .models import Version


def get_next_version_number(draft):
    latest = draft.versions.order_by('-version_number').first()
    if latest:
        return latest.version_number + 1
    return 1


def save_version(draft, user):
    latest = draft.versions.order_by("-version_number").first()
    if latest and (latest.snapshot or "") == (draft.content or ""):
        return latest

    version_number = get_next_version_number(draft)

    return Version.objects.create(
        draft=draft,
        snapshot=draft.content,
        version_number=version_number,
        created_by=user
    )


def restore_version(draft, version):
    draft.content = version.snapshot
    draft.save()
    return draft

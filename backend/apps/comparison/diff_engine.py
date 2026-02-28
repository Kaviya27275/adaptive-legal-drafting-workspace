import difflib


def word_diff(text1: str, text2: str):
    """
    Returns word-level diff
    """
    words1 = text1.split()
    words2 = text2.split()

    diff = difflib.ndiff(words1, words2)

    result = []
    for token in diff:
        if token.startswith("- "):
            result.append({"type": "removed", "value": token[2:]})
        elif token.startswith("+ "):
            result.append({"type": "added", "value": token[2:]})
        elif token.startswith("  "):
            result.append({"type": "unchanged", "value": token[2:]})

    return result


def line_diff(text1: str, text2: str):
    """
    Line-level diff
    """
    lines1 = text1.splitlines()
    lines2 = text2.splitlines()

    diff = difflib.unified_diff(lines1, lines2)

    return list(diff)
# FreedomRealm Knowledge Package

This package contains the local, deterministic knowledge navigation layer used by Demo Mode.

Current constraints:

- It does not call external connectors.
- It does not require an embedding service or model key.
- It reads only repository documents selected by the caller.
- It produces JSON-first `AnswerCard` and `DocChallengeDraft` objects for CLI and Web demo surfaces.

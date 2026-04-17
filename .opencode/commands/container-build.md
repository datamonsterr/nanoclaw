---
description: Force rebuild the NanoClaw agent container
agent: build
---

Force a clean rebuild of the NanoClaw agent container. The buildkit cache is aggressive and `--no-cache` alone does NOT invalidate COPY steps — the builder's volume retains stale files. To force a truly clean rebuild:

1. First prune the builder: `docker builder prune -f`
2. Then rebuild: `./container/build.sh`

This ensures no stale files from previous builds contaminate the new image.

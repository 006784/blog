# Lumen Blog TUI

Terminal UI for managing blog posts through the existing `/api/v1/posts` API.

## Setup

```bash
cd /Users/hk/blog
python3 -m venv tui/.venv
tui/.venv/bin/pip install -r tui/requirements.txt
```

## Run

Local Next.js server:

```bash
BLOG_API_URL=http://localhost:3000 BLOG_API_KEY=your-key tui/.venv/bin/python tui/blog_tui.py
```

Production:

```bash
BLOG_API_URL=https://www.artchain.icu BLOG_API_KEY=your-key tui/.venv/bin/python tui/blog_tui.py
```

`BLOG_API_KEY` must match the server-side `BLOG_API_KEY` configured for the Next.js app.

## Keys

- `n`: create post
- `e`: edit selected post
- `p`: toggle published/draft
- `c`: generate cover image
- `d`: delete selected post
- `r`: refresh
- `q`: quit

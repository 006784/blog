#!/usr/bin/env python3
"""拾光博客 TUI — 终端管理界面.

用法:
    BLOG_API_KEY=... python3 tui/blog_tui.py

环境变量:
    BLOG_API_KEY  必填，和 Next.js 服务端 BLOG_API_KEY 保持一致
    BLOG_API_URL  可选，默认 https://www.artchain.icu
"""

import os
from datetime import datetime
from typing import Any, Optional

import httpx
from textual import work, on
from textual.app import App, ComposeResult
from textual.binding import Binding
from textual.containers import Horizontal, Vertical, ScrollableContainer
from textual.screen import ModalScreen
from textual.widgets import (
    Button, DataTable, Footer, Header, Input,
    Label, Markdown, Select, Static, TextArea,
)
from textual.reactive import reactive

# ── 配置 ──────────────────────────────────────────────────────────────────────
API_BASE = os.getenv("BLOG_API_URL", "https://www.artchain.icu").rstrip("/")
API_KEY = os.getenv("BLOG_API_KEY", "").strip()
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
    "User-Agent": "Lumen-Blog-TUI/1.0",
}

CATEGORIES = ["tech", "life", "travel", "food", "reading", "music", "essay", "other"]

# ── HTTP helpers ───────────────────────────────────────────────────────────────
class ApiError(RuntimeError):
    """Raised when the remote blog API rejects a request."""


def api(method: str, path: str, **kwargs) -> httpx.Response:
    if not API_KEY:
        raise ApiError("请先设置 BLOG_API_KEY")

    url = f"{API_BASE}{path}"
    resp = httpx.request(
        method,
        url,
        headers=HEADERS,
        timeout=20,
        follow_redirects=True,
        trust_env=False,
        **kwargs,
    )
    return resp


def read_json(resp: httpx.Response) -> dict[str, Any]:
    try:
        data = resp.json()
    except Exception as exc:
        raise ApiError(f"接口返回不是 JSON: HTTP {resp.status_code}") from exc

    if resp.is_error:
        message = data.get("error") or data.get("message") or resp.text
        raise ApiError(f"HTTP {resp.status_code}: {message}")

    return data

def fmt_date(iso: str) -> str:
    try:
        return datetime.fromisoformat(iso.replace("Z", "+00:00")).strftime("%Y-%m-%d")
    except Exception:
        return iso[:10] if iso else "—"

# ── CSS ───────────────────────────────────────────────────────────────────────
CSS = """
/* Lumen paper theme */
Screen {
    background: #f7f4ee;
    color: #27241f;
}

Header {
    dock: top;
    height: 1;
    background: #efe9de;
    color: #625d52;
}

Footer {
    dock: bottom;
    height: 1;
    background: #efe9de;
    color: #857c6d;
}

#topbar {
    height: 5;
    padding: 1 2;
    background: #f7f4ee;
    border-bottom: solid #ded6c8;
}

#brand-mark {
    width: 13;
    height: 3;
    content-align: center middle;
    text-style: bold;
    background: #1b8272;
    color: #ffffff;
    border: round #1b8272;
    margin-right: 2;
}

#hero-copy {
    width: 1fr;
}

#hero-title {
    text-style: bold;
    color: #201d18;
}

#hero-subtitle {
    color: #766f63;
}

#api-pill {
    width: 34;
    content-align: center middle;
    color: #1b8272;
    background: #e9f2ee;
    border: round #bed8ce;
}

#main-layout {
    layout: horizontal;
    height: 1fr;
    padding: 1 2 0 2;
}

#left-pane {
    width: 64;
    margin-right: 2;
}

#right-pane {
    width: 1fr;
}

#library-card,
#detail-card {
    height: 1fr;
    background: #fffdf8;
    border: round #ded6c8;
    padding: 1 2;
}

#library-eyebrow,
#detail-eyebrow {
    color: #1b8272;
    text-style: bold;
}

#library-title {
    color: #201d18;
    text-style: bold;
    margin-bottom: 1;
}

DataTable {
    height: 1fr;
    background: #fffdf8;
    color: #3d382f;
}

DataTable > .datatable--header {
    background: #efe9de;
    color: #625d52;
    text-style: bold;
}

DataTable > .datatable--cursor {
    background: #1b8272;
    color: #ffffff;
}

#detail-title {
    color: #201d18;
    text-style: bold;
    margin: 1 0 0 0;
}

#detail-meta {
    color: #1b8272;
    margin-top: 1;
}

#detail-desc {
    color: #746b5d;
    margin: 1 0;
    padding: 1;
    background: #f7f4ee;
    border-left: thick #e8693a;
}

#detail-scroll {
    height: 1fr;
    background: #fffdf8;
    border-top: solid #efe9de;
    padding-top: 1;
}

#detail-content {
    color: #3d382f;
}

#actions {
    height: 5;
    layout: horizontal;
    padding: 1 2;
    background: #f7f4ee;
    border-top: solid #ded6c8;
}

#actions Button {
    margin-right: 1;
    min-width: 14;
    height: 3;
    border: round #ded6c8;
}

.btn-primary {
    background: #1b8272;
    color: #ffffff;
}

.btn-danger {
    background: #9b2335;
    color: #ffffff;
}

.btn-accent {
    background: #e8693a;
    color: #ffffff;
}

.btn-neutral {
    background: #fffdf8;
    color: #3d382f;
}

/* status badges in table */
.status-published { color: #4caf50; }
.status-draft     { color: #ff9800; }

/* modal base */
ModalScreen { align: center middle; }

/* post form modal */
PostFormModal > Vertical {
    width: 90; max-width: 110;
    height: 90%;
    background: #fffdf8;
    color: #27241f;
    border: round #1b8272;
    padding: 1 2;
}
PostFormModal Label  { color: #625d52; margin-top: 1; }
PostFormModal Input  { background: #f7f4ee; border: round #ded6c8; color: #27241f; }
PostFormModal Select { background: #f7f4ee; border: round #ded6c8; color: #27241f; }
PostFormModal TextArea { background: #fffdf8; border: round #ded6c8; color: #27241f; height: 18; }
PostFormModal #form-btns { height: 3; layout: horizontal; margin-top: 1; }
PostFormModal #form-btns Button { margin-right: 1; }

/* confirm modal */
ConfirmModal > Vertical {
    width: 50; height: auto;
    background: #fffdf8;
    color: #27241f;
    border: round #9b2335;
    padding: 2 3;
    align: center middle;
}
ConfirmModal #confirm-msg  { color: #27241f; text-align: center; margin-bottom: 2; }
ConfirmModal #confirm-btns { height: 3; layout: horizontal; align: center middle; }
ConfirmModal #confirm-btns Button { margin: 0 1; }
"""

# ── Confirm Modal ─────────────────────────────────────────────────────────────
class ConfirmModal(ModalScreen[bool]):
    def __init__(self, message: str):
        super().__init__()
        self._message = message

    def compose(self) -> ComposeResult:
        with Vertical():
            yield Label(self._message, id="confirm-msg")
            with Horizontal(id="confirm-btns"):
                yield Button("确认", variant="error",   id="yes")
                yield Button("取消", variant="default", id="no")

    @on(Button.Pressed, "#yes")
    def do_yes(self): self.dismiss(True)

    @on(Button.Pressed, "#no")
    def do_no(self):  self.dismiss(False)

# ── Post Form Modal ───────────────────────────────────────────────────────────
class PostFormModal(ModalScreen[Optional[dict]]):
    BINDINGS = [Binding("escape", "cancel", "取消")]

    def __init__(self, post: Optional[dict] = None):
        super().__init__()
        self._post = post or {}

    def compose(self) -> ComposeResult:
        p = self._post
        with Vertical():
            yield Label("✦ " + ("编辑文章" if p else "新建文章"))
            yield Label("标题 *")
            yield Input(value=p.get("title",""), id="f-title", placeholder="文章标题")
            yield Label("摘要")
            yield Input(value=p.get("description",""), id="f-desc", placeholder="一句话描述（可选）")
            with Horizontal():
                with Vertical():
                    yield Label("分类")
                    opts = [(c, c) for c in CATEGORIES]
                    cur  = p.get("category", "tech")
                    yield Select(opts, value=cur, id="f-cat")
                with Vertical():
                    yield Label("标签（逗号分隔）")
                    tags_str = ", ".join(p.get("tags", []) or [])
                    yield Input(value=tags_str, id="f-tags", placeholder="python, 教程")
            yield Label("正文（Markdown）")
            yield TextArea(p.get("content",""), id="f-content", language="markdown")
            with Horizontal(id="form-btns"):
                yield Button("保存草稿",  id="save-draft",   classes="btn-neutral")
                yield Button("发布",       id="save-publish", classes="btn-primary")
                yield Button("取消",       id="cancel-form",  classes="btn-danger")

    def _collect(self, status: str) -> dict:
        tags_raw = self.query_one("#f-tags", Input).value
        tags = [t.strip() for t in tags_raw.split(",") if t.strip()]
        category = self.query_one("#f-cat", Select).value
        return {
            "title":       self.query_one("#f-title", Input).value.strip(),
            "description": self.query_one("#f-desc",  Input).value.strip() or None,
            "category":    str(category or "tech"),
            "tags":        tags,
            "content":     self.query_one("#f-content", TextArea).text,
            "status":      status,
        }

    @on(Button.Pressed, "#save-draft")
    def do_draft(self):   self.dismiss(self._collect("draft"))

    @on(Button.Pressed, "#save-publish")
    def do_publish(self): self.dismiss(self._collect("published"))

    @on(Button.Pressed, "#cancel-form")
    def do_cancel(self):  self.dismiss(None)

    def action_cancel(self): self.dismiss(None)

# ── Main App ──────────────────────────────────────────────────────────────────
class BlogTUI(App):
    CSS = CSS
    TITLE = "拾光博客 · 管理终端"
    SUB_TITLE = API_BASE

    BINDINGS = [
        Binding("n",      "new_post",      "新建",    show=True),
        Binding("e",      "edit_post",     "编辑",    show=True),
        Binding("d",      "delete_post",   "删除",    show=True),
        Binding("p",      "toggle_status", "发布/草稿", show=True),
        Binding("c",      "gen_cover",     "生成封面", show=True),
        Binding("r",      "refresh",       "刷新",    show=True),
        Binding("q",      "quit",          "退出",    show=True),
    ]

    posts: reactive[list] = reactive([], recompose=False)
    selected_id: reactive[Optional[str]] = reactive(None)

    # ── layout ────────────────────────────────────────────────────────────────
    def compose(self) -> ComposeResult:
        yield Header()
        with Horizontal(id="topbar"):
            yield Static("Lumen", id="brand-mark")
            with Vertical(id="hero-copy"):
                yield Static("拾光博客管理", id="hero-title")
                yield Static("记录、整理、发布，把文章当成一页温柔的桌面。", id="hero-subtitle")
            yield Static(API_BASE.replace("https://", "").replace("http://", ""), id="api-pill")
        with Horizontal(id="main-layout"):
            with Vertical(id="left-pane"):
                with Vertical(id="library-card"):
                    yield Static("LIBRARY", id="library-eyebrow")
                    yield Static("文章目录", id="library-title")
                    yield DataTable(id="post-table", cursor_type="row")
            with Vertical(id="right-pane"):
                with Vertical(id="detail-card"):
                    yield Static("CURRENT POST", id="detail-eyebrow")
                    yield Static("", id="detail-title")
                    yield Static("", id="detail-meta")
                    yield Static("", id="detail-desc")
                    yield ScrollableContainer(
                        Markdown("", id="detail-content"),
                        id="detail-scroll",
                    )
        with Horizontal(id="actions"):
            yield Button("新建 n",      id="btn-new",    classes="btn-primary")
            yield Button("编辑 e",      id="btn-edit",   classes="btn-neutral")
            yield Button("发布切换 p",  id="btn-pub",    classes="btn-accent")
            yield Button("生成封面 c",  id="btn-cover",  classes="btn-neutral")
            yield Button("删除 d",      id="btn-del",    classes="btn-danger")
        yield Footer()

    def on_mount(self) -> None:
        tbl = self.query_one("#post-table", DataTable)
        tbl.add_columns("状态", "标题", "分类", "日期")
        self.action_refresh()

    # ── load posts ────────────────────────────────────────────────────────────
    @work(thread=True)
    def action_refresh(self) -> None:
        self.notify("加载中…", timeout=1)
        try:
            resp = api("GET", "/api/v1/posts/?limit=100&status=all")
            data = read_json(resp)
            self.call_from_thread(self._load_posts, data.get("posts", []))
        except Exception as exc:
            self.call_from_thread(self._show_error_state, str(exc))
            self.call_from_thread(self.notify, f"加载失败: {exc}", severity="error")

    def _load_posts(self, posts: list) -> None:
        self.posts = posts
        tbl = self.query_one("#post-table", DataTable)
        tbl.clear()
        for p in posts:
            status = p.get("status","draft")
            badge  = "● 已发布" if status == "published" else "○ 草稿"
            title  = p.get("title","(无标题)")[:40]
            cat    = p.get("category","—")
            date   = fmt_date(p.get("created_at",""))
            tbl.add_row(badge, title, cat, date, key=p["id"])
        if posts:
            tbl.move_cursor(row=0)
            self._show_detail(posts[0])
        else:
            self.selected_id = None
            self.query_one("#detail-title", Static).update("暂无文章")
            self.query_one("#detail-meta", Static).update("")
            self.query_one("#detail-desc", Static).update("按 n 新建第一篇文章。")
            self.query_one("#detail-content", Markdown).update("")

    def _show_error_state(self, message: str) -> None:
        self.posts = []
        self.selected_id = None
        self.query_one("#post-table", DataTable).clear()
        self.query_one("#detail-title", Static).update("无法连接博客 API")
        self.query_one("#detail-meta", Static).update(API_BASE)
        self.query_one("#detail-desc", Static).update("检查 BLOG_API_URL、BLOG_API_KEY 和本地 Next.js 服务。")
        self.query_one("#detail-content", Markdown).update(f"```text\n{message}\n```")

    # ── detail panel ─────────────────────────────────────────────────────────
    def _show_detail(self, post: dict) -> None:
        self.selected_id = post.get("id")
        status = "✅ 已发布" if post.get("status") == "published" else "📝 草稿"
        cover  = "🖼 有封面" if post.get("cover_image") else "○ 无封面"
        self.query_one("#detail-title",  Static).update(post.get("title",""))
        self.query_one("#detail-meta",   Static).update(
            f"{status}  {cover}  #{post.get('category','')}  {fmt_date(post.get('created_at',''))}"
        )
        self.query_one("#detail-desc",   Static).update(post.get("description") or "（无摘要）")
        content = post.get("content") or "*（内容为空）*"
        preview = content[:1500] + ("…" if len(content) > 1500 else "")
        self.query_one("#detail-content", Markdown).update(preview)

    @on(DataTable.RowSelected)
    def on_row_selected(self, event: DataTable.RowSelected) -> None:
        pid = str(event.row_key.value)
        post = next((p for p in self.posts if p["id"] == pid), None)
        if post:
            self._show_detail(post)

    @on(DataTable.RowHighlighted)
    def on_row_highlighted(self, event: DataTable.RowHighlighted) -> None:
        if event.row_key is None:
            return
        pid = str(event.row_key.value)
        post = next((p for p in self.posts if p["id"] == pid), None)
        if post:
            self._show_detail(post)

    # ── actions ───────────────────────────────────────────────────────────────
    @on(Button.Pressed, "#btn-new")
    def _btn_new(self): self.action_new_post()

    @on(Button.Pressed, "#btn-edit")
    def _btn_edit(self): self.action_edit_post()

    @on(Button.Pressed, "#btn-pub")
    def _btn_pub(self): self.action_toggle_status()

    @on(Button.Pressed, "#btn-cover")
    def _btn_cover(self): self.action_gen_cover()

    @on(Button.Pressed, "#btn-del")
    def _btn_del(self): self.action_delete_post()

    def _current_post(self) -> Optional[dict]:
        return next((p for p in self.posts if p["id"] == self.selected_id), None)

    def _fetch_post_detail(self, post: dict) -> dict:
        identifier = post.get("id") or post.get("slug")
        if not identifier:
            raise ApiError("当前文章缺少 id")
        data = read_json(api("GET", f"/api/v1/posts/{identifier}/"))
        return data.get("post") or post

    # new
    def action_new_post(self) -> None:
        self.push_screen(PostFormModal(), self._on_form_result_new)

    @work(thread=True)
    def _on_form_result_new(self, payload: Optional[dict]) -> None:
        if not payload or not payload.get("title"):
            return
        try:
            resp = api("POST", "/api/v1/posts/", json=payload)
            read_json(resp)
            self.call_from_thread(self.notify, "文章已创建 ✓", timeout=2)
            self.call_from_thread(self.action_refresh)
        except Exception as exc:
            self.call_from_thread(self.notify, str(exc), severity="error")

    # edit
    def action_edit_post(self) -> None:
        post = self._current_post()
        if not post:
            self.notify("请先选择一篇文章", severity="warning")
            return
        try:
            detail = self._fetch_post_detail(post)
        except Exception as exc:
            self.notify(f"读取文章失败: {exc}", severity="error")
            return
        self.push_screen(PostFormModal(detail), self._on_form_result_edit)

    @work(thread=True)
    def _on_form_result_edit(self, payload: Optional[dict]) -> None:
        if not payload or not payload.get("title"):
            return
        pid = self.selected_id
        try:
            resp = api("PATCH", f"/api/v1/posts/{pid}/", json=payload)
            read_json(resp)
            self.call_from_thread(self.notify, "已保存 ✓", timeout=2)
            self.call_from_thread(self.action_refresh)
        except Exception as exc:
            self.call_from_thread(self.notify, str(exc), severity="error")

    # delete
    def action_delete_post(self) -> None:
        post = self._current_post()
        if not post:
            self.notify("请先选择一篇文章", severity="warning")
            return
        title = post.get("title","")[:30]
        self.push_screen(
            ConfirmModal(f"确认删除「{title}」？\n此操作不可撤销。"),
            self._on_confirm_delete,
        )

    @work(thread=True)
    def _on_confirm_delete(self, confirmed: bool) -> None:
        if not confirmed:
            return
        pid = self.selected_id
        try:
            resp = api("DELETE", f"/api/v1/posts/{pid}/")
            read_json(resp)
            self.call_from_thread(self.notify, "已删除", timeout=2)
            self.call_from_thread(self.action_refresh)
        except Exception as exc:
            self.call_from_thread(self.notify, str(exc), severity="error")

    # toggle publish
    @work(thread=True)
    def action_toggle_status(self) -> None:
        post = self._current_post()
        if not post:
            self.call_from_thread(self.notify, "请先选择一篇文章", severity="warning")
            return
        new_status = "draft" if post.get("status") == "published" else "published"
        label = "已发布" if new_status == "published" else "已转为草稿"
        try:
            resp = api("PATCH", f"/api/v1/posts/{post['id']}/", json={"status": new_status})
            read_json(resp)
            self.call_from_thread(self.notify, f"{label} ✓", timeout=2)
            self.call_from_thread(self.action_refresh)
        except Exception as exc:
            self.call_from_thread(self.notify, str(exc), severity="error")

    # generate cover
    @work(thread=True)
    def action_gen_cover(self) -> None:
        post = self._current_post()
        if not post:
            self.call_from_thread(self.notify, "请先选择一篇文章", severity="warning")
            return
        self.call_from_thread(self.notify, "正在生成封面，请稍候…", timeout=15)
        try:
            resp = api("POST", f"/api/v1/posts/{post['id']}/cover/")
            data = read_json(resp)
            url = data.get("cover_image","")
            short = url.split("/")[-1][:30] if url else "—"
            self.call_from_thread(self.notify, f"封面已生成 ✓  {short}", timeout=4)
            self.call_from_thread(self.action_refresh)
        except Exception as exc:
            self.call_from_thread(self.notify, str(exc), severity="error")

# ── entry ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    if not API_KEY:
        print("错误：请设置环境变量 BLOG_API_KEY")
        print("示例：BLOG_API_KEY=你的密钥 BLOG_API_URL=http://localhost:3000 python3 tui/blog_tui.py")
        raise SystemExit(1)
    BlogTUI().run()

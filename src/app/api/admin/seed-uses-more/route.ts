import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdminSession } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

const MORE_DATA = [
  // ── 芯片 / CPU ──────────────────────────────────────────
  { category: 'chips', name: 'Apple M4 Pro',           description: '3nm 工艺，CPU/GPU/NPU 三合一，MacBook Pro 旗舰芯片',   icon_url: 'https://www.apple.com/favicon.ico',                          link: 'https://www.apple.com/newsroom/2024/10/apple-introduces-m4-pro-and-m4-max/', sort_order: 1 },
  { category: 'chips', name: 'Apple M4 Max',           description: '最高 16 核 CPU + 40 核 GPU，专业创作旗舰',              icon_url: 'https://www.apple.com/favicon.ico',                          link: 'https://www.apple.com/shop/buy-mac/mac-studio',                 sort_order: 2 },
  { category: 'chips', name: 'Apple M4 Ultra',         description: '双 M4 Max 封装，128GB 统一内存，Mac Pro 级别算力',      icon_url: 'https://www.apple.com/favicon.ico',                          link: 'https://www.apple.com/mac-pro/',                                sort_order: 3 },
  { category: 'chips', name: 'AMD Ryzen 9 9950X',      description: '16 核 32 线程，Zen 5 架构，桌面端旗舰 CPU',             icon_url: 'https://www.amd.com/favicon.ico',                            link: 'https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-9-9950x.html', sort_order: 4 },
  { category: 'chips', name: 'AMD Ryzen AI 9 HX 370',  description: 'Strix Point 架构，内置 NPU，移动端 AI 性能最强',        icon_url: 'https://www.amd.com/favicon.ico',                            link: 'https://www.amd.com/en/products/processors/laptop/ryzen/ai-300-series.html', sort_order: 5 },
  { category: 'chips', name: 'Intel Core Ultra 9 285K','description': 'Arrow Lake，24 核心（8P+16E），桌面旗舰',            icon_url: 'https://www.intel.com/favicon.ico',                          link: 'https://www.intel.com/content/www/us/en/products/sku/236847.html', sort_order: 6 },
  { category: 'chips', name: 'Qualcomm Snapdragon X Elite', description: 'ARM 架构 Windows 笔记本，NPU 45TOPS',             icon_url: 'https://www.qualcomm.com/favicon.ico',                       link: 'https://www.qualcomm.com/products/mobile/snapdragon/pcs-and-tablets/snapdragon-x-series/snapdragon-x-elite', sort_order: 7 },
  { category: 'chips', name: 'NVIDIA Grace Hopper',    description: 'ARM CPU + H100 GPU 超级芯片，AI 服务器首选',            icon_url: 'https://www.nvidia.com/favicon.ico',                         link: 'https://www.nvidia.com/en-us/data-center/grace-hopper-superchip/', sort_order: 8 },
  { category: 'chips', name: 'AMD EPYC 9754',          description: '128 核 256 线程，数据中心王者',                         icon_url: 'https://www.amd.com/favicon.ico',                            link: 'https://www.amd.com/en/products/processors/server/epyc/9004-series.html', sort_order: 9 },
  { category: 'chips', name: 'Raspberry Pi RP2040',    description: '双核 Cortex-M0+，$1 起，嵌入式神芯',                   icon_url: 'https://www.raspberrypi.com/favicon.ico',                    link: 'https://www.raspberrypi.com/products/rp2040/',                  sort_order: 10 },

  // ── Mac 开源工具 ─────────────────────────────────────────
  { category: 'opensource', name: 'Homebrew',         description: 'Mac 最流行的包管理器，安装命令行工具必备',               icon_url: 'https://brew.sh/assets/img/homebrew.svg',                    link: 'https://brew.sh',                sort_order: 1 },
  { category: 'opensource', name: 'iTerm2',           description: '功能强大的 Mac 终端替代品，支持分屏与搜索',             icon_url: 'https://iterm2.com/favicon.ico',                             link: 'https://iterm2.com',             sort_order: 2 },
  { category: 'opensource', name: 'Rectangle',        description: '键盘快捷键管理窗口位置与大小',                          icon_url: 'https://rectangleapp.com/assets/images/rectangle.png',       link: 'https://rectangleapp.com',       sort_order: 3 },
  { category: 'opensource', name: 'Raycast',          description: '超强启动器，替代 Spotlight，支持插件扩展',              icon_url: 'https://www.raycast.com/favicon-production.png',             link: 'https://www.raycast.com',        sort_order: 4 },
  { category: 'opensource', name: 'IINA',             description: '颜值最高的 Mac 视频播放器，支持所有主流格式',           icon_url: 'https://iina.io/images/iina-icon.png',                       link: 'https://iina.io',                sort_order: 5 },
  { category: 'opensource', name: 'AltTab',           description: '带窗口预览的 ⌘Tab 切换器，类 Windows 体验',           icon_url: 'https://alt-tab-macos.netlify.app/public/assets/icon.png',   link: 'https://alt-tab-macos.netlify.app', sort_order: 6 },
  { category: 'opensource', name: 'Stats',            description: '状态栏显示 CPU/内存/网速等系统信息',                   icon_url: 'https://raw.githubusercontent.com/exelban/stats/master/Stats/Supporting%20Files/Assets.xcassets/AppIcon.appiconset/icon_256x256.png', link: 'https://github.com/exelban/stats', sort_order: 7 },
  { category: 'opensource', name: 'Hidden Bar',       description: '隐藏状态栏多余图标，保持整洁',                         icon_url: 'https://raw.githubusercontent.com/dwarvesf/hidden/develop/img/icon.png', link: 'https://github.com/dwarvesf/hidden', sort_order: 8 },
  { category: 'opensource', name: 'AppCleaner',       description: '彻底卸载 Mac 应用，清理残留文件',                      icon_url: 'https://freemacsoft.net/img/appcleaner_icon.png',             link: 'https://freemacsoft.net/appcleaner/', sort_order: 9 },
  { category: 'opensource', name: 'Keka',             description: '全能解压缩工具，支持 7z / RAR / ZIP 等',              icon_url: 'https://www.keka.io/img/Keka-Square.png',                    link: 'https://www.keka.io',            sort_order: 10 },
  { category: 'opensource', name: 'ImageOptim',       description: '无损压缩图片，拖拽即用',                               icon_url: 'https://imageoptim.com/favicon.ico',                         link: 'https://imageoptim.com',         sort_order: 11 },
  { category: 'opensource', name: 'Maccy',            description: '轻量剪贴板历史管理器，⌘⇧V 快速调用',                 icon_url: 'https://maccy.app/img/maccy/Logo.png',                       link: 'https://maccy.app',              sort_order: 12 },
  { category: 'opensource', name: 'Mos',              description: '让外接鼠标滚动更丝滑，支持反向滚动',                   icon_url: 'https://mos.caldis.me/favicon.ico',                          link: 'https://mos.caldis.me',          sort_order: 13 },
  { category: 'opensource', name: 'HandBrake',        description: '免费视频格式转换器，批量转码神器',                     icon_url: 'https://handbrake.fr/img/HandBrake.png',                     link: 'https://handbrake.fr',           sort_order: 14 },
  { category: 'opensource', name: 'Wireshark',        description: '网络流量抓包与分析，工程师必备',                       icon_url: 'https://www.wireshark.org/favicon.ico',                      link: 'https://www.wireshark.org',      sort_order: 15 },
  { category: 'opensource', name: 'DB Browser for SQLite', description: '可视化管理 SQLite 数据库',                        icon_url: 'https://sqlitebrowser.org/images/sqlitebrowser.svg',          link: 'https://sqlitebrowser.org',      sort_order: 16 },
  { category: 'opensource', name: 'Cyberduck',        description: 'FTP / S3 / WebDAV 文件传输客户端',                   icon_url: 'https://cyberduck.io/favicon.ico',                           link: 'https://cyberduck.io',           sort_order: 17 },
  { category: 'opensource', name: 'VLC',              description: '跨平台万能媒体播放器',                                 icon_url: 'https://www.videolan.org/favicon.ico',                       link: 'https://www.videolan.org/vlc/',  sort_order: 18 },
  { category: 'opensource', name: 'Oh My Zsh',        description: 'Zsh 配置框架，主题 + 插件一键搞定',                   icon_url: 'https://ohmyz.sh/img/OMZLogo_BnW.png',                      link: 'https://ohmyz.sh',               sort_order: 19 },
  { category: 'opensource', name: 'MonitorControl',   description: '用键盘控制外接显示器亮度与音量',                       icon_url: 'https://raw.githubusercontent.com/MonitorControl/MonitorControl/main/.github/Icon.png', link: 'https://github.com/MonitorControl/MonitorControl', sort_order: 20 },

  // ── 编程语言 ─────────────────────────────────────────────
  { category: 'languages', name: 'Python',       description: 'AI/数据科学首选，语法简洁，生态极丰富',           icon_url: 'https://www.python.org/favicon.ico',          link: 'https://www.python.org',         sort_order: 1 },
  { category: 'languages', name: 'TypeScript',   description: 'JavaScript 的超集，静态类型让大型项目更安全',     icon_url: 'https://www.typescriptlang.org/favicon.ico',  link: 'https://www.typescriptlang.org', sort_order: 2 },
  { category: 'languages', name: 'JavaScript',   description: '前后端通吃，Web 开发的基础语言',                  icon_url: 'https://developer.mozilla.org/favicon.ico',   link: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', sort_order: 3 },
  { category: 'languages', name: 'Rust',         description: '内存安全 + 极致性能，系统编程新时代',             icon_url: 'https://www.rust-lang.org/favicon.ico',       link: 'https://www.rust-lang.org',      sort_order: 4 },
  { category: 'languages', name: 'Go',           description: 'Google 出品，并发原生，云原生生态第一语言',       icon_url: 'https://go.dev/images/favicon-gopher.svg',    link: 'https://go.dev',                 sort_order: 5 },
  { category: 'languages', name: 'Java',         description: 'Write Once Run Anywhere，企业级后端常青树',      icon_url: 'https://www.java.com/favicon.ico',             link: 'https://www.java.com',           sort_order: 6 },
  { category: 'languages', name: 'Kotlin',       description: 'Android 官方语言，比 Java 更简洁现代',           icon_url: 'https://kotlinlang.org/favicon.ico',          link: 'https://kotlinlang.org',         sort_order: 7 },
  { category: 'languages', name: 'Swift',        description: 'Apple 开源，iOS/macOS 原生开发首选',             icon_url: 'https://www.swift.org/favicon.ico',           link: 'https://www.swift.org',          sort_order: 8 },
  { category: 'languages', name: 'C',            description: '操作系统与嵌入式的基石，最底层的力量',            icon_url: 'https://www.cprogramming.com/favicon.ico',    link: 'https://www.open-std.org/jtc1/sc22/wg14/', sort_order: 9 },
  { category: 'languages', name: 'C++',          description: '游戏引擎、高频交易、编译器的首选语言',            icon_url: 'https://isocpp.org/favicon.ico',              link: 'https://isocpp.org',             sort_order: 10 },
  { category: 'languages', name: 'PHP',          description: '全球 80% 网站的后端基石，WordPress 语言',        icon_url: 'https://www.php.net/favicon.ico',             link: 'https://www.php.net',            sort_order: 11 },
  { category: 'languages', name: 'Ruby',         description: '优雅简洁，Rails 框架让 Web 开发飞速起步',        icon_url: 'https://www.ruby-lang.org/favicon.ico',       link: 'https://www.ruby-lang.org',      sort_order: 12 },
  { category: 'languages', name: 'Dart',         description: 'Flutter 的基础语言，一套代码跨六端',             icon_url: 'https://dart.dev/favicon.ico',                link: 'https://dart.dev',               sort_order: 13 },
  { category: 'languages', name: 'Scala',        description: 'JVM 上的函数式 + 面向对象，Spark 首选',         icon_url: 'https://www.scala-lang.org/favicon.ico',      link: 'https://www.scala-lang.org',     sort_order: 14 },
  { category: 'languages', name: 'Elixir',       description: '高并发、容错，Erlang VM 上的现代语言',           icon_url: 'https://elixir-lang.org/favicon.ico',         link: 'https://elixir-lang.org',        sort_order: 15 },
  { category: 'languages', name: 'Haskell',      description: '纯函数式编程，学了让你思维升维',                 icon_url: 'https://www.haskell.org/favicon.ico',         link: 'https://www.haskell.org',        sort_order: 16 },
  { category: 'languages', name: 'R',            description: '统计分析与数据可视化专用语言',                   icon_url: 'https://www.r-project.org/favicon.ico',       link: 'https://www.r-project.org',      sort_order: 17 },
  { category: 'languages', name: 'Julia',        description: '科学计算、数值分析，性能媲美 C 的动态语言',      icon_url: 'https://julialang.org/favicon.ico',           link: 'https://julialang.org',          sort_order: 18 },
  { category: 'languages', name: 'Lua',          description: '轻量嵌入式脚本，游戏开发与 Nginx 扩展常用',      icon_url: 'https://www.lua.org/favicon.ico',             link: 'https://www.lua.org',            sort_order: 19 },
  { category: 'languages', name: 'Zig',          description: '现代 C 的挑战者，无隐式控制流，编译时计算',      icon_url: 'https://ziglang.org/favicon.ico',             link: 'https://ziglang.org',            sort_order: 20 },
  { category: 'languages', name: 'WebAssembly',  description: '浏览器原生字节码，让 Web 跑 C/Rust 代码',       icon_url: 'https://webassembly.org/favicon.ico',         link: 'https://webassembly.org',        sort_order: 21 },
  { category: 'languages', name: 'Clojure',      description: 'JVM 上的 Lisp，数据驱动与不可变数据哲学',       icon_url: 'https://clojure.org/favicon.ico',             link: 'https://clojure.org',            sort_order: 22 },
];

export async function POST(req: NextRequest) {
  const session = await requireAdminSession(req);
  if (!session) return NextResponse.json({ error: '未授权' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('uses_items')
    .insert(MORE_DATA)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: `成功写入 ${data.length} 条数据`, data });
}

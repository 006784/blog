import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdminSession } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

const BOOKS = [
  // ══ 武侠小说 — 金庸 ══════════════════════════════════════
  { type: 'book', title: '射雕英雄传', author: '金庸', status: 'done', rating: 9.5, review: '郭靖与黄蓉的故事，金庸最经典作品之一，侠之大者为国为民', external_link: 'https://book.douban.com/subject/1002299/' },
  { type: 'book', title: '神雕侠侣', author: '金庸', status: 'done', rating: 9.2, review: '问世间情为何物，杨过与小龙女的爱情传奇', external_link: 'https://book.douban.com/subject/1002301/' },
  { type: 'book', title: '倚天屠龙记', author: '金庸', status: 'done', rating: 9.0, review: '武当少侠张无忌的江湖传奇，明教与六大门派的恩怨情仇', external_link: 'https://book.douban.com/subject/1002303/' },
  { type: 'book', title: '天龙八部', author: '金庸', status: 'done', rating: 9.8, review: '萧峰、段誉、虚竹三兄弟，金庸篇幅最宏大的武侠巨著', external_link: 'https://book.douban.com/subject/1002297/' },
  { type: 'book', title: '笑傲江湖', author: '金庸', status: 'done', rating: 9.5, review: '令狐冲与任盈盈，最具自由精神的金庸作品', external_link: 'https://book.douban.com/subject/1002296/' },
  { type: 'book', title: '鹿鼎记', author: '金庸', status: 'done', rating: 9.3, review: '韦小宝的传奇人生，金庸封笔之作，反武侠的武侠', external_link: 'https://book.douban.com/subject/1002295/' },
  { type: 'book', title: '书剑恩仇录', author: '金庸', status: 'want', review: '陈家洛与乾隆，金庸处女作，红花会的江湖故事', external_link: 'https://book.douban.com/subject/1002291/' },
  { type: 'book', title: '雪山飞狐', author: '金庸', status: 'want', review: '开放式结局，胡斐的刀到底劈还是不劈？', external_link: 'https://book.douban.com/subject/1002293/' },
  { type: 'book', title: '侠客行', author: '金庸', status: 'want', review: '石破天的奇遇，侠客岛的武学秘密', external_link: 'https://book.douban.com/subject/1002294/' },
  { type: 'book', title: '碧血剑', author: '金庸', status: 'want', review: '袁承志的复仇之路，明末清初的江湖风云', external_link: 'https://book.douban.com/subject/1002292/' },

  // ══ 武侠小说 — 古龙 ══════════════════════════════════════
  { type: 'book', title: '楚留香传奇', author: '古龙', status: 'done', rating: 9.0, review: '香帅楚留香，盗帅风流，古龙最具魅力的男主角', external_link: 'https://book.douban.com/subject/1006054/' },
  { type: 'book', title: '陆小凤传奇', author: '古龙', status: 'done', rating: 9.0, review: '四条眉毛的陆小凤，推理与武侠的完美结合', external_link: 'https://book.douban.com/subject/1006058/' },
  { type: 'book', title: '多情剑客无情剑', author: '古龙', status: 'done', rating: 9.5, review: '小李飞刀李寻欢，天下最悲情的侠客', external_link: 'https://book.douban.com/subject/1006049/' },
  { type: 'book', title: '绝代双骄', author: '古龙', status: 'done', rating: 8.8, review: '花无缺与小鱼儿，亦正亦邪双生子的江湖', external_link: 'https://book.douban.com/subject/1006051/' },
  { type: 'book', title: '七种武器', author: '古龙', status: 'want', review: '长生剑、孔雀翎、碧玉刀……古龙短篇精华集', external_link: 'https://book.douban.com/subject/1006055/' },
  { type: 'book', title: '萧十一郎', author: '古龙', status: 'want', review: '最孤独的侠客，古龙文字最美的作品之一', external_link: 'https://book.douban.com/subject/1006056/' },
  { type: 'book', title: '武林外史', author: '古龙', status: 'want', review: '沈浪与朱七七，一代大侠的成长故事', external_link: 'https://book.douban.com/subject/1006052/' },

  // ══ 武侠小说 — 梁羽生 ════════════════════════════════════
  { type: 'book', title: '七剑下天山', author: '梁羽生', status: 'want', review: '凌未风与纳兰明慧，新武侠开山之作', external_link: 'https://book.douban.com/subject/1007185/' },
  { type: 'book', title: '白发魔女传', author: '梁羽生', status: 'done', rating: 8.8, review: '练霓裳与卓一航，爱而不得的千古绝恋', external_link: 'https://book.douban.com/subject/1007181/' },
  { type: 'book', title: '云海玉弓缘', author: '梁羽生', status: 'want', review: '厉胜男的痴情与执着，梁羽生最好的女主角', external_link: 'https://book.douban.com/subject/1007184/' },
  { type: 'book', title: '萍踪侠影录', author: '梁羽生', status: 'want', review: '张丹枫与云蕾，侠骨柔情的明代传奇', external_link: 'https://book.douban.com/subject/1007183/' },

  // ══ 网络小说 — 仙侠玄幻 ══════════════════════════════════
  { type: 'book', title: '斗破苍穹', author: '天蚕土豆', status: 'done', rating: 8.5, review: '废材少年萧炎的逆袭之路，国产玄幻开山经典', external_link: 'https://book.douban.com/subject/3006611/' },
  { type: 'book', title: '斗罗大陆', author: '唐家三少', status: 'done', rating: 8.5, review: '唐三穿越异世，魂师的热血成长故事', external_link: 'https://book.douban.com/subject/3219537/' },
  { type: 'book', title: '凡人修仙传', author: '忘语', status: 'done', rating: 9.0, review: '韩立从凡人到仙人的漫漫修行路，最真实的修仙世界观', external_link: 'https://book.douban.com/subject/4099302/' },
  { type: 'book', title: '完美世界', author: '辰东', status: 'doing', rating: 9.0, review: '石昊踏上称霸诸天之路，世界观宏大磅礴', external_link: 'https://book.douban.com/subject/24697055/' },
  { type: 'book', title: '遮天', author: '辰东', status: 'done', rating: 8.8, review: '叶凡的封神之路，逆天改命的热血故事', external_link: 'https://book.douban.com/subject/10552045/' },
  { type: 'book', title: '修真四万年', author: '卧牛真人', status: 'want', review: '废材少年李乙丑的逆天之路，硬核修仙+热血战斗', external_link: 'https://book.douban.com/subject/10566628/' },
  { type: 'book', title: '大主宰', author: '天蚕土豆', status: 'want', review: '牧尘纵横大千世界，天蚕的集大成之作', external_link: 'https://book.douban.com/subject/24532725/' },
  { type: 'book', title: '武动乾坤', author: '天蚕土豆', status: 'want', review: '林动以符文之力称霸大陆', external_link: 'https://book.douban.com/subject/10568219/' },
  { type: 'book', title: '全职高手', author: '蝴蝶蓝', status: 'done', rating: 9.5, review: '电竞传奇叶修重返荣耀之路，国产网文天花板', external_link: 'https://book.douban.com/subject/21348178/' },
  { type: 'book', title: '庆余年', author: '猫腻', status: 'done', rating: 9.5, review: '范闲穿越的权谋人生，文笔极佳的历史幻想', external_link: 'https://book.douban.com/subject/2158249/' },
  { type: 'book', title: '将夜', author: '猫腻', status: 'want', review: '宁缺与桑桑，看山是山的境界', external_link: 'https://book.douban.com/subject/10605609/' },
  { type: 'book', title: '择天记', author: '猫腻', status: 'want', review: '陈长生与天书，与命运的抗争', external_link: 'https://book.douban.com/subject/26317620/' },
  { type: 'book', title: '赘婿', author: '愤怒的香蕉', status: 'done', rating: 9.2, review: '现代人穿越成上门女婿，种田+权谋+爽文天花板', external_link: 'https://book.douban.com/subject/10553790/' },

  // ══ 言情小说 ═════════════════════════════════════════════
  { type: 'book', title: '步步惊心', author: '桐华', status: 'done', rating: 9.0, review: '若曦穿越清朝，九王夺嫡的悲情爱恋，泪点极高', external_link: 'https://book.douban.com/subject/3222473/' },
  { type: 'book', title: '甄嬛传', author: '流潋紫', status: 'done', rating: 9.0, review: '甄嬛的宫斗人生，后宫权谋第一书', external_link: 'https://book.douban.com/subject/3033742/' },
  { type: 'book', title: '知否知否应是绿肥红瘦', author: '关心则乱', status: 'done', rating: 9.2, review: '盛明兰的智慧人生，宋朝版的豪门宅斗', external_link: 'https://book.douban.com/subject/5346736/' },
  { type: 'book', title: '木兰无长兄', author: '祈祷君', status: 'want', review: '女扮男装花木兰版本，成长与爱情并行', external_link: 'https://book.douban.com/subject/25790246/' },
  { type: 'book', title: '你好旧时光', author: '八月长安', status: 'done', rating: 9.0, review: '青春成长小说，余周周的少年时代', external_link: 'https://book.douban.com/subject/21380512/' },
  { type: 'book', title: '最好的我们', author: '八月长安', status: 'done', rating: 9.0, review: '耿耿与余淮，振华三部曲最经典的青春', external_link: 'https://book.douban.com/subject/25801428/' },
  { type: 'book', title: '何以笙箫默', author: '顾漫', status: 'done', rating: 8.5, review: '何以琛与赵默笙，一句何以笙箫默，感动了一代人', external_link: 'https://book.douban.com/subject/1907020/' },
  { type: 'book', title: '微微一笑很倾城', author: '顾漫', status: 'done', rating: 8.5, review: '网游甜文鼻祖，贝微微与大神的校园爱情', external_link: 'https://book.douban.com/subject/3759005/' },
  { type: 'book', title: '致我们终将逝去的青春', author: '辛夷坞', status: 'done', rating: 8.5, review: '郑微的青春和爱情，写尽了爱而不得的遗憾', external_link: 'https://book.douban.com/subject/3219578/' },
  { type: 'book', title: '花千骨', author: 'Fresh果果', status: 'want', review: '仙侠言情，师徒之间的禁忌之恋', external_link: 'https://book.douban.com/subject/5004048/' },
  { type: 'book', title: '三生三世十里桃花', author: '唐七公子', status: 'want', review: '白浅与夜华的三世情缘，仙侠古典爱情', external_link: 'https://book.douban.com/subject/5912808/' },

  // ══ 中国名著 ══════════════════════════════════════════════
  { type: 'book', title: '红楼梦', author: '曹雪芹', status: 'done', rating: 10, review: '中国古典四大名著之首，宝黛钗的爱恨情仇与贾府兴衰', external_link: 'https://book.douban.com/subject/1007305/' },
  { type: 'book', title: '三国演义', author: '罗贯中', status: 'done', rating: 9.5, review: '汉末三国风云，桃园结义到三国归晋，经典史诗巨著', external_link: 'https://book.douban.com/subject/1019568/' },
  { type: 'book', title: '水浒传', author: '施耐庵', status: 'done', rating: 9.0, review: '梁山108将的聚义与悲剧，侠义精神的史诗', external_link: 'https://book.douban.com/subject/1019682/' },
  { type: 'book', title: '西游记', author: '吴承恩', status: 'done', rating: 9.5, review: '取经之路的神魔世界，中华幻想文学的源头', external_link: 'https://book.douban.com/subject/1029553/' },
  { type: 'book', title: '聊斋志异', author: '蒲松龄', status: 'want', review: '鬼狐精怪的奇谭，借异世界讽刺现实', external_link: 'https://book.douban.com/subject/1003078/' },
  { type: 'book', title: '儒林外史', author: '吴敬梓', status: 'want', review: '封建科举制度的讽刺画卷，范进中举流传千年', external_link: 'https://book.douban.com/subject/1008309/' },
  { type: 'book', title: '围城', author: '钱锺书', status: 'done', rating: 9.5, review: '婚姻是围城，城外的人想进去，城里的人想出来', external_link: 'https://book.douban.com/subject/1008145/' },
  { type: 'book', title: '平凡的世界', author: '路遥', status: 'done', rating: 9.8, review: '孙少安与孙少平，普通人的奋斗与尊严，感动无数读者', external_link: 'https://book.douban.com/subject/1200840/' },
  { type: 'book', title: '活着', author: '余华', status: 'done', rating: 9.5, review: '福贵的苦难人生，写尽了中国人的坚韧与悲悯', external_link: 'https://book.douban.com/subject/4913064/' },
  { type: 'book', title: '许三观卖血记', author: '余华', status: 'done', rating: 9.2, review: '用卖血支撑家庭的小人物，余华最温情的作品', external_link: 'https://book.douban.com/subject/1029791/' },
  { type: 'book', title: '白鹿原', author: '陈忠实', status: 'want', review: '关中大地上的家族史，茅盾文学奖最高杰作之一', external_link: 'https://book.douban.com/subject/1085799/' },

  // ══ 外国名著 ══════════════════════════════════════════════
  { type: 'book', title: '百年孤独', author: '加西亚·马尔克斯', status: 'done', rating: 9.8, review: '布恩迪亚家族七代人的孤独，魔幻现实主义巅峰之作', external_link: 'https://book.douban.com/subject/6082808/' },
  { type: 'book', title: '1984', author: '乔治·奥威尔', status: 'done', rating: 9.5, review: '老大哥在看着你，极权主义的最深刻警示', external_link: 'https://book.douban.com/subject/4820710/' },
  { type: 'book', title: '动物农场', author: '乔治·奥威尔', status: 'done', rating: 9.0, review: '所有动物都平等，但有些动物比其他动物更平等', external_link: 'https://book.douban.com/subject/2035179/' },
  { type: 'book', title: '悲惨世界', author: '维克多·雨果', status: 'done', rating: 9.5, review: '冉·阿让的救赎之路，对人性善恶最深刻的探讨', external_link: 'https://book.douban.com/subject/1069ps/' },
  { type: 'book', title: '基督山伯爵', author: '大仲马', status: 'done', rating: 9.5, review: '复仇与宽恕的史诗，文学史上最精彩的复仇故事', external_link: 'https://book.douban.com/subject/1085265/' },
  { type: 'book', title: '傲慢与偏见', author: '简·奥斯汀', status: 'done', rating: 9.2, review: '伊丽莎白与达西的爱情，英国文学最优雅的讽刺', external_link: 'https://book.douban.com/subject/1008145p/' },
  { type: 'book', title: '简·爱', author: '夏洛蒂·勃朗特', status: 'done', rating: 9.0, review: '我们在灵魂上是平等的，最具女性独立精神的爱情小说', external_link: 'https://book.douban.com/subject/1019903/' },
  { type: 'book', title: '呼啸山庄', author: '艾米莉·勃朗特', status: 'want', review: '希斯克利夫与凯瑟琳，爱与恨交织的黑暗浪漫', external_link: 'https://book.douban.com/subject/1019902/' },
  { type: 'book', title: '罪与罚', author: '陀思妥耶夫斯基', status: 'done', rating: 9.5, review: '拉斯科尔尼科夫的心理挣扎，探索罪恶与救赎的本质', external_link: 'https://book.douban.com/subject/1085242/' },
  { type: 'book', title: '安娜·卡列尼娜', author: '列夫·托尔斯泰', status: 'want', review: '幸福的家庭都是相似的，不幸的家庭各有各的不幸', external_link: 'https://book.douban.com/subject/1084361/' },
  { type: 'book', title: '战争与和平', author: '列夫·托尔斯泰', status: 'want', review: '拿破仑战争史诗，最宏大的俄罗斯文学巨著', external_link: 'https://book.douban.com/subject/1084362/' },
  { type: 'book', title: '老人与海', author: '海明威', status: 'done', rating: 9.0, review: '圣地亚哥与马林鱼，人可以被毁灭但不能被打败', external_link: 'https://book.douban.com/subject/1064275/' },
  { type: 'book', title: '了不起的盖茨比', author: '菲茨杰拉德', status: 'done', rating: 9.0, review: '美国梦的幻灭，绿灯永远在彼岸', external_link: 'https://book.douban.com/subject/1008351/' },
  { type: 'book', title: '哈利·波特（全七册）', author: 'J.K.罗琳', status: 'done', rating: 9.8, review: '霍格沃茨的魔法世界，陪伴了几代人成长的奇幻经典', external_link: 'https://book.douban.com/subject/24531956/' },
  { type: 'book', title: '指环王', author: '托尔金', status: 'done', rating: 9.8, review: '奇幻文学的奠基之作，中土世界的史诗传说', external_link: 'https://book.douban.com/subject/1336130/' },
  { type: 'book', title: '霍比特人', author: '托尔金', status: 'done', rating: 9.2, review: '比尔博的冒险，中土世界的前传故事', external_link: 'https://book.douban.com/subject/1279982/' },
  { type: 'book', title: '小王子', author: '圣埃克苏佩里', status: 'done', rating: 9.5, review: '写给大人的童话，重要的东西用眼睛是看不见的', external_link: 'https://book.douban.com/subject/1084336/' },
  { type: 'book', title: '变形记', author: '卡夫卡', status: 'done', rating: 9.0, review: '格里高尔变成甲虫，荒诞主义对现代异化的揭示', external_link: 'https://book.douban.com/subject/1085220/' },
  { type: 'book', title: '美丽新世界', author: '阿道斯·赫胥黎', status: 'want', review: '与1984并列的反乌托邦经典，用娱乐控制人类', external_link: 'https://book.douban.com/subject/1085221/' },
  { type: 'book', title: '麦田里的守望者', author: '塞林格', status: 'done', rating: 8.8, review: '霍尔顿的叛逆青春，最真实的青少年内心独白', external_link: 'https://book.douban.com/subject/1068197/' },
];

export async function POST(req: NextRequest) {
  const session = await requireAdminSession(req);
  if (!session) return NextResponse.json({ error: '未授权' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('media_items')
    .insert(BOOKS)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: `成功写入 ${data.length} 条书单数据` });
}

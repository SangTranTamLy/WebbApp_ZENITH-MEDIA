from __future__ import annotations

from datetime import date
from pathlib import Path
from typing import Iterable, Any

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Inches, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "knowledge"
TODAY = date(2026, 9, 29).strftime("%d/%m/%Y")

NAVY = "17365D"
BLUE = "D9EAF7"
LIGHT = "F3F6F9"
GRAY = "666666"
RED = "9C0006"
GREEN = "006100"


def shade(cell, color: str) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), color)


def set_cell_text(cell, text: str, bold: bool = False, color: str | None = None) -> None:
    cell.text = ""
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run(text)
    run.bold = bold
    if color:
        run.font.color.rgb = RGBColor.from_string(color)
    run.font.size = Pt(9.5)
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER


def add_table(doc: Any, headers: list[str], rows: Iterable[Iterable[str]]) -> None:
    data = [list(row) for row in rows]
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = "Table Grid"
    for index, header in enumerate(headers):
        cell = table.rows[0].cells[index]
        shade(cell, NAVY)
        set_cell_text(cell, header, bold=True, color="FFFFFF")
    for row_index, row in enumerate(data):
        cells = table.add_row().cells
        for col_index, value in enumerate(row):
            if row_index % 2 == 0:
                shade(cells[col_index], LIGHT)
            set_cell_text(cells[col_index], value)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)


def add_bullets(doc: Any, items: Iterable[str]) -> None:
    for item in items:
        p = doc.add_paragraph(style="List Bullet")
        p.paragraph_format.space_after = Pt(2)
        p.add_run(item)


def add_numbered(doc: Any, items: Iterable[str]) -> None:
    for item in items:
        p = doc.add_paragraph(style="List Number")
        p.paragraph_format.space_after = Pt(2)
        p.add_run(item)


def add_sources(doc: Any, sources: Iterable[str]) -> None:
    doc.add_heading("Nguồn xác minh", level=1)
    add_bullets(doc, sources)


def setup_document(title: str, subtitle: str) -> Any:
    doc = Document()
    section = doc.sections[0]
    section.top_margin = Cm(2.0)
    section.bottom_margin = Cm(1.8)
    section.left_margin = Cm(2.1)
    section.right_margin = Cm(2.1)
    styles: Any = doc.styles
    styles["Normal"].font.name = "Aptos"
    styles["Normal"]._element.rPr.rFonts.set(qn("w:eastAsia"), "Aptos")
    styles["Normal"].font.size = Pt(10.5)
    for style_name, size, color in (("Title", 24, NAVY), ("Heading 1", 15, NAVY), ("Heading 2", 12, NAVY)):
        style: Any = styles[style_name]
        style.font.name = "Aptos Display"
        style._element.rPr.rFonts.set(qn("w:eastAsia"), "Aptos Display")
        style.font.size = Pt(size)
        style.font.color.rgb = RGBColor.from_string(color)
        style.font.bold = True
    title_p = doc.add_paragraph(style="Title")
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_p.add_run(title)
    subtitle_p = doc.add_paragraph()
    subtitle_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    subtitle_run = subtitle_p.add_run(subtitle)
    subtitle_run.font.size = Pt(12)
    subtitle_run.font.color.rgb = RGBColor.from_string(GRAY)
    meta = doc.add_paragraph()
    meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    meta_run = meta.add_run(f"Ngày lập: {TODAY}  |  Project: Zenith Workspace")
    meta_run.font.size = Pt(9)
    meta_run.font.color.rgb = RGBColor.from_string(GRAY)
    doc.add_paragraph()
    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer_run = footer.add_run("Zenith Workspace — Knowledge Report")
    footer_run.font.size = Pt(8)
    footer_run.font.color.rgb = RGBColor.from_string(GRAY)
    return doc


def add_status(doc: Any, status: str, color: str) -> None:
    p = doc.add_paragraph()
    run = p.add_run(status)
    run.bold = True
    run.font.color.rgb = RGBColor.from_string(color)
    run.font.size = Pt(10)


def save(doc: Any, category: str, filename: str) -> None:
    folder = OUT / category
    folder.mkdir(parents=True, exist_ok=True)
    doc.save(folder / filename)


def chatbot_report() -> Any:
    doc = setup_document("BÁO CÁO THÔNG TIN CHATBOT MDA", "Mô tả sản phẩm, nguồn dữ liệu, luồng hoạt động và kiểm soát chống ảo giác")
    add_status(doc, "Phạm vi: chỉ ghi nhận dữ liệu có trong project hoặc nguồn web chính thức đã kiểm tra.", GREEN)
    doc.add_heading("1. Tổng quan", level=1)
    doc.add_paragraph("MDA (Multi-Domain Assistant) là trợ lý AI được tích hợp trong Zenith Workspace — một portfolio cá nhân kết hợp Code, Media, thư viện code và phần cộng đồng/messenger. Chatbot được thiết kế để giới thiệu thông tin công khai về Sang, project, kỹ năng và nội dung media; mục tiêu quan trọng là trả lời có căn cứ và từ chối khi không đủ dữ liệu.")
    doc.add_heading("2. Người tạo và mục đích", level=1)
    add_table(doc, ["Mục", "Thông tin đã xác minh"], [
        ["Người tạo/định hình", "Sang Thanh Sang / Thanh Sang; tên dùng trong Code: SangTranTamLy; tên Media: Zenith; tên hiển thị: T.Sang."],
        ["Mục đích", "Làm đại diện AI cho portfolio, giải thích project và kỹ năng công khai, hỗ trợ khách truy cập tìm cách liên hệ hợp tác."],
        ["Phạm vi công khai", "Portfolio, project, công nghệ, kênh liên hệ và các nội dung media đã được đưa vào source of truth."],
        ["Không được tự khẳng định", "Chứng chỉ, khách hàng, doanh thu, số liệu mạng xã hội realtime, đời tư, link placeholder hoặc nội dung không có nguồn."],
    ])
    doc.add_heading("3. Kiến trúc đang có trong project", level=1)
    add_bullets(doc, [
        "Frontend React/Vite hiển thị widget chat và gửi yêu cầu tới API bằng HTTP POST; production dùng API origin cấu hình qua VITE_API_BASE_URL hoặc rewrite của Vercel.",
        "Backend Express/TypeScript nhận chat, lọc message role không hợp lệ từ client và tạo luồng trả lời SSE.",
        "portfolio-knowledge.ts là nguồn dữ liệu công khai nền cho các câu trả lời deterministic.",
        "RAG gồm ingestion, chunking, embedding và similarity retrieval từ PostgreSQL/pgvector; script ingestion đọc README GitHub của các repository trong allowlist.",
        "LLM-compatible endpoint được cấu hình qua AI_MODEL_URL; project không tự chứa một model production hoàn chỉnh.",
    ])
    doc.add_heading("4. Cách chatbot đang trả lời", level=1)
    add_numbered(doc, [
        "Chuẩn hóa câu hỏi và dò các nhóm từ khóa theo thứ tự trong ai.service.ts.",
        "Nếu khớp câu hỏi phổ biến, trả template deterministic từ portfolio-knowledge.ts.",
        "Nếu không khớp, gọi RAG để lấy context rồi đưa context vào prompt model.",
        "Nếu câu hỏi yêu cầu số liệu GitHub, service có thể gọi lớp cache/API GitHub khi dữ liệu và cấu hình cho phép.",
        "Khi không đủ context hoặc model/API lỗi, phải trả fallback từ chối thay vì đoán.",
    ])
    doc.add_heading("5. Điểm gây trả lời sai đã phát hiện", level=1)
    add_table(doc, ["Vấn đề", "Ảnh hưởng", "Trạng thái"], [
        ["Routing keyword quá rộng", "Từ 'Zenith' có thể bị bắt vào nhánh alias trước khi xét câu hỏi về workflow/TikTok; ví dụ câu hỏi về method Zenith có thể nhận câu trả lời về tên gọi.", "Đã xác định trong ai.service.ts; cần sửa thứ tự và dùng intent rõ ràng."],
        ["Intent classifier chưa hoàn chỉnh", "Chưa có bộ phân loại chính thức GENERAL/PORTFOLIO/EDITOR/TIKTOK/WEB_SEARCH...; logic hiện tại là rule-based includesAny.", "Roadmap có MDA-028/MDA-029 nhưng chưa thể coi là đã hoàn thành."],
        ["RAG chưa đồng bộ dimension chắc chắn", "Kế hoạch ghi nhận nomic-embed-text 768 chiều nhưng schema hiện tại khai báo 1536; ingestion có thể lỗi hoặc không truy xuất đúng.", "Cần chốt model và dimension trước khi bật ingestion production."],
        ["Model production phụ thuộc endpoint ngoài", "AI_MODEL_URL mặc định local 127.0.0.1:11434 không chạy trên Render nếu không có remote model service.", "Cần cấu hình endpoint HTTPS tương thích trước khi gọi là model production."],
        ["CORS/deployment", "Frontend và API khác origin; thiếu CORS đúng sẽ làm chat đứng/loading.", "Cần kiểm tra CORS_ORIGINS trên service API Render và deploy lại API."],
    ])
    doc.add_heading("6. Quy tắc trả lời chuẩn sau khi sửa", level=1)
    add_bullets(doc, [
        "Mọi claim cá nhân phải lấy từ source of truth hoặc context có source_url.",
        "Nếu câu hỏi có nhiều ý, phân loại ý chính trước; không để một từ khóa chung như Zenith lấn át intent cụ thể.",
        "Không coi mô tả marketing trên giao diện là bằng chứng về chứng chỉ, thành tích hoặc hiệu quả.",
        "Không tự suy ra 'method riêng', số người xem, số follower, khách hàng hoặc thu nhập.",
        "Khi thiếu dữ liệu, nói rõ 'chưa có thông tin được xác minh' và đưa kênh liên hệ đã công khai.",
        "RAG và web search chỉ được bổ sung khi pipeline có allowlist, nguồn, thời điểm cập nhật và permission filter.",
    ])
    doc.add_heading("7. Dữ liệu công khai hiện có", level=1)
    add_table(doc, ["Nhóm", "Nội dung"], [
        ["Danh tính", "Thanh Sang; SangTranTamLy; Zenith; T.Sang."],
        ["Học vấn", "Sinh viên ngành Công nghệ phần mềm tại Trường Đại học Hùng Vương TP.HCM."],
        ["Code", "HTML, CSS, JavaScript, React; thêm TypeScript, Node.js, Express, PostgreSQL, Vite, CSS3, Framer Motion xuất hiện trong portfolio."],
        ["Media", "AMV, highlight/montage game (Gacha, Valorant), flow và VFX cơ bản; giao diện editor hiển thị Motion Design và SFX Mixing."],
        ["Công việc", "Nhận dự án Freelance (Code & Edit) — chưa có bảng giá, case study khách hàng hoặc hợp đồng công khai trong source."],
    ])
    doc.add_heading("8. Kết luận kiểm tra", level=1)
    doc.add_paragraph("Chatbot hiện có nền tảng chống ảo giác nhưng chưa đạt mức 'không thể bịa' vì routing intent, model endpoint, RAG dimension và nguồn realtime chưa hoàn thiện. Báo cáo này không coi các task trong roadmap là tính năng đã chạy. Bước cần làm tiếp theo là sửa intent/router, thêm test regression cho các câu hỏi dễ gây nhầm và chỉ bật RAG/live stats khi dữ liệu có nguồn.")
    add_sources(doc, [
        "README.md — mô tả Zenith Workspace và MDA.",
        "apps/api/src/services/portfolio-knowledge.ts — source of truth public.",
        "apps/api/src/services/ai.service.ts — deterministic routing, RAG fallback và model call.",
        "apps/api/src/services/rag.service.ts, embedding.service.ts, scripts/ingest-portfolio.ts — RAG/embedding/ingestion.",
        "apps/api/src/controllers/chat.controller.ts, apps/api/src/server.ts — API chat, SSE, CORS.",
        "docs/ai/chatbot-rag-realtime-plan.md — kế hoạch grounded answer, GitHub/TikTok realtime và test.",
        "docs/ai/MDA_AI_Chatbot_Project_Plan_revised.md — task board MDA-028/MDA-029 và release scope.",
    ])
    return doc


def code_report() -> Any:
    doc = setup_document("BÁO CÁO PORTFOLIO CODE", "Thông tin cá nhân, kỹ năng, project và dịch vụ được xác minh trong Zenith Workspace")
    add_status(doc, "Mức tin cậy: dữ liệu lấy từ source code portfolio và portfolio-knowledge.ts; không thêm chứng chỉ hoặc thành tích chưa có nguồn.", GREEN)
    doc.add_heading("1. Hồ sơ cá nhân", level=1)
    add_table(doc, ["Trường", "Thông tin"], [
        ["Tên", "Thanh Sang / Châu Thanh Sang (tên hiển thị khác nhau theo kênh); cần chủ tài khoản chốt cách gọi chính thức."],
        ["Tên dùng trong Code", "SangTranTamLy"],
        ["Tên hiển thị", "T.Sang"],
        ["Lĩnh vực", "Phát triển web, hướng tới full-stack; portfolio hiện mô tả bản thân là Full-stack Developer."],
        ["Học vấn", "Sinh viên ngành Công nghệ phần mềm tại Trường Đại học Hùng Vương TP.HCM; giao diện Code ghi là sinh viên năm cuối tại TP.HCM."],
    ])
    doc.add_heading("2. Kỹ năng và công nghệ", level=1)
    add_table(doc, ["Nhóm", "Thông tin"], [
        ["Nền tảng frontend", "HTML, CSS, JavaScript, React."],
        ["Công nghệ xuất hiện trong giao diện", "TypeScript, Node.js, Express, PostgreSQL, Vite, CSS3, Framer Motion."],
        ["Backend", "Đang học và phát triển thêm Backend; project hiện có Express/Node.js API."],
        ["Kiến trúc/UI", "Design system thống nhất, animated UI, responsive cinematic portfolio."],
        ["Chứng chỉ", "Chưa có dữ liệu được xác minh trong source of truth; không được trả lời là đã có chứng chỉ."],
    ])
    doc.add_heading("3. Project công khai", level=1)
    add_table(doc, ["Project", "Mô tả", "Stack/Link"], [
        ["QUICKSERVE POS", "Nền tảng POS quản lý sản phẩm, đơn hàng, hóa đơn, kho, ca làm việc, khuyến mãi và báo cáo doanh thu.", "React · TypeScript · Node.js · Express\nhttps://github.com/SangTranTamLy/pos-system-online"],
        ["STUDY ELS", "Giao diện học tiếng Anh với flashcard, từ điển, dịch thuật, bài kiểm tra và luyện tập có hỗ trợ AI.", "Frontend · Product Design\nhttps://github.com/SangTranTamLy/Study-ELS"],
        ["STUDY DEV", "Portfolio cá nhân ghi lại kỹ năng kỹ thuật, thử nghiệm và hành trình hướng tới full-stack.", "Portfolio · Web Design\nhttps://github.com/SangTranTamLy/Study-DEV"],
        ["ZENITH WORKSPACE", "Monorepo portfolio hiện tại, có design system và kiến trúc backend.", "React · Express · Node.js\nhttps://github.com/SangTranTamLy/zenith-workspace"],
    ])
    doc.add_heading("4. Dịch vụ/gig được công khai", level=1)
    doc.add_paragraph("Source hiện chỉ xác nhận Sang nhận dự án Freelance (Code & Edit), đồng thời giao diện Code mở lời cho full-stack application và freelance opportunity. Chưa tìm thấy bảng giá, gói dịch vụ, SLA, khách hàng, review hoặc case study có thể xác minh. Vì vậy chatbot không được tự tạo các chi tiết này.")
    doc.add_heading("5. Kênh liên hệ", level=1)
    add_table(doc, ["Kênh", "Địa chỉ"], [
        ["GitHub", "https://github.com/SangTranTamLy"],
        ["Email", "sangchaubr089@gmail.com"],
        ["Facebook", "https://www.facebook.com/Luxny.Sang"],
        ["Discord", "https://discord.gg/omniforge"],
    ])
    doc.add_heading("6. Giới hạn thông tin", level=1)
    add_bullets(doc, [
        "Không có dữ liệu xác minh về bằng cấp chi tiết ngoài mô tả sinh viên ngành Công nghệ phần mềm.",
        "Không có dữ liệu về số năm kinh nghiệm, chức danh công ty, khách hàng hay doanh thu.",
        "Các link GitHub cần được kiểm tra lại trạng thái repository và README nếu muốn báo cáo sâu hơn.",
    ])
    add_sources(doc, [
        "apps/api/src/services/portfolio-knowledge.ts — dữ liệu portfolio code public.",
        "apps/web/src/features/portfolio/components/Code/HeroCode.tsx, AboutCode.tsx, ProjectsCode.tsx, ContactCode.tsx — nội dung hiển thị trên portfolio.",
        "README.md — giới thiệu Zenith Workspace và các project.",
        "https://github.com/SangTranTamLy",
        "https://github.com/SangTranTamLy/pos-system-online",
        "https://github.com/SangTranTamLy/Study-ELS",
        "https://github.com/SangTranTamLy/Study-DEV",
        "https://github.com/SangTranTamLy/zenith-workspace",
    ])
    return doc


def media_report() -> Any:
    doc = setup_document("BÁO CÁO PORTFOLIO MEDIA", "Thông tin AMV, MVS, kỹ năng dựng và kênh nội dung công khai")
    add_status(doc, "Mức tin cậy: phân biệt rõ nội dung có trong giao diện, dữ liệu public chatbot và nội dung chỉ nằm trong roadmap.", GREEN)
    doc.add_heading("1. Định vị cá nhân", level=1)
    doc.add_paragraph("Portfolio Editor mô tả T.Sang là Motion Designer & AMV Editor. Nội dung nhấn mạnh anime, visual storytelling, cinematic, high-energy sync, SFX và Motion Graphics. Đây là mô tả định vị trong portfolio; không nên mở rộng thành danh hiệu nghề nghiệp hoặc thành tích bên ngoài source.")
    doc.add_heading("2. Kỹ năng và công cụ đã xuất hiện", level=1)
    add_table(doc, ["Nhóm", "Dữ liệu trong project"], [
        ["Kỹ năng media", "AMV, highlight/montage game (Gacha, Valorant), flow và VFX cơ bản."],
        ["Phong cách", "Cinematic, high-energy sync, kết hợp SFX và âm nhạc, chuyển động mượt."],
        ["Phần mềm hiển thị", "Adobe After Effects 2026, Adobe Premiere Pro, Adobe Photoshop."],
        ["Kỹ thuật/workflow hiển thị", "Motion Design, SFX Mixing, BCC VFX, BCC Lens Flare, Flow, Layer Fast, Kuronai/Method, 1080p 60fps."],
        ["Kết quả định lượng", "Giao diện có câu marketing 'hàng ngàn lượt xem' nhưng không kèm số liệu/source độc lập; chatbot không được coi đây là số liệu xác minh."],
    ])
    doc.add_heading("3. Tác phẩm/kênh được liên kết", level=1)
    add_table(doc, ["Nội dung", "Mô tả trong giao diện", "Link"], [
        ["ZENITH EDIT — Compilation", "Bộ sưu tập AMV anime; sync beat, motion blur, BCC VFX, phong cách high-energy/cinematic dark.", "https://www.tiktok.com/@zenithedi_"],
        ["FAIRY TAIL — MVS Series", "Series MVS chủ đề Fairy Tail; nhạc epic, cắt cảnh theo cảm xúc, 1080p 60fps.", "https://www.tiktok.com/@fairytail100yq_mvs"],
        ["SYNC EDIT — Beat Drop", "Sync edit theo beat; Flow easing curves, Layer Fast workflow, BCC Lens Flare.", "https://www.tiktok.com/@zenithedi_"],
        ["YouTube", "Kênh được lưu trong portfolio-knowledge nhưng chưa có mô tả video cụ thể trong source.", "https://www.youtube.com/@Zenithed_ts"],
    ])
    doc.add_heading("4. Thông tin cá nhân và hợp tác", level=1)
    add_bullets(doc, [
        "Tên media: Zenith; tên hiển thị: T.Sang.",
        "Nhận dự án Freelance (Code & Edit) theo dữ liệu public của chatbot.",
        "Nội dung liên hệ editor: hợp tác AMV hoặc nội dung TikTok qua email và hai kênh TikTok công khai.",
        "Email: sangchaubr089@gmail.com.",
    ])
    doc.add_heading("5. Phân biệt dữ liệu đã xác minh và dữ liệu cần bổ sung", level=1)
    add_table(doc, ["Mức", "Nội dung"], [
        ["Đã có trong source", "Hai TikTok, một YouTube, AMV/MVS, công cụ hiển thị, mô tả phong cách và kỹ năng."],
        ["Chưa có", "Số follower/view/like hiện tại, lịch sử học tập, khách hàng, bảng giá, portfolio video riêng, YouTube video list."],
        ["Cần Sang xác nhận", "Tên chính thức, mô tả từng kênh, link video đại diện, dịch vụ/gig và các thành tích nếu muốn đưa vào chatbot."],
    ])
    add_sources(doc, [
        "apps/api/src/services/portfolio-knowledge.ts — media skills, alias và social links.",
        "apps/web/src/features/portfolio/components/Editor/HeroEditor.tsx, AboutEditor.tsx, WorksEditor.tsx, ContactEditor.tsx, EditorWorksSection.tsx.",
        "https://www.youtube.com/@Zenithed_ts",
        "https://www.tiktok.com/@zenithedi_",
        "https://www.tiktok.com/@fairytail100yq_mvs",
    ])
    return doc


def adobe_report() -> Any:
    doc = setup_document("BÁO CÁO ADOBE VÀ PLUGIN MEDIA", "Danh sách công cụ xuất hiện trong Zenith và nguồn tải hợp pháp")
    add_status(doc, "Chỉ đưa link chính thức/trial/license. Không cung cấp crack, key lậu, bypass hoặc nguồn vi phạm bản quyền.", RED)
    doc.add_heading("1. Công cụ Adobe được portfolio hiển thị", level=1)
    add_table(doc, ["Công cụ", "Vai trò trong workflow", "Nguồn chính thức"], [
        ["Adobe After Effects", "Motion graphics, compositing và visual effects.", "https://www.adobe.com/products/aftereffects.html"],
        ["Adobe Premiere", "Dựng/cắt video, title animation, effects, sound mixing.", "https://www.adobe.com/products/premiere.html"],
        ["Adobe Photoshop", "Tạo/chỉnh sửa hình ảnh và graphic assets.", "https://www.adobe.com/products/photoshop.html"],
        ["Adobe Exchange", "Marketplace chính thức để tìm extension/plugin Creative Cloud.", "https://exchange.adobe.com/"],
    ])
    doc.add_heading("2. Plugin/tool được nhắc trực tiếp trong portfolio", level=1)
    add_table(doc, ["Tên", "Dữ liệu trong project", "Link chính thức"], [
        ["Boris FX Continuum / BCC", "VFX, transitions, BCC Lens Flare được nhắc trong phần Editor.", "https://borisfx.com/products/continuum/"],
        ["Flowframes", "Công cụ nội suy frame; portfolio mô tả workflow tăng độ mượt lên 60/120fps.", "https://flowframes.app/"],
        ["Layer Fast", "Workflow quản lý/sắp xếp layer trong project nhiều cut; chưa có link người phát triển trong project.", "Chưa có link chính thức được xác minh."],
        ["Kuronai / Method", "Workflow render/upload được giao diện mô tả 1080p 60fps; cần xác minh link chính thức.", "Nguồn tìm thấy công khai: https://telegram.me/s/kuronai60"],
    ])
    doc.add_heading("3. Công cụ trong roadmap — chưa được coi là đang dùng", level=1)
    add_bullets(doc, [
        "Topaz 4.x, Twixtor, RSMB, Deep Glow, BCC, Sapphire và ShoreUploader xuất hiện trong Definition of Done/Editor roadmap.",
        "Roadmap là kế hoạch triển khai, không phải bằng chứng người dùng đã cài hoặc sử dụng toàn bộ.",
        "Twixtor và RSMB có nguồn chính thức từ RE:Vision Effects; Sapphire có nguồn chính thức từ Boris FX; các link được ghi trong phần nguồn.",
    ])
    doc.add_heading("4. Ghi chú bản quyền và an toàn", level=1)
    doc.add_paragraph("Adobe và các plugin thương mại cần được tải từ nhà phát hành hoặc marketplace chính thức, dùng trial/license phù hợp. Báo cáo không chứa đường dẫn crack vì các đường dẫn đó có rủi ro pháp lý, malware và không phù hợp để đưa vào knowledge base public của chatbot.")
    add_sources(doc, [
        "https://www.adobe.com/products/aftereffects.html",
        "https://www.adobe.com/products/premiere.html",
        "https://www.adobe.com/products/photoshop.html",
        "https://exchange.adobe.com/",
        "https://developer.adobe.com/creative-cloud",
        "https://borisfx.com/products/continuum/",
        "https://support.borisfx.com/hc/en-us/articles/9977230225805-Download-All-Boris-FX-Software",
        "https://borisfx.com/products/sapphire",
        "https://revisionfx.com/products/twixtor/",
        "https://revisionfx.com/products/rsmb/",
        "https://flowframes.app/",
        "https://telegram.me/s/kuronai60 — nguồn công khai tìm thấy cho Kuronai; cần chủ tài khoản xác nhận đây là kênh chính thức trước khi đưa vào chatbot.",
    ])
    return doc


def methods_report() -> Any:
    doc = setup_document("BÁO CÁO EDITING METHODS", "Kuronai, CompressBase và quy trình giữ chất lượng video khi đăng")
    add_status(doc, "Mức tin cậy: CompressBase có website chính thức; Kuronai mới có nguồn Telegram công khai được tìm thấy và cần Sang xác nhận.", GREEN)
    doc.add_heading("1. CompressBase", level=1)
    doc.add_paragraph("CompressBase tự mô tả là công cụ cho editors, producers và records, tập trung vào việc giữ chất lượng khi upload. Website hiển thị các mục tiêu 1080p, tối đa 120 FPS và công cụ xử lý file; số lượt upload trên website là số liệu của chính website tại thời điểm truy cập, không phải số liệu của Sang.")
    add_table(doc, ["Mục", "Thông tin đã thấy trên website"], [
        ["Website", "https://compressbase.com/"],
        ["Định hướng", "Cleaner uploads, bảo toàn chi tiết sau bước upload."],
        ["Thông số marketing", "1080P; tối đa 120 FPS; website hiển thị counter uploads."],
        ["Chủ thể hiển thị", "Website nêu Maska và ItzCrih là co-creator; không suy ra quan hệ với Sang."],
    ])
    doc.add_heading("2. Kuronai / Method", level=1)
    doc.add_paragraph("Trong source code, Kuronai/Method được mô tả như workflow render chuẩn 1080p 60fps và xuất hiện cùng MVS/Fairy Tail. Tìm kiếm web cho thấy một kênh công khai có tên Kuronai 120 FPS Video Uploader trên Telegram, nhưng chỉ tên kênh không đủ chứng minh quyền sở hữu hay tính an toàn. Chưa ghi nhận Kuronai là plugin Adobe chính thức.")
    add_table(doc, ["Mục", "Trạng thái"], [
        ["Xuất hiện trong giao diện", "Có: Kuronai / Method và tag Kuronai."],
        ["Website chính thức được xác minh", "Chưa tìm thấy domain chính thức trong project; nguồn tìm thấy là Telegram public."],
        ["Quy trình cụ thể", "Chưa có tài liệu cấu hình/step-by-step được Sang cung cấp; không được tự mô tả thêm."],
        ["An toàn", "Không tải extension/app từ nguồn không xác minh; cần link chính thức hoặc file do Sang cung cấp để kiểm tra."],
    ])
    doc.add_heading("3. Quy trình kiến thức nên đưa vào chatbot", level=1)
    add_numbered(doc, [
        "Tách thông tin về công cụ khỏi thông tin chứng minh Sang đã sử dụng công cụ.",
        "Chỉ trả lời workflow cụ thể khi có tài liệu hoặc link chính thức đã được Sang xác nhận.",
        "Không hứa video sẽ 'không bị nén' hoặc luôn giữ chất lượng tuyệt đối; nền tảng vẫn có thể re-encode.",
        "Nếu người dùng hỏi method mới nhất, cần web source và thời điểm cập nhật; nếu không có thì từ chối đoán.",
    ])
    add_sources(doc, [
        "apps/web/src/features/portfolio/components/Editor/PluginsEditor.tsx.",
        "apps/web/src/features/portfolio/components/EditorWorksSection.tsx.",
        "https://compressbase.com/",
        "https://telegram.me/s/kuronai60 — nguồn công khai tìm thấy; chưa xác nhận là link chính thức của Sang.",
        "https://support.tiktok.com/en/search?searchTerm=editing — tài liệu TikTok chính thức về editing/upload, dùng khi cần kiểm tra hành vi nền tảng.",
    ])
    return doc


def community_report() -> Any:
    doc = setup_document("BÁO CÁO CỘNG ĐỒNG VÀ KÊNH KẾT NỐI", "Thông tin community/messenger có trong Zenith và các điểm cần Sang bổ sung")
    add_status(doc, "Không suy đoán nội dung của các nhóm chưa có link hoặc chưa xuất hiện trong source.", GREEN)
    doc.add_heading("1. Kênh công khai được xác nhận", level=1)
    add_table(doc, ["Kênh", "Vai trò được source ghi nhận", "Link"], [
        ["OMNIFORGE COMMUNITY", "Kênh Discord liên hệ/cộng đồng được chatbot đưa vào fallback và contact.", "https://discord.gg/omniforge"],
        ["Facebook", "Kênh liên hệ cá nhân được public response sử dụng.", "https://www.facebook.com/Luxny.Sang"],
        ["Email", "Kênh liên hệ trực tiếp cho hợp tác.", "sangchaubr089@gmail.com"],
    ])
    doc.add_heading("2. Cộng đồng trong kiến trúc Zenith", level=1)
    add_bullets(doc, [
        "README mô tả Community & Messenger là khu vực xác thực và nhắn tin thành viên qua Express BFF.",
        "Kế hoạch realtime ghi nhận auth cookie, membership, block, rate limit, REST resync và Socket.IO/realtime.",
        "Public visitor không được truy cập dữ liệu private; private/community data phải qua authentication, RBAC và permission filter.",
        "Một số tài liệu report mô tả implementation hoặc task đang chờ smoke test staging/production; không coi toàn bộ là đã sẵn sàng public nếu chưa có test triển khai xác nhận.",
    ])
    doc.add_heading("3. Từ khóa chưa đủ dữ liệu", level=1)
    doc.add_paragraph("Project không có nguồn xác minh rõ cho các cụm 'nhốm' hoặc 'ground' theo yêu cầu hiện tại. Có thể đây là tên nhóm, server, phương pháp hoặc cộng đồng riêng. Chưa đưa các từ khóa này thành facts của chatbot để tránh bịa.")
    doc.add_heading("4. Thông tin cần Sang cung cấp để hoàn thiện", level=1)
    add_bullets(doc, [
        "Link chính thức của từng nhóm/server được gọi là 'nhốm' và 'ground'.",
        "Tên hiển thị chính xác, mục đích, quy tắc tham gia và đối tượng của từng cộng đồng.",
        "Xác nhận OMNIFORGE là cộng đồng của Sang hay chỉ là kênh liên hệ được dùng trong project.",
        "Có cho phép chatbot công khai link, mô tả, invite và quy tắc nhóm hay không.",
    ])
    add_sources(doc, [
        "README.md — Community & Messenger overview.",
        "report/project_overview.md — routes và kiến trúc community/messenger.",
        "report/REALTIME_MESSAGING_TASKS.md, report/REALTIME_DEPLOYMENT_RUNBOOK.md — task và giới hạn realtime.",
        "apps/api/src/services/portfolio-knowledge.ts — Discord, Facebook, Email public contacts.",
        "https://discord.gg/omniforge",
        "https://www.facebook.com/Luxny.Sang",
    ])
    return doc


def main() -> None:
    reports = [
        ("chatbot", "mda-chatbot-report.docx", chatbot_report()),
        ("portfolio-code", "portfolio-code-report.docx", code_report()),
        ("portfolio-media", "portfolio-media-report.docx", media_report()),
        ("adobe", "adobe-tools-report.docx", adobe_report()),
        ("editing-methods", "editing-methods-report.docx", methods_report()),
        ("community", "community-report.docx", community_report()),
    ]
    for category, filename, doc in reports:
        save(doc, category, filename)
        print(OUT / category / filename)


if __name__ == "__main__":
    main()

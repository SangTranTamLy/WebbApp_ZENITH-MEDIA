from __future__ import annotations

from pathlib import Path

from docx import Document
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
KNOWLEDGE = ROOT / "docs" / "knowledge"
NAVY = colors.HexColor("#17365D")
LIGHT = colors.HexColor("#F3F6F9")
GRAY = colors.HexColor("#666666")

pdfmetrics.registerFont(TTFont("Arial", r"C:\Windows\Fonts\arial.ttf"))
pdfmetrics.registerFont(TTFont("Arial-Bold", r"C:\Windows\Fonts\arialbd.ttf"))


def style_sheet():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("ReportTitle", parent=base["Title"], fontName="Arial-Bold", fontSize=21, leading=25, alignment=TA_CENTER, textColor=NAVY, spaceAfter=10),
        "subtitle": ParagraphStyle("ReportSubtitle", parent=base["Normal"], fontName="Arial", fontSize=11, leading=15, alignment=TA_CENTER, textColor=GRAY, spaceAfter=4),
        "h1": ParagraphStyle("ReportH1", parent=base["Heading1"], fontName="Arial-Bold", fontSize=14, leading=18, textColor=NAVY, spaceBefore=12, spaceAfter=6),
        "h2": ParagraphStyle("ReportH2", parent=base["Heading2"], fontName="Arial-Bold", fontSize=11, leading=14, textColor=NAVY, spaceBefore=8, spaceAfter=4),
        "body": ParagraphStyle("ReportBody", parent=base["BodyText"], fontName="Arial", fontSize=9.5, leading=14, spaceAfter=5),
        "bullet": ParagraphStyle("ReportBullet", parent=base["BodyText"], fontName="Arial", fontSize=9.5, leading=13, leftIndent=12, firstLineIndent=-8, spaceAfter=2),
        "meta": ParagraphStyle("ReportMeta", parent=base["Normal"], fontName="Arial", fontSize=8, leading=10, alignment=TA_CENTER, textColor=GRAY, spaceAfter=8),
        "table": ParagraphStyle("ReportTable", parent=base["BodyText"], fontName="Arial", fontSize=8.2, leading=10.5, spaceAfter=0),
        "table_header": ParagraphStyle("ReportTableHeader", parent=base["BodyText"], fontName="Arial-Bold", fontSize=8.2, leading=10.5, textColor=colors.white, spaceAfter=0),
    }


def safe(text: str) -> str:
    return (text or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br/>")


def convert(docx_path: Path, pdf_path: Path) -> None:
    docx = Document(str(docx_path))
    styles = style_sheet()
    story = []
    for paragraph in docx.paragraphs:
        text = paragraph.text.strip()
        if not text:
            story.append(Spacer(1, 4))
            continue
        style_name = paragraph.style.name if (paragraph.style and paragraph.style.name) else "Normal"
        if style_name == "Title":
            story.append(Paragraph(safe(text), styles["title"]))
        elif style_name == "Heading 1":
            story.append(Paragraph(safe(text), styles["h1"]))
        elif style_name == "Heading 2":
            story.append(Paragraph(safe(text), styles["h2"]))
        elif style_name.startswith("List Bullet"):
            story.append(Paragraph("• " + safe(text), styles["bullet"]))
        elif style_name.startswith("List Number"):
            story.append(Paragraph("• " + safe(text), styles["bullet"]))
        else:
            story.append(Paragraph(safe(text), styles["body"]))
    # Tables occur in document order after paragraphs in the DOCX XML. Rebuild them
    # from the document body so the PDF preserves the same sequence.
    story = []
    body = docx.element.body
    for child in body.iterchildren():
        if child.tag.endswith("}p"):
            for paragraph in docx.paragraphs:
                if paragraph._p is child:
                    text = paragraph.text.strip()
                    if not text:
                        story.append(Spacer(1, 4))
                    else:
                        style_name = paragraph.style.name if (paragraph.style and paragraph.style.name) else "Normal"
                        if style_name == "Title":
                            story.append(Paragraph(safe(text), styles["title"]))
                        elif style_name == "Heading 1":
                            story.append(Paragraph(safe(text), styles["h1"]))
                        elif style_name == "Heading 2":
                            story.append(Paragraph(safe(text), styles["h2"]))
                        elif style_name.startswith("List Bullet") or style_name.startswith("List Number"):
                            story.append(Paragraph("• " + safe(text), styles["bullet"]))
                        else:
                            story.append(Paragraph(safe(text), styles["body"]))
                    break
        elif child.tag.endswith("}tbl"):
            for table in docx.tables:
                if table._tbl is child:
                    rows = []
                    for row_index, row in enumerate(table.rows):
                        row_values = [Paragraph(safe(cell.text), styles["table_header" if row_index == 0 else "table"]) for cell in row.cells]
                        rows.append(row_values)
                    widths = [16.8 * cm / max(1, len(rows[0]))] * len(rows[0])
                    table_flow = Table(rows, colWidths=widths, repeatRows=1, hAlign="LEFT")
                    table_flow.setStyle(TableStyle([
                        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                        ("BACKGROUND", (0, 1), (-1, -1), LIGHT),
                        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT, colors.white]),
                        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#B9C5D0")),
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 5),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                        ("TOPPADDING", (0, 0), (-1, -1), 5),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ]))
                    story.append(table_flow)
                    story.append(Spacer(1, 5))
                    break
    pdf_path.parent.mkdir(parents=True, exist_ok=True)

    def footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Arial", 8)
        canvas.setFillColor(GRAY)
        canvas.drawCentredString(A4[0] / 2, 1.0 * cm, f"Zenith Workspace — Knowledge Report  |  Trang {doc.page}")
        canvas.restoreState()

    pdf = SimpleDocTemplate(str(pdf_path), pagesize=A4, rightMargin=2.1 * cm, leftMargin=2.1 * cm, topMargin=2.0 * cm, bottomMargin=1.8 * cm)
    pdf.build(story, onFirstPage=footer, onLaterPages=footer)


def main() -> None:
    for docx_path in KNOWLEDGE.glob("*/report.docx"):
        convert(docx_path, docx_path.with_suffix(".pdf"))
    for docx_path in KNOWLEDGE.glob("*/mda-chatbot-report.docx"):
        convert(docx_path, docx_path.with_suffix(".pdf"))
    for docx_path in KNOWLEDGE.glob("*/portfolio-code-report.docx"):
        convert(docx_path, docx_path.with_suffix(".pdf"))
    for docx_path in KNOWLEDGE.glob("*/portfolio-media-report.docx"):
        convert(docx_path, docx_path.with_suffix(".pdf"))
    for docx_path in KNOWLEDGE.glob("*/adobe-tools-report.docx"):
        convert(docx_path, docx_path.with_suffix(".pdf"))
    for docx_path in KNOWLEDGE.glob("*/editing-methods-report.docx"):
        convert(docx_path, docx_path.with_suffix(".pdf"))
    for docx_path in KNOWLEDGE.glob("*/community-report.docx"):
        convert(docx_path, docx_path.with_suffix(".pdf"))


if __name__ == "__main__":
    main()

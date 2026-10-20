"""Paint quantities & cost calculator (sealer to finish) in the Gindi Innovations house style (copied from the Brick calculator)."""
import sys
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side, Protection
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.drawing.image import Image
from openpyxl.utils import get_column_letter
from openpyxl.workbook.defined_name import DefinedName
from openpyxl.formatting.rule import FormulaRule

out, wm1, wm2 = sys.argv[1], sys.argv[2], sys.argv[3]

NAVY, ORANGE, CREAM = "0B1F3A", "F5A623", "F3D9A4"
LABEL, ZEBRA, WHITE = "F3F5F9", "F9FAFC", "FFFFFF"
INPUT, INPUT_B, LINE = "FFF8E1", "E8CF85", "DDE2EA"
GREEN, GREEN_TXT = "E2F0D9", "1E5631"
GRAYTXT, DARK, RED = "7F7F7F", "1A1A1A", "C00000"
NUM = "#,##0.00"

fill = lambda c: PatternFill("solid", fgColor=c)
side = lambda st, c: Side(style=st, color=c)
B_IN = Border(*(side("thin", INPUT_B),) * 4)
B_ROW = Border(bottom=side("thin", LINE))


def font(sz=11, b=False, c=NAVY, i=False):
    return Font(name="Arial", size=sz, bold=b, color=c, italic=i)


def al(h="center", indent=0, wrap=True):
    return Alignment(horizontal=h, vertical="center", wrap_text=wrap, indent=indent, readingOrder=2)


def put(ws, ref, v=None, *, f=None, fn=None, a=None, fmt=None, bd=None, unlock=False):
    c = ws[ref]
    if v is not None:
        c.value = v
    if f:
        c.fill = fill(f)
    if fn:
        c.font = fn
    c.alignment = a or al()
    if fmt:
        c.number_format = fmt
    if bd:
        c.border = bd
    if unlock:
        c.protection = Protection(locked=False)
    return c


def merge(ws, rng, v=None, **kw):
    first = rng.split(":")[0]
    ws.merge_cells(rng)
    # style every cell in the range so fills/borders render across the merge
    from openpyxl.utils.cell import range_boundaries
    c1, r1, c2, r2 = range_boundaries(rng)
    for r in range(r1, r2 + 1):
        for c in range(c1, c2 + 1):
            ref = f"{get_column_letter(c)}{r}"
            put(ws, ref, v if ref == first else None, **kw)


def banner(ws, last_col, title, subtitle, brand_size=14):
    for r in (1, 2, 3):
        for c in range(1, last_col + 1):
            ws.cell(r, c).fill = fill(NAVY)
    for c in range(1, last_col + 1):
        ws.cell(4, c).fill = fill(ORANGE)
    lc = get_column_letter(last_col - 1)
    merge(ws, "B2:B3", "Eng/ Mostafa Elgindi\nGindi Innovations", f=ORANGE, fn=font(brand_size, True))
    merge(ws, f"C2:{lc}2", title, f=NAVY, fn=font(24, True, WHITE))
    merge(ws, f"C3:{lc}3", subtitle, f=NAVY, fn=font(12, False, CREAM))
    for r, h in {1: 9.75, 2: 39.75, 3: 27.75, 4: 4.5, 5: 12}.items():
        ws.row_dimensions[r].height = h


def section(ws, row, text, last="I"):
    put(ws, f"B{row}", text, fn=font(13, True), a=al("right", 1, False))
    for col in "BCDEFGHI"[: "BCDEFGHI".index(last) + 1]:
        ws[f"{col}{row}"].border = Border(bottom=side("medium", NAVY))
    ws.row_dimensions[row].height = 27.75


def note(ws, row, text, color=GRAYTXT, last="I"):
    merge(ws, f"B{row}:{last}{row}", text, fn=font(9, False, color), a=al("right", 1))
    ws.row_dimensions[row].height = 15


def header(ws, row, cells):
    for ref, text in cells:
        if ":" in ref:
            merge(ws, ref, text, f=NAVY, fn=font(11, True, WHITE))
        else:
            put(ws, ref, text, f=NAVY, fn=font(11, True, WHITE))
    ws.row_dimensions[row].height = 33.75



CAT = "الخامات"
CATQ = f"'{CAT}'"
# GLC official catalog (b.glcpaints.com/api/products/flat, 2026-10-15): one row per pack size whose unit matches the
# spreading-rate unit; rate = average of GLC's min–max per coat. Rows: (name, unit, rate, pack, GLC range, GLC coats)
GLC_PRODUCTS = [
    ('GLC كوش برايمر 150 — اكتب حجم العبوة', 'لتر', 15.0, None, '14–16', '1-2'),
    ('GLC سوبر داي-تون 3030 — 3.8 لتر', 'لتر', 10.0, 3.8, '9–11', '2'),
    ('GLC سوبر داي-تون 3030 — 14 لتر', 'لتر', 10.0, 14.0, '9–11', '2'),
    ('GLC المقاوم 0017 — 0.65 لتر', 'لتر', 11.5, 0.65, '10–13', '1'),
    ('GLC المقاوم 0017 — 2.4 لتر', 'لتر', 11.5, 2.4, '10–13', '1'),
    ('GLC المقاوم 0017 — 9 لتر', 'لتر', 11.5, 9.0, '10–13', '1'),
    ('GLC المقاوم 0017 — 14 لتر', 'لتر', 11.5, 14.0, '10–13', '1'),
    ('GLC معجون داي-تون 100 — 1 كجم', 'كجم', 2.5, 1.0, '2–3', '2'),
    ('GLC معجون داي-تون 100 — 4 كجم', 'كجم', 2.5, 4.0, '2–3', '2'),
    ('GLC معجون داي-تون 100 — 15 كجم', 'كجم', 2.5, 15.0, '2–3', '2'),
    ('GLC معجون داي-تون 100 — 18 كجم', 'كجم', 2.5, 18.0, '2–3', '2'),
    ('GLC معجون داي-تون 100 — 20 كجم', 'كجم', 2.5, 20.0, '2–3', '2'),
    ('GLC داي-تون 200 — 3.5 لتر', 'لتر', 9.0, 3.5, '8–10', '2'),
    ('GLC داي-تون 200 — 8 لتر', 'لتر', 9.0, 8.0, '8–10', '2'),
    ('GLC فيرست كوت أبيض 505 — 2.1 لتر', 'لتر', 10.0, 2.1, '9–11', '2'),
    ('GLC فيرست كوت أبيض 505 — 3.75 لتر', 'لتر', 10.0, 3.75, '9–11', '2'),
    ('GLC جلتكس 20000 — 0.65 لتر', 'لتر', 12.5, 0.65, '11–14', '2'),
    ('GLC جلتكس 20000 — 2.5 لتر', 'لتر', 12.5, 2.5, '11–14', '2'),
    ('GLC جلتكس 20000 — 9 لتر', 'لتر', 12.5, 9.0, '11–14', '2'),
    ('GLC جلتكس 20000 — 18 لتر', 'لتر', 12.5, 18.0, '11–14', '2'),
    ('GLC جلتكس 25000 — 0.65 لتر', 'لتر', 13.5, 0.65, '12–15', '2'),
    ('GLC جلتكس 25000 — 2.5 لتر', 'لتر', 13.5, 2.5, '12–15', '2'),
    ('GLC جلتكس 15000 — 2.5 لتر', 'لتر', 11.0, 2.5, '10–12', '2'),
    ('GLC جلتكس 15000 — 9 لتر', 'لتر', 11.0, 9.0, '10–12', '2'),
    ('GLC برما ستار 1010 — اكتب حجم العبوة', 'لتر', 7.5, None, '7–8', '2'),
    ('GLC ورنيش بيور 1901 — 0.9 لتر', 'لتر', 22.5, 0.9, '20–25', '1-2'),
    ('GLC ورنيش بيور 1901 — 2.25 لتر', 'لتر', 22.5, 2.25, '20–25', '1-2'),
    ('GLC ورنيش بيور 1901 — 9 لتر', 'لتر', 22.5, 9.0, '20–25', '1-2'),
    ('GLC سوبر لاك 786 — 0.35 لتر', 'لتر', 14.0, 0.35, '13–15', '2'),
    ('GLC سوبر لاك 786 — 0.7 لتر', 'لتر', 14.0, 0.7, '13–15', '2'),
    ('GLC سوبر لاك 786 — 2 لتر', 'لتر', 14.0, 2.0, '13–15', '2'),
    ('GLC سوبر لاك 786 — 4 لتر', 'لتر', 14.0, 4.0, '13–15', '2'),
    ('GLC سوبر لاك 786 — 9 لتر', 'لتر', 14.0, 9.0, '13–15', '2'),
    ('GLC ورنيش ستاندر 690 — اكتب حجم العبوة', 'لتر', 13.5, None, '13–14', '2'),
    ('GLC معجون أكريليك 900 — 4 كجم', 'كجم', 3.0, 4.0, '2–4', '2'),
    ('GLC معجون أكريليك 900 — 15 كجم', 'كجم', 3.0, 15.0, '2–4', '2'),
    ('GLC داي-ستون 7070 — 0.65 لتر', 'لتر', 10.5, 0.65, '9–12', '2'),
    ('GLC داي-ستون 7070 — 2.5 لتر', 'لتر', 10.5, 2.5, '9–12', '2'),
    ('GLC داي-ستون 7070 — 9 لتر', 'لتر', 10.5, 9.0, '9–12', '2'),
    ('GLC جل نيل 290 — 9 لتر', 'لتر', 17.0, 9.0, '16–18', '1'),
    ('GLC معجون تاكت — 1 كجم', 'كجم', 2.5, 1.0, '2–3', '2'),
    ('GLC معجون تاكت — 5 كجم', 'كجم', 2.5, 5.0, '2–3', '2'),
    ('GLC معجون تاكت — 15 كجم', 'كجم', 2.5, 15.0, '2–3', '2'),
    ('GLC معجون تاكت — 22 كجم', 'كجم', 2.5, 22.0, '2–3', '2'),
    ('GLC ورنيش زجاجي 901 — اكتب حجم العبوة', 'لتر', 14.0, None, '13–15', '2'),
    ('GLC ورنيش زجاجي 1001 — 2.75 لتر', 'لتر', 14.0, 2.75, '13–15', '2'),
    ('GLC زيجزاج جليز 303 — 0.325 لتر', 'لتر', 17.5, 0.325, '15–20', '1'),
    ('GLC زيجزاج جليز 303 — 0.75 لتر', 'لتر', 17.5, 0.75, '15–20', '1'),
    ('GLC سوبر بلاتين جلتكس 15000 — 0.9 لتر', 'لتر', 10.0, 0.9, '9–11', '2'),
    ('GLC سوبر بلاتين جلتكس 15000 — 2.7 لتر', 'لتر', 10.0, 2.7, '9–11', '2'),
    ('GLC سوبر بلاتين جلتكس 15000 — 9 لتر', 'لتر', 10.0, 9.0, '9–11', '2'),
    ('GLC سوبر بلاتين جلتكس 20000 — 0.9 لتر', 'لتر', 11.5, 0.9, '10–13', '2'),
    ('GLC سوبر بلاتين جلتكس 20000 — 2.7 لتر', 'لتر', 11.5, 2.7, '10–13', '2'),
    ('GLC سوبر بلاتين جلتكس 20000 — 9 لتر', 'لتر', 11.5, 9.0, '10–13', '2'),
    ('GLC سوبر بلاتين سوبر لاك لامع — 0.9 لتر', 'لتر', 14.0, 0.9, '13–15', '2'),
    ('GLC سوبر بلاتين سوبر لاك لامع — 2.7 لتر', 'لتر', 14.0, 2.7, '13–15', '2'),
    ('GLC سوبر بلاتين سوبر لاك لامع — 9 لتر', 'لتر', 14.0, 9.0, '13–15', '2'),
    ('GLC أمبيانس ارمادا — 0.9 لتر', 'لتر', 7.0, 0.9, '6–8', '1'),
    ('GLC أمبيانس ارمادا — 2.7 لتر', 'لتر', 7.0, 2.7, '6–8', '1'),
    ('GLC أمبيانس ماربللو ستوكو — 0.9 لتر', 'لتر', 3.5, 0.9, '3–4', '2'),
    ('GLC أمبيانس ماربللو ستوكو — 2.7 لتر', 'لتر', 3.5, 2.7, '3–4', '2'),
    ('GLC أمبيانس ماربللو ستوكو — 9 لتر', 'لتر', 3.5, 9.0, '3–4', '2'),
    ('GLC أمبيانس كراكيل فينيش — 1 لتر', 'لتر', 9.0, 1.0, '8–10', '2'),
    ('GLC أمبيانس دايموند — 0.32 لتر', 'لتر', 9.0, 0.32, '8–10', '1'),
    ('GLC أمبيانس دايموند — 0.9 لتر', 'لتر', 9.0, 0.9, '8–10', '1'),
    ('GLC أمبيانس هاي سينس — 0.4 لتر', 'لتر', 9.0, 0.4, '8–10', '2'),
    ('GLC أمبيانس هاي سينس — 0.75 لتر', 'لتر', 9.0, 0.75, '8–10', '2'),
    ('GLC أمبيانس شيل شاين — 0.32 لتر', 'لتر', 9.0, 0.32, '8–10', '1'),
    ('GLC أمبيانس شيل شاين — 0.9 لتر', 'لتر', 9.0, 0.9, '8–10', '1'),
    ('GLC أمبيانس سيناو — 0.9 لتر', 'لتر', 4.0, 0.9, '3–5', '1'),
    ('GLC أمبيانس سيناو — 2.7 لتر', 'لتر', 4.0, 2.7, '3–5', '1'),
    ('GLC أمبيانس سينفوني — 0.9 لتر', 'لتر', 4.0, 0.9, '3–5', '1'),
    ('GLC أمبيانس سينفوني — 2.7 لتر', 'لتر', 4.0, 2.7, '3–5', '1'),
    ('GLC أمبيانس كاسبو ستار — اكتب حجم العبوة', 'لتر', 3.5, None, '3–4', '1'),
    ('GLC برما ستار 660 — 15 كجم', 'كجم', 2.5, 15.0, '2–3', '2'),
    ('GLC باي-تون — اكتب حجم العبوة', 'لتر', 10.0, None, '9–11', '2'),
    ('GLC داي-تون بلس 2020 — اكتب حجم العبوة', 'لتر', 9.0, None, '8–10', '2'),
    ('GLC لؤلؤ — 0.7 لتر', 'لتر', 15.0, 0.7, '14–16', '2'),
    ('GLC لؤلؤ — 2 لتر', 'لتر', 15.0, 2.0, '14–16', '2'),
    ('GLC لؤلؤ — 3.75 لتر', 'لتر', 15.0, 3.75, '14–16', '2'),
    ('GLC كومبليكو — اكتب حجم العبوة', 'لتر', 1.5, None, '1–2', '1'),
    ('GLC سوبر بلاتين داي-تون 3030 — 2.7 لتر', 'لتر', 9.0, 2.7, '8–10', '1'),
    ('GLC سوبر بلاتين داي-تون 3030 — 9 لتر', 'لتر', 9.0, 9.0, '8–10', '1'),
    ('GLC سوبر بلاتين داي ستون 7070 — 0.9 لتر', 'لتر', 10.5, 0.9, '9–12', '2'),
    ('GLC سوبر بلاتين داي ستون 7070 — 2.7 لتر', 'لتر', 10.5, 2.7, '9–12', '2'),
    ('GLC سوبر بلاتين داي ستون 7070 — 9 لتر', 'لتر', 10.5, 9.0, '9–12', '2'),
    ('GLC سوبر بلاتين برايمر مائي — 3 لتر', 'لتر', 9.0, 3.0, '8–10', '1'),
    ('GLC سوبر بلاتين برايمر مائي — 9 لتر', 'لتر', 9.0, 9.0, '8–10', '1'),
    ('GLC سوبر لاك 500 — 2.15 لتر', 'لتر', 14.0, 2.15, '13–15', '2'),
    ('GLC جل نيل 29 — 2.25 لتر', 'لتر', 12.0, 2.25, '10–14', '1'),
    ('GLC جل نيل 29 — 8.5 لتر', 'لتر', 12.0, 8.5, '10–14', '1'),
    ('GLC برما كول 001 — 2.5 لتر', 'لتر', 10.0, 2.5, '9–11', '2'),
    ('GLC سوبر بلاتين جلتكس 25000 — 0.9 لتر', 'لتر', 13.5, 0.9, '12–15', '2'),
    ('GLC سوبر بلاتين جلتكس 25000 — 2.7 لتر', 'لتر', 13.5, 2.7, '12–15', '2'),
    ('GLC سوبر بلاتين جلتكس 25000 — 9 لتر', 'لتر', 13.5, 9.0, '12–15', '2'),
    ('GLC وودجارد ورنيش نيتروسليلوز مط 1005 — 0.85 كجم', 'كجم', 7.0, 0.85, '6–8', '2'),
    ('GLC وودجارد ورنيش نيتروسليلوز مط 1005 — 3 كجم', 'كجم', 7.0, 3.0, '6–8', '2'),
    ('GLC وودجارد ورنيش نيتروسليلوز ربع لامع 1030 — 0.85 كجم', 'كجم', 7.0, 0.85, '6–8', '2'),
    ('GLC وودجارد ورنيش نيتروسليلوز ربع لامع 1030 — 3 كجم', 'كجم', 7.0, 3.0, '6–8', '2'),
    ('GLC ورنيش نيتروسليلوز لامع غامق 1002 — 0.95 كجم', 'كجم', 7.0, 0.95, '6–8', '2'),
    ('GLC ورنيش نيتروسليلوز لامع غامق 1002 — 3 كجم', 'كجم', 7.0, 3.0, '6–8', '2'),
    ('GLC ورنيش نيتروسليلوز لامع فاتح 1100 — 0.85 كجم', 'كجم', 7.0, 0.85, '6–8', '2'),
    ('GLC ورنيش نيتروسليلوز لامع فاتح 1100 — 3 كجم', 'كجم', 7.0, 3.0, '6–8', '2'),
    ('GLC جى.بى.دبليو صبغة أخشاب — اكتب حجم العبوة', 'كجم', 9.0, None, '8–10', None),
    ('GLC وودجارد ورنيش بولي يوريثان (1:1) 3500 — اكتب حجم العبوة', 'لتر', 10.0, None, '9–11', '1'),
    ('GLC وودجارد ورنيش بولي يوريثان (2:1) 3600 — اكتب حجم العبوة', 'لتر', 10.0, None, '9–11', '1'),
    ('GLC وودجارد ورنيش بولي يوريثان (2:1) 3005 — اكتب حجم العبوة', 'لتر', 10.0, None, '9–11', '1'),
    ('GLC وودجارد ورنيش بولي يوريثان (2:1) 3020 — اكتب حجم العبوة', 'لتر', 10.0, None, '9–11', '1'),
    ('GLC وودجارد ورنيش بولي يوريثان (2:1) 3035 — اكتب حجم العبوة', 'لتر', 10.0, None, '9–11', '1'),
    ('GLC وودجارد سيلر بولي يوريثان (2:1) 3200 — اكتب حجم العبوة', 'لتر', 9.5, None, '9–10', '2'),
    ('GLC وودجارد دهان نيتروسليلوز 2000 — 0.9 كجم', 'كجم', 10.5, 0.9, '9–12', '2'),
    ('GLC وودجارد دهان نيتروسليلوز 2000 — 1 كجم', 'كجم', 10.5, 1.0, '9–12', '2'),
    ('GLC وودجارد دهان نيتروسليلوز 2000 — 3.25 كجم', 'كجم', 10.5, 3.25, '9–12', '2'),
    ('GLC سوبر بلاتين سوبر لاك نصف لامع — 0.9 لتر', 'لتر', 14.0, 0.9, '13–15', '2'),
    ('GLC سوبر بلاتين سوبر لاك نصف لامع — 2.7 لتر', 'لتر', 14.0, 2.7, '13–15', '2'),
    ('GLC سوبر بلاتين سوبر لاك نصف لامع — 9 لتر', 'لتر', 14.0, 9.0, '13–15', '2'),
    ('GLC سوبر بلاتين سوبر لاك مط — 0.9 لتر', 'لتر', 14.0, 0.9, '13–15', '2'),
    ('GLC سوبر بلاتين سوبر لاك مط — 2.7 لتر', 'لتر', 14.0, 2.7, '13–15', '2'),
    ('GLC سوبر بلاتين سوبر لاك مط — 9 لتر', 'لتر', 14.0, 9.0, '13–15', '2'),
    ('GLC ايكون فيلر سريع 1K — 3.8 كجم', 'كجم', 7.0, 3.8, '6–8', '2'),
    ('GLC داي-ستون 7070 ألوان جاهزه — 0.65 لتر', 'لتر', 10.5, 0.65, '9–12', '2'),
    ('GLC داي-ستون 7070 ألوان جاهزه — 2.5 لتر', 'لتر', 10.5, 2.5, '9–12', '2'),
    ('GLC داي-ستون 7070 ألوان جاهزه — 9 لتر', 'لتر', 10.5, 9.0, '9–12', '2'),
    ('GLC سوبر بلاتين لاكشري مط 7000 — 0.9 لتر', 'لتر', 10.0, 0.9, '9–11', '2'),
    ('GLC سوبر بلاتين لاكشري مط 7000 — 2.7 لتر', 'لتر', 10.0, 2.7, '9–11', '2'),
    ('GLC سوبر بلاتين لاكشري مط 7000 — 9 لتر', 'لتر', 10.0, 9.0, '9–11', '2'),
    ('GLC سوبر بلاتين هايجين سيلك 8000 — 0.9 لتر', 'لتر', 11.0, 0.9, '10–12', '2'),
    ('GLC سوبر بلاتين هايجين سيلك 8000 — 2.7 لتر', 'لتر', 11.0, 2.7, '10–12', '2'),
    ('GLC سوبر بلاتين هايجين سيلك 8000 — 9 لتر', 'لتر', 11.0, 9.0, '10–12', '2'),
    ('GLC أمبيانس ڤلڤتووا — 0.9 لتر', 'لتر', 7.0, 0.9, '6–8', '1'),
    ('GLC أمبيانس ڤلڤتووا — 2.7 لتر', 'لتر', 7.0, 2.7, '6–8', '1'),
    ('GLC ستورم شيلد بنيتريتنج سيلر — 0.75 لتر', 'لتر', 10.0, 0.75, '9–11', '1'),
    ('GLC ستورم شيلد بنيتريتنج سيلر — 3 لتر', 'لتر', 10.0, 3.0, '9–11', '1'),
    ('GLC ستورم شيلد بنيتريتنج سيلر — 20 لتر', 'لتر', 10.0, 20.0, '9–11', '1'),
    ('GLC أمبيانس موزايك نيو — 0.9 لتر', 'لتر', 6.5, 0.9, '5–8', '1'),
    ('GLC أمبيانس موزايك نيو — 2.7 لتر', 'لتر', 6.5, 2.7, '5–8', '1'),
    ('GLC أمبيانس ميكسيكانو نيو — 2.5 لتر', 'لتر', 1.5, 2.5, '1–2', '1'),
    ('GLC أمبيانس ميكسيكانو نيو — 9 لتر', 'لتر', 1.5, 9.0, '1–2', '1'),
    ('GLC أمبيانس كلر ڤاروني — 0.9 لتر', 'لتر', 7.0, 0.9, '6–8', '1'),
    ('GLC أمبيانس كلر ڤاروني — 2.7 لتر', 'لتر', 7.0, 2.7, '6–8', '1'),
    ('GLC ستورم شيلد نانو بنيترايتنج برايمر — 9 لتر', 'لتر', 9.5, 9.0, '8–11', '1'),
    ('GLC ستورم شيلد نانو بنيترايتنج برايمر — 18 لتر', 'لتر', 9.5, 18.0, '8–11', '1'),
    ('GLC ستورم شيلد أندركوت — 9 لتر', 'لتر', 12.0, 9.0, '11–13', '1'),
    ('GLC ستورم شيلد بريميوم فيلر — 10 كجم', 'كجم', 2.5, 10.0, '2–3', None),
    ('GLC ستورم شيلد بريميوم فيلر — 20 كجم', 'كجم', 2.5, 20.0, '2–3', None),
    ('GLC ستورم شيلد بريميوم توب كوت مط — 1 لتر', 'لتر', 10.0, 1.0, '9–11', '2'),
    ('GLC ستورم شيلد بريميوم توب كوت مط — 9 لتر', 'لتر', 10.0, 9.0, '9–11', '2'),
    ('GLC ستورم شيلد بريميوم توب كوت سيلك — 1 لتر', 'لتر', 13.0, 1.0, '12–14', '2'),
    ('GLC ستورم شيلد بريميوم توب كوت سيلك — 9 لتر', 'لتر', 13.0, 9.0, '12–14', '2'),
    ('GLC فليكس أنتي-كاربونيشن — 9 لتر', 'لتر', 10.5, 9.0, '10–11', '2'),
    ('GLC ستورم شيلد بلاتزو هاي تكس — 20 لتر', 'لتر', 1.5, 20.0, '1–2', '2'),
    ('GLC ستورم شيلد بلاتزو هاي تكس لايت — 20 لتر', 'لتر', 1.5, 20.0, '1–2', '2'),
    ('GLC ستورم شيلد بلاتزو هاي تكس رويال — 20 لتر', 'لتر', 1.5, 20.0, '1–2', '2'),
    ('GLC ستورم شيلد بلاتزو ميديوم تكس — 9 لتر', 'لتر', 1.5, 9.0, '1–2', '2'),
    ('GLC ستورم شيلد رووف جارد — 15 كجم', 'كجم', 1.0, 15.0, '1–1', '2'),
]

# كل مرحلة ليها قايمة بأصنافها بس: الكتالوج مترتب بلوكات (سيلر، معجون، بطانة، فينيش، خامات تانية زي الورنيش والخشب)
CATS = [
    ("sealer", ("المقاوم 0017", "برايمر", "بنيتريتنج سيلر")),
    ("putty", ("معجون", "برما ستار 660", "بريميوم فيلر")),
    ("finish", ("سوبر بلاتين جلتكس", "لاكشري", "هايجين")),   # فينيشات (زي فينوماستيك ومذهل) قبل كلمة «جلتكس» في البطانة
    ("base", ("3030", "7070", "داي ستون", "جلتكس", "داي-تون 200", "داي-تون بلس 2020", "باي-تون", "فيرست كوت", "أندركوت")),
    ("other", ("ورنيش", "وودجارد", "صبغة أخشاب", "رووف جارد", "ايكون فيلر", "نيتروسليلوز")),
]
def category(name):
    if name.startswith("Jotun "): return "finish"
    if name == "ورق صنفرة": return "sand"
    return next((c for c, keys in CATS if any(k in name for k in keys)), "finish")
GLC_ORDER = ["sealer", "putty", "base", "finish", "other"]
GLC_PRODUCTS = sorted(GLC_PRODUCTS, key=lambda r: GLC_ORDER.index(category(r[0])))

# Jotun Egypt interior topcoats (jotun.com/eg-ar, 2026-10-15): coverage m²/L per coat from each product page's paint
# calculator («based on 2 coats with a coverage of X m² per liter»). Pack sizes: the ones Jotun lists; Fenomastic uses 0.9/3.6/9/18 L (check with your dealer).
JOTUN_PRODUCTS = [
    ('Jotun فينوماستيك بيتي مطفي غني (My Home Rich Matt) — 0.9 لتر', 'لتر', 10.3, 0.9, '10.3 (Jotun)', '2'),
    ('Jotun فينوماستيك بيتي مطفي غني (My Home Rich Matt) — 3.6 لتر', 'لتر', 10.3, 3.6, '10.3 (Jotun)', '2'),
    ('Jotun فينوماستيك بيتي مطفي غني (My Home Rich Matt) — 9 لتر', 'لتر', 10.3, 9, '10.3 (Jotun)', '2'),
    ('Jotun فينوماستيك بيتي مطفي غني (My Home Rich Matt) — 18 لتر', 'لتر', 10.3, 18, '10.3 (Jotun)', '2'),
    ('Jotun فينوماستيك بيتي ناعم حريري (My Home Smooth Silk) — 0.9 لتر', 'لتر', 9.06, 0.9, '9.06 (Jotun)', '2'),
    ('Jotun فينوماستيك بيتي ناعم حريري (My Home Smooth Silk) — 3.6 لتر', 'لتر', 9.06, 3.6, '9.06 (Jotun)', '2'),
    ('Jotun فينوماستيك بيتي ناعم حريري (My Home Smooth Silk) — 9 لتر', 'لتر', 9.06, 9, '9.06 (Jotun)', '2'),
    ('Jotun فينوماستيك بيتي ناعم حريري (My Home Smooth Silk) — 18 لتر', 'لتر', 9.06, 18, '9.06 (Jotun)', '2'),
    ('Jotun فينوماستيك مذهل راقي (Wonderwall Lux) — 0.9 لتر', 'لتر', 10, 0.9, '10 (Jotun)', '2'),
    ('Jotun فينوماستيك مذهل راقي (Wonderwall Lux) — 3.6 لتر', 'لتر', 10, 3.6, '10 (Jotun)', '2'),
    ('Jotun فينوماستيك مذهل راقي (Wonderwall Lux) — 9 لتر', 'لتر', 10, 9, '10 (Jotun)', '2'),
    ('Jotun فينوماستيك مذهل راقي (Wonderwall Lux) — 18 لتر', 'لتر', 10, 18, '10 (Jotun)', '2'),
    ('Jotun ليدي لمسة شامواه (Touch of Suede) — 0.9 لتر', 'لتر', 11.8, 0.9, '11.8 (Jotun)', '2'),
    ('Jotun ليدي لمسة شامواه (Touch of Suede) — 2.7 لتر', 'لتر', 11.8, 2.7, '11.8 (Jotun)', '2'),
    ('Jotun ليدي بيرل (Pearl) — 0.9 لتر', 'لتر', 9, 0.9, '9 (Jotun)', '2'),
    ('Jotun ليدي بيرل (Pearl) — 3.6 لتر', 'لتر', 9, 3.6, '9 (Jotun)', '2'),
    ('Jotun ليدي رويال فلفيت (Royal Velvet) — 0.9 لتر', 'لتر', 9, 0.9, '9 (Jotun)', '2'),
    ('Jotun ليدي رويال فلفيت (Royal Velvet) — 3.6 لتر', 'لتر', 9, 3.6, '9 (Jotun)', '2'),
    ('Jotun ليدي جليز (Glaze) — 0.45 لتر', 'لتر', 14, 0.45, '14 (Jotun)', '2'),
    ('Jotun ليدي جليز (Glaze) — 0.9 لتر', 'لتر', 14, 0.9, '14 (Jotun)', '2'),
    ('Jotun ليدي ستوكو أنتيكا (Stucco Antica) — 1 لتر', 'لتر', 1.95, 1, '1.95 (Jotun)', '2'),
    ('Jotun ليدي ستوكو أنتيكا (Stucco Antica) — 4 لتر', 'لتر', 1.95, 4, '1.95 (Jotun)', '2'),
    ('Jotun ليدي ستوكو أنتيكا (Stucco Antica) — 10 لتر', 'لتر', 1.95, 10, '1.95 (Jotun)', '2'),
    ('Jotun ليدي ستوكو أنتيكا (Stucco Antica) — 14 لتر', 'لتر', 1.95, 14, '1.95 (Jotun)', '2'),
    ('Jotun ليدي رومانو (Romano) — 1 لتر', 'لتر', 2.1, 1, '2.1 (Jotun)', '2'),
    ('Jotun ليدي رومانو (Romano) — 4 لتر', 'لتر', 2.1, 4, '2.1 (Jotun)', '2'),
]
EXTRA = [("ورق صنفرة", "فرخ", 10, 1, "تقدير", None)]
PRODUCTS = GLC_PRODUCTS + JOTUN_PRODUCTS + EXTRA
FIRST = 8
LAST = FIRST + len(PRODUCTS) + 15 - 1  # catalog data rows (15 blank rows to add your own)
PIDX = {r[0]: i for i, r in enumerate(PRODUCTS)}
COATS = "0,1,2,3,4"
def cat_range(cat):
    rows = [FIRST + i for i, r in enumerate(PRODUCTS) if category(r[0]) == cat]
    assert rows == list(range(rows[0], rows[-1] + 1)), cat   # each stage list is one contiguous block
    return f"{CATQ}!$B${rows[0]}:$B${rows[-1]}"
GLC_FIN = [FIRST + i for i, r in enumerate(GLC_PRODUCTS) if category(r[0]) == "finish"]
GLC_RANGE = f"{CATQ}!$B${GLC_FIN[0]}:$B${GLC_FIN[-1]}"
J1 = FIRST + len(GLC_PRODUCTS)
JOTUN_RANGE = f"{CATQ}!$B${J1}:$B${J1 + len(JOTUN_PRODUCTS) - 1}"
STAGE_LISTS = ["SEALER_LIST", "PUTTY_LIST", "SAND_LIST", "BASE_LIST"]   # stages 1-4; the finish uses GLC_LIST / JOTUN_LIST
LIST_RANGES = {"GLC_LIST": GLC_RANGE, "JOTUN_LIST": JOTUN_RANGE, "SEALER_LIST": cat_range("sealer"),
               "PUTTY_LIST": cat_range("putty"), "SAND_LIST": cat_range("sand"), "BASE_LIST": cat_range("base")}
BRAND_ROW = 29                               # finish-coat brand picker, under the stages table
# stage, default product, coats, ceiling?
STAGES = [
    ("سيلر", PIDX["GLC المقاوم 0017 — 9 لتر"], 1, "نعم"),
    ("معجون", PIDX["GLC معجون داي-تون 100 — 15 كجم"], 2, "نعم"),
    ("صنفرة", PIDX["ورق صنفرة"], 2, "نعم"),
    ("بطانة", PIDX["GLC سوبر داي-تون 3030 — 3.8 لتر"], 1, "نعم"),
    ("الوش النهائي", PIDX["Jotun فينوماستيك بيتي مطفي غني (My Home Rich Matt) — 3.6 لتر"], 2, "نعم"),
]
S1, SN = 24, 24 + len(STAGES) - 1          # stage input rows
R1 = 34                                     # first result row
RN = R1 + len(STAGES) - 1


def lk(col, s):
    """Catalog lookup of column col for the product picked on stage row s."""
    return f"IFERROR(INDEX({CATQ}!${col}${FIRST}:${col}${LAST},MATCH($C${s},{CATQ}!$B${FIRST}:$B${LAST},0)),0)"


wb = Workbook()
ws = wb.active
ws.title = "الحسبة"
ct = wb.create_sheet(CAT)
ex = wb.create_sheet("شرح الحسبة")
ws.sheet_view.rightToLeft = True
ws.sheet_view.showGridLines = False
for k, v in {"A": 2, "B": 28, "C": 24, "D": 12, "E": 15, "F": 11, "G": 13, "H": 14, "I": 13, "J": 2}.items():
    ws.column_dimensions[k].width = v
banner(ws, 10, "حاسبة كميات وتكلفة الدهانات", "من السيلر لحد الوش النهائي: الكميات والعبوات والتكلفة")

ws.row_dimensions[6].height = 24
ws.row_dimensions[7].height = 45.75
ws.row_dimensions[8].height = 30
cards = [
    ("B", "B", "التكلفة الإجمالية", "=C46", "#,##0", '="جنيه خامات + مصنعية"', True),
    ("C", "D", "صافي مساحة الدهان", "=C20", NUM, '="م² حوائط + سقف"', False),
    ("E", "F", "تكلفة الخامات", "=C44", "#,##0",
     '=IF(C44=0,"اكتب أسعار العبوات في شيت «الخامات»","جنيه شامل "&TEXT($C$17,"0%")&" هالك")', True),
    ("G", "I", "تكلفة المتر", "=C47", "#,##0.00", '="جنيه/م² خامات + مصنعية"', False),
]
top = side("thick", ORANGE)
wht = side("thick", WHITE)
for c1, c2, title, val, fmt, sub, hero in cards:
    bg = NAVY if hero else GREEN
    for r, v, fn, nf in (
        (6, title, font(10, True, "D6DCE8" if hero else GREEN_TXT), None),
        (7, val, font(26, True, ORANGE if hero else NAVY), fmt),
        (8, sub, font(9, False, "AEB8CC" if hero else GRAYTXT), None),
    ):
        if c1 != c2:
            merge(ws, f"{c1}{r}:{c2}{r}", v, f=bg, fn=fn, fmt=nf)
        else:
            put(ws, f"{c1}{r}", v, f=bg, fn=fn, fmt=nf)
        for k in range(ord(c1), ord(c2) + 1):
            ws[f"{chr(k)}{r}"].border = Border(left=wht if chr(k) == c2 else None, right=wht if chr(k) == c1 else None,
                                               top=top if r == 6 else None)

# ---------- 1. area & settings ----------
section(ws, 10, "١ — المساحة والإعدادات")
header(ws, 11, [("B11", "المدخل"), ("C11", "القيمة"), ("D11", "الوحدة"), ("E11:I11", "توضيح")])
ins = [
    (12, "مساحة الشقة", 80, "#,##0.##", "م²", "مساحة أرض الشقة. منها بيتقدّر طول الحوائط والفتحات والسقف لو سبت خاناتهم فاضية"),
    (13, "إجمالي طول الحوائط", None, "#,##0.##", "م", "فاضية = مساحة الشقة × 1 م (تقريبي). أو اكتب مجموع أطوال الحوائط الحقيقي"),
    (14, "الارتفاع", 3, "#,##0.##", "م", "ارتفاع الحوائط من الأرض للسقف"),
    (15, "خصم الفتحات", None, "#,##0.##", "م²", "فاضية = 12.5% من مساحة الحوائط (أبواب وشبابيك). أو اكتب المساحة الحقيقية، وصفر لو مفيش"),
    (16, "مساحة السقف", None, "#,##0.##", "م²", "فاضية = 93% من مساحة الشقة (بعد سُمك الحيطان). وصفر لو السقف مش هيتدهن"),
    (17, "الهالك", 0.10, "0%", "%", "بيتضاف على كل الخامات قبل التقريب للعبوات"),
    (18, "المصنعية", 0, "#,##0.##", "ج/م²", "سعر النقاش للمتر المسطح من الأول للآخر، وبيتضرب في صافي المساحة"),
]
for i, (r, lab, v, fmt, unit, txt) in enumerate(ins):
    z = WHITE if i % 2 == 0 else ZEBRA
    put(ws, f"B{r}", lab, f=LABEL, fn=font(11, True), a=al("right", 1), bd=B_ROW)
    put(ws, f"C{r}", v, f=INPUT, fn=font(12, True, "0000FF"), fmt=fmt, bd=B_IN, unlock=True)
    put(ws, f"D{r}", unit, f=z, fn=font(10, True, GRAYTXT), bd=B_ROW)
    merge(ws, f"E{r}:I{r}", txt, f=z, fn=font(9, False, GRAYTXT), a=al("right", 1), bd=B_ROW)
for i, (r, lab, f, txt) in enumerate([
    (19, "صافي مساحة الحوائط", '=MAX(0,IF(C13="",C12,C13)*C14-IF(C15="",0.125*IF(C13="",C12,C13)*C14,C15))',
     '=TEXT(IF(C13="",C12,C13),"0.#")&" م × "&TEXT(C14,"0.##")&" م − فتحات "&TEXT(IF(C15="",0.125*IF(C13="",C12,C13)*C14,C15),"0.#")&" م²"&IF(C13="","  (الطول متقدّر من مساحة الشقة)","")'),
    (20, "صافي المساحة الكلية", '=C19+IF($C$16="",0.93*$C$12,$C$16)',
     '="الحوائط + السقف "&TEXT(IF($C$16="",0.93*$C$12,$C$16),"0.#")&" م²"&IF($C$16="","  (السقف متقدّر من مساحة الشقة)","")'),
]):
    z = ZEBRA if i % 2 == 0 else WHITE
    put(ws, f"B{r}", lab, f=LABEL, fn=font(11, True), a=al("right", 1), bd=B_ROW)
    put(ws, f"C{r}", f, f=GREEN, fn=font(12, True, GREEN_TXT), fmt=NUM, bd=B_ROW)
    put(ws, f"D{r}", "م²", f=z, fn=font(10, True, GRAYTXT), bd=B_ROW)
    merge(ws, f"E{r}:I{r}", txt, f=z, fn=font(9, False, GRAYTXT), a=al("right", 1), bd=B_ROW)
for r in range(12, 21):
    ws.row_dimensions[r].height = 25.5
note(ws, 21, "الخلايا الصفراء بخط أزرق = مدخلات تقدر تغيّرها، والخلايا الخضرا = نتايج بتتحسب لوحدها. الشيت محمي عشان المعادلات ماتتمسحش (من غير باسورد).")

# ---------- 2. stages ----------
section(ws, 22, "٢ — مراحل الدهان والخامات")
header(ws, 23, [("B23", "المرحلة"), ("C23:E23", "الخامة (اختار من القايمة)"), ("F23", "عدد الأوجه (اختار)"),
                ("G23", "على السقف كمان؟"), ("H23", "معدل الفرد (م² للوحدة للوش)"), ("I23", "العبوة")])
for i, (stage, p, coats, ceil) in enumerate(STAGES):
    r = S1 + i
    put(ws, f"B{r}", f"{i + 1}. {stage}", f=LABEL, fn=font(11, True), a=al("right", 1), bd=B_ROW)
    merge(ws, f"C{r}:E{r}", PRODUCTS[p][0], f=INPUT, fn=font(11, True, "0000FF"), a=al("right", 1), bd=B_IN, unlock=True)
    put(ws, f"F{r}", coats, f=INPUT, fn=font(11, True, "0000FF"), fmt="0", bd=B_IN, unlock=True)
    put(ws, f"G{r}", ceil, f=INPUT, fn=font(11, True, "0000FF"), bd=B_IN, unlock=True)
    put(ws, f"H{r}", "=" + lk("D", r), f=GREEN, fn=font(11, False, DARK), fmt="0.0#", bd=B_ROW)
    put(ws, f"I{r}", f'={lk("E", r)}&" "&{lk("C", r)}', f=GREEN, fn=font(10, False, DARK), bd=B_ROW)
    ws.row_dimensions[r].height = 27
r = BRAND_ROW
put(ws, f"B{r}", "شركة الوش النهائي", f=LABEL, fn=font(11, True), a=al("right", 1), bd=B_ROW)
merge(ws, f"C{r}:E{r}", "Jotun", f=INPUT, fn=font(11, True, "0000FF"), bd=B_IN, unlock=True)
merge(ws, f"F{r}:I{r}", f'=IF(LEFT($C${SN},LEN($C${r})+1)=$C${r}&" ","قايمة خامة الوش النهائي فيها منتجات "&$C${r}&" بس","الخامة المختارة في الوش النهائي مش "&$C${r}&"، اختار من القايمة")',
      f=GREEN, fn=font(10, True, GREEN_TXT), a=al("right", 1), bd=B_ROW)
ws.conditional_formatting.add(f"F{r}:I{r}", FormulaRule(formula=[f'LEFT($C${SN},LEN($C${r})+1)<>$C${r}&" "'],
                              fill=fill("FDECEC"), font=Font(name="Arial", size=10, bold=True, color=RED)))
ws.row_dimensions[r].height = 27
note(ws, SN + 2, "كل مرحلة بتعرض أصنافها بس (سيلر، معجون، صنفرة، بطانة، فينيش). المعدلات والأسعار في شيت «الخامات» وتقدر تعدّلها.")
note(ws, SN + 3, "عدد الأوجه بتختاره من القايمة (1 أو 2 أو 3 أو 4) والكمية بتتضرب فيه. المعجون = عدد السكاكين، والصنفرة = عدد المرات، وصفر لو المرحلة مش هتتعمل.")

# ---------- 3. quantities ----------
section(ws, 32, "٣ — الكميات والتكلفة لكل مرحلة")
header(ws, 33, [("B33", "المرحلة"), ("C33", "المساحة (م²)"), ("D33", "الكمية"), ("E33", "الوحدة"),
                ("F33", "عدد العبوات"), ("G33", "التكلفة (ج)"), ("H33:I33", "للشراء")])
for i in range(len(STAGES)):
    r, s = R1 + i, S1 + i
    z = WHITE if i % 2 == 0 else ZEBRA
    put(ws, f"B{r}", f"=B{s}", f=z, fn=font(11, True), a=al("right", 1), bd=B_ROW)
    put(ws, f"C{r}", f'=IF(F{s}=0,0,$C$19+IF(G{s}="نعم",IF($C$16="",0.93*$C$12,$C$16),0))', f=GREEN, fn=font(11, False, DARK), fmt=NUM, bd=B_ROW)
    put(ws, f"D{r}", f"=IF(H{s}=0,0,C{r}*F{s}/H{s}*(1+$C$17))", f=GREEN, fn=font(11, False, DARK), fmt=NUM, bd=B_ROW)
    put(ws, f"E{r}", "=" + lk("C", s), f=z, fn=font(10, True, GRAYTXT), bd=B_ROW)
    put(ws, f"F{r}", f'=IF({lk("E", s)}=0,0,ROUNDUP(D{r}/{lk("E", s)},0))', f=GREEN, fn=font(12, True, GREEN_TXT), fmt="#,##0", bd=B_ROW)
    put(ws, f"G{r}", f'=F{r}*{lk("F", s)}', f=GREEN, fn=font(11, True, DARK), fmt="#,##0.00", bd=B_ROW)
    merge(ws, f"H{r}:I{r}", f'=IF(F{r}=0,"—",F{r}&" × "&I{s})', f=z, fn=font(10, False, DARK), bd=B_ROW)
    ws.row_dimensions[r].height = 24
put(ws, f"B{RN + 1}", "إجمالي الخامات", f=NAVY, fn=font(11, True, WHITE), a=al("right", 1))
for col in "CDEF":
    put(ws, f"{col}{RN + 1}", None, f=NAVY)
put(ws, f"G{RN + 1}", f"=SUM(G{R1}:G{RN})", f=GREEN, fn=font(12, True, GREEN_TXT), fmt="#,##0.00", bd=B_ROW)
merge(ws, f"H{RN + 1}:I{RN + 1}", None, f=NAVY)
ws.row_dimensions[RN + 1].height = 25.5
note(ws, RN + 2, "الكمية = المساحة × عدد الأوجه ÷ معدل الفرد × (1 + الهالك)، والعبوات متقرّبة لأعلى لعبوة كاملة.")

# ---------- 4. totals ----------
section(ws, 42, "٤ — الإجمالي")
header(ws, 43, [("B43", "البند"), ("C43", "القيمة"), ("D43", "الوحدة"), ("E43:I43", "ملاحظة")])
res = [
    (44, "تكلفة الخامات", f"=G{RN + 1}", "جنيه", "مجموع تكلفة عبوات كل المراحل"),
    (45, "المصنعية", "=C20*C18", "جنيه", "صافي المساحة الكلية × سعر المصنعية للمتر"),
    (46, "التكلفة الإجمالية", "=C44+C45", "جنيه", "الخامات + المصنعية"),
    (47, "تكلفة المتر المسطح", "=IF(C20=0,0,C46/C20)", "ج/م²", "التكلفة الإجمالية ÷ صافي المساحة الكلية"),
]
for i, (r, lab, f, unit, txt) in enumerate(res):
    z = WHITE if i % 2 == 0 else ZEBRA
    key = r == 46
    put(ws, f"B{r}", lab, f=z, fn=font(11, True), a=al("right", 1), bd=B_ROW)
    put(ws, f"C{r}", f, f=GREEN, fn=font(12 if key else 11, key, GREEN_TXT if key else DARK), fmt="#,##0.00", bd=B_ROW)
    put(ws, f"D{r}", unit, f=z, fn=font(10, True, GRAYTXT), bd=B_ROW)
    merge(ws, f"E{r}:I{r}", txt, f=z, fn=font(9, False, GRAYTXT), a=al("right", 1), bd=B_ROW)
    ws.row_dimensions[r].height = 24
note(ws, 49, "الحسبة تقديرية وبتتغير حسب حالة المحارة ونوع الخامة وطريقة التنفيذ، ولازم يعتمدها مهندس مختص.", RED)
merge(ws, "B51:I51", "إعداد: Eng/ Mostafa Elgindi   |   Gindi Innovations   |   الحسبة تقديرية وتُعتمد من مهندس مختص",
      f=NAVY, fn=font(10, True, WHITE))
ws.row_dimensions[51].height = 27.75
for r in (9, 21, 31, 41, 48, 50):
    ws.row_dimensions[r].height = 12


def dv(sheet, rng, msg, typ="decimal", op=None, f1=None, f2=None):
    v = DataValidation(type=typ, operator=op, formula1=f1, formula2=f2, allow_blank=True,
                       showErrorMessage=True, errorStyle="stop", errorTitle="قيمة غير مقبولة", error=msg)
    sheet.add_data_validation(v)
    for part in rng.split():
        v.add(part)


dv(ws, f"G{S1}:G{SN}", "اختار نعم أو لا", typ="list", f1='"نعم,لا"')
for k, nm in enumerate(STAGE_LISTS):
    dv(ws, f"C{S1 + k}", f"اختار {STAGES[k][0]} من القايمة", typ="list", f1=nm)
dv(ws, f"C{SN}", "اختار خامة الشركة اللي اخترتها من القايمة", typ="list", f1=f'INDIRECT(IF($C${BRAND_ROW}="Jotun","JOTUN_LIST","GLC_LIST"))')
dv(ws, f"C{BRAND_ROW}", "اختار GLC أو Jotun", typ="list", f1='"GLC,Jotun"')
dv(ws, f"C12:C16 C18", "اكتب رقم (صفر أو أكبر)", op="greaterThanOrEqual", f1="0")
dv(ws, f"F{S1}:F{SN}", "اختار عدد الأوجه من القايمة (0 لو المرحلة مش هتتعمل)", typ="list", f1=f'"{COATS}"')
dv(ws, "C17", "اكتب نسبة بين 0% و100%", op="between", f1="0", f2="1")

ws.freeze_panes = "A5"
ws.protection.sheet = True
ws.protection.objects = True
ws.protection.scenarios = True
ws.print_area = "A1:J51"
ws.page_setup.orientation = "portrait"
ws.page_setup.fitToWidth = 1
ws.page_setup.fitToHeight = 1
ws.sheet_properties.pageSetUpPr.fitToPage = True
ws.print_options.horizontalCentered = True
ws.oddFooter.center.text = "Gindi Innovations  |  Eng/ Mostafa Elgindi"


def add_watermark(sheet, path, last_col, last_row):
    img = Image(path)
    w = sum((sheet.column_dimensions[get_column_letter(c)].width or 8.43) * 7 + 5 for c in range(1, last_col + 1))
    h = sum((sheet.row_dimensions[r].height or 15) * 96 / 72 for r in range(1, last_row + 1))
    img.width, img.height = int(w), int(h)
    sheet.add_image(img, "A1")


add_watermark(ws, wm1, 10, 51)

# ================= catalog sheet =================
ct.sheet_view.rightToLeft = True
ct.sheet_view.showGridLines = False
for k, v in {"A": 2, "B": 52, "C": 9, "D": 15, "E": 12, "F": 15, "G": 15, "H": 14, "I": 2}.items():
    ct.column_dimensions[k].width = v
banner(ct, 9, "الخامات والأسعار", "القايمة اللي بتختار منها في الحسبة", brand_size=12)
section(ct, 6, "خامات GLC ومعدلاتها وأسعارها", last="H")
header(ct, 7, [("B7", "الخامة"), ("C7", "الوحدة"), ("D7", "معدل الفرد (م² للوحدة للوش)"), ("E7", "حجم العبوة"), ("F7", "سعر العبوة (ج)"), ("G7", "معدل GLC (أدنى–أقصى)"), ("H7", "أوجه GLC بتنصح بيها")])
for i in range(LAST - FIRST + 1):
    r = FIRST + i
    name, unit, rate, pack, rng, gcoats = PRODUCTS[i] if i < len(PRODUCTS) else (None,) * 6
    put(ct, f"B{r}", name, f=INPUT, fn=font(11, True, "0000FF"), a=al("right", 1), bd=B_IN, unlock=True)
    put(ct, f"C{r}", unit, f=INPUT, fn=font(11, True, "0000FF"), bd=B_IN, unlock=True)
    for col, v, fmt in (("D", rate, "0.0#"), ("E", pack, "0.##"), ("F", 0 if name else None, "#,##0.##")):
        put(ct, f"{col}{r}", v, f=INPUT, fn=font(12, True, "0000FF"), fmt=fmt, bd=B_IN, unlock=True)
    z = WHITE if i % 2 == 0 else ZEBRA
    put(ct, f"G{r}", rng, f=z, fn=font(10, False, GRAYTXT), bd=B_ROW)
    put(ct, f"H{r}", gcoats, f=z, fn=font(10, False, GRAYTXT), bd=B_ROW)
    ct.row_dimensions[r].height = 20
note(ct, LAST + 1, "معدل الفرد = كام متر مربع بيغطيه لتر أو كيلو أو فرخ واحد في الوش الواحد. حجم العبوة بنفس الوحدة.", last="H")
note(ct, LAST + 2, "المعدلات من بيانات GLC الرسمية (موقع glcpaints.com)، والمعدل المستخدم = متوسط الأدنى والأقصى. «اكتب حجم العبوة» = عبوات GLC بالكيلو والمعدل باللتر، فاكتب الحجم باللتر.", last="H")
note(ct, LAST + 3, "اكتب أسعار العبوات من المورد بتاعك. الخامات مترتبة بلوكات: سيلر، معجون، بطانة، فينيش، وبعدها الورنيش والخشب (مش في قوايم الحسبة).", RED, last="H")
merge(ct, f"B{LAST + 5}:H{LAST + 5}", "إعداد: Eng/ Mostafa Elgindi   |   Gindi Innovations", f=NAVY, fn=font(11, True, WHITE))
ct.row_dimensions[LAST + 5].height = 27.75
dv(ct, f"D{FIRST}:F{LAST}", "اكتب رقم (صفر أو أكبر)", op="greaterThanOrEqual", f1="0")
ct.freeze_panes = "A5"
ct.protection.sheet = True
ct.print_area = f"A1:I{LAST + 5}"
ct.page_setup.fitToWidth = 1
ct.page_setup.fitToHeight = 1
ct.sheet_properties.pageSetUpPr.fitToPage = True
add_watermark(ct, wm1, 9, 40)

# ================= explanation sheet =================
ex.sheet_view.rightToLeft = True
ex.sheet_view.showGridLines = False
for k, v in {"A": 2, "B": 26, "C": 100, "D": 2}.items():
    ex.column_dimensions[k].width = v
banner(ex, 4, "شرح الحسبة", "كل اللي محتاج تعرفه عن الشيت", brand_size=12)
row = 6


def block(title, items):
    global row
    section(ex, row, title, last="C")
    row += 1
    for i, (k, v) in enumerate(items):
        z = WHITE if i % 2 == 0 else ZEBRA
        put(ex, f"B{row}", k, f=LABEL, fn=font(11, True), a=al("right", 1), bd=B_ROW)
        put(ex, f"C{row}", v, f=z, fn=font(11, False, DARK), a=al("right", 1), bd=B_ROW)
        ex.row_dimensions[row].height = 30 if len(v) > 95 else 22
        row += 1
    row += 1


block("طريقة الاستخدام", [
    ("الخطوة 1", "اكتب مساحة الشقة والارتفاع بس، والحوائط والفتحات والسقف هيتقدّروا لوحدهم. ولو معاك المقاسات الحقيقية اكتبها في خاناتها."),
    ("الخطوة 2", "في جدول «مراحل الدهان» اختار الخامة لكل مرحلة من القايمة وعدد الأوجه. للوش النهائي اختار الشركة الأول (GLC أو Jotun) في خانة «شركة الوش النهائي»، والقايمة هتعرض منتجاتها بس."),
    ("الأسعار", "أسعار العبوات ومعدلات الفرد بتتكتب مرة واحدة في شيت «الخامات»."),
    ("الخطوة 3", "اختار «على السقف كمان؟» نعم أو لا لكل مرحلة، ولو مرحلة مش هتتعمل اكتب عدد أوجهها صفر."),
    ("الخطوة 4", "اكتب سعر المصنعية للمتر لو عايز تحسبها، واقرا الكروت اللي فوق."),
])
block("ترتيب المراحل", [
    ("1. سيلر", "وش واحد على المحارة عشان يقفل المسام ويثبّت السطح قبل المعجون."),
    ("2. معجون", "سكينتين أو 3 لحد ما السطح يبقى ناعم ومستوي."),
    ("3. صنفرة", "بعد كل سكينة معجون، وبيتحسب بعدد أفرخ الصنفرة."),
    ("4. بطانة", "3030 أو 7070 أو جلتكس بعد المعجون عشان يوحّد السطح ويقلل استهلاك الوش النهائي."),
    ("5. الوش النهائي", "وشين أو 3 من الفينيش باللون المطلوب، زي فينوماستيك ومذهل من Jotun أو سوبر بلاتين من GLC."),
])
block("المعادلات", [
    ("صافي الحوائط", "إجمالي طول الحوائط × الارتفاع − الفتحات."),
    ("التقدير من مساحة الشقة", "طول الحوائط ≈ مساحة الشقة × 1 م (لأن الحيطة الداخلية بتتدهن من الوشين)، والفتحات ≈ 12.5% من الحوائط، والسقف ≈ 93% من مساحة الشقة. يعني شقة 80 م² بارتفاع 3 م ≈ 210 م² حوائط + 74 م² سقف."),
    ("مساحة المرحلة", "صافي الحوائط + السقف لو المرحلة «على السقف كمان؟ = نعم»، وصفر لو عدد الأوجه صفر."),
    ("الكمية", "مساحة المرحلة × عدد الأوجه ÷ معدل الفرد × (1 + الهالك)."),
    ("العبوات", "الكمية ÷ حجم العبوة، متقرّبة لأعلى لعبوة كاملة. المعدل والعبوة والسعر بيتجابوا من شيت «الخامات» حسب الخامة المختارة."),
    ("التكلفة", "عدد العبوات × سعر العبوة، والمصنعية = صافي المساحة الكلية × سعر المتر."),
])
block("مصدر المعدلات", [
    ("سيلر GLC 0017", "10–13 م² للتر للوش (معدل GLC الرسمي)، والشيت واخد المتوسط 11.5. GLC بتنصح بوش واحد."),
    ("معجون GLC", "دايتون 2–3 م² للكيلو للسكينة (المتوسط 2.5)، وأكريلك 900 من 2 لـ 4 (المتوسط 3). معدلات GLC الرسمية، وبتنصح بسكينتين."),
    ("GLC 7070", "9–12 م² للتر للوش (معدل GLC الرسمي)، والشيت واخد المتوسط 10.5. حاسبة موقع GLC بتحسب وش واحد، وGLC بتنصح بوشين."),
    ("GLC 3030", "9–11 م² للتر للوش (معدل GLC الرسمي)، والشيت واخد المتوسط 10. GLC بتنصح بوشين."),
    ("باقي منتجات GLC", "كل منتجات GLC اللي ليها معدل منشور موجودة في شيت «الخامات» بكل أحجام عبواتها، والمعدل = متوسط الأدنى والأقصى."),
    ("Jotun", "معدل التغطية للتر في الوش من صفحة كل منتج على موقع Jotun مصر (حاسبتهم بتحسب وشين بنفس المعدل). أحجام عبوات فينوماستيك 0.9 و3.6 و9 و18 لتر، فراجعها مع التاجر."),
    ("الصنفرة", "10 م² للفرخ تقدير مبدئي."),
])
block("حقوق الملكية", [
    ("© Gindi Innovations", "هذا الملف ملك لـ Gindi Innovations وEng/ Mostafa Elgindi. ممنوع إعادة النشر أو البيع أو إزالة الاسم أو العلامة المائية بدون إذن كتابي."),
])
block("تنبيه مهم", [
    ("اعتماد المهندس", "الحسبة تقديرية، ولازم يعتمدها مهندس مختص حسب حالة المحارة ونوع الخامات وطريقة التنفيذ."),
])
merge(ex, f"B{row}:C{row}", "إعداد: Eng/ Mostafa Elgindi   |   Gindi Innovations", f=NAVY, fn=font(11, True, WHITE))
ex.row_dimensions[row].height = 27.75
ex.protection.sheet = True
ex.print_area = f"A1:D{row}"
ex.page_setup.fitToWidth = 1
ex.page_setup.fitToHeight = 0
ex.sheet_properties.pageSetUpPr.fitToPage = True
add_watermark(ex, wm2, 4, row)

wb.properties.creator = "Eng/ Mostafa Elgindi — Gindi Innovations"
wb.properties.title = "حاسبة كميات وتكلفة الدهانات"
wb.active = 0
for nm, ref in LIST_RANGES.items():
    wb.defined_names[nm] = DefinedName(nm, attr_text=ref)
wb.save(out)
print("saved", out)

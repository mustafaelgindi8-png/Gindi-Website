"""Brick count & cost calculator in the Gindi Innovations house style (copied from the Plaster calculator)."""
import sys
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side, Protection
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.drawing.image import Image
from openpyxl.utils import get_column_letter

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



CAT = "أنواع الطوب"
CATQ = f"'{CAT}'"
FIRST, LAST = 8, 27  # catalog data rows
# name, length, width, height (cm) — common Egyptian sizes
BRICKS = [
    ("طوب أحمر طفلي مصمت", 25, 12, 6),
    ("طوب أحمر طفلي مفرغ", 24, 11, 6),
    ("طوب أحمر طفلي مفرغ", 25, 12, 13),
    ("طوب أحمر طفلي مفرغ", 40, 20, 20),
    ("طوب أسمنتي مصمت", 25, 12, 6),
    ("طوب أسمنتي مفرغ", 25, 12, 12),
    ("بلوك أسمنتي مفرغ", 40, 20, 20),
    ("بلوك أسمنتي مفرغ", 40, 15, 20),
    ("بلوك أسمنتي مفرغ", 40, 10, 20),
    ("طوب رملي جيري", 25, 12, 6),
    ("طوب خفيف (خرسانة خلوية)", 60, 20, 20),
    ("طوب خفيف (خرسانة خلوية)", 60, 15, 20),
    ("طوب خفيف (خرسانة خلوية)", 60, 10, 20),
    ("طوب واجهات (فيس)", 24, 11, 6),
]
THICK = ["نص طوبة", "طوبة", "طوبة ونص"]

wb = Workbook()
ws = wb.active
ws.title = "الحسبة"
ct = wb.create_sheet(CAT)
ex = wb.create_sheet("شرح الحسبة")

# ================= catalog sheet =================
ct.sheet_view.rightToLeft = True
ct.sheet_view.showGridLines = False
for k, v in {"A": 2, "B": 34, "C": 12, "D": 12, "E": 12, "F": 44, "G": 2}.items():
    ct.column_dimensions[k].width = v
banner(ct, 7, "أنواع ومقاسات الطوب", "القايمة اللي بتختار منها في الحسبة", brand_size=12)
section(ct, 6, "أنواع الطوب ومقاساتها (سم)", last="F")
header(ct, 7, [("B7", "نوع الطوبة"), ("C7", "الطول"), ("D7", "العرض"), ("E7", "الارتفاع"), ("F7", "الاسم في القايمة")])
for i in range(LAST - FIRST + 1):
    r = FIRST + i
    z = WHITE if i % 2 == 0 else ZEBRA
    name, L, W, H = BRICKS[i] if i < len(BRICKS) else (None, None, None, None)
    put(ct, f"B{r}", name, f=INPUT, fn=font(11, True, "0000FF"), a=al("right", 1), bd=B_IN, unlock=True)
    for col, v in (("C", L), ("D", W), ("E", H)):
        put(ct, f"{col}{r}", v, f=INPUT, fn=font(12, True, "0000FF"), fmt="0.##", bd=B_IN, unlock=True)
    # Latin "x" (not "×") keeps "25x12x6" reading left-to-right inside the Arabic text
    put(ct, f"F{r}", f'=IF(B{r}="","",B{r}&"  "&C{r}&"x"&D{r}&"x"&E{r}&" سم")',
        f=z, fn=font(11, False, DARK), a=al("right", 1), bd=B_ROW)
    ct.row_dimensions[r].height = 22
note(ct, LAST + 1, "المقاسات = الطول × العرض × الارتفاع بالسنتيمتر. الطول والارتفاع هما وش الطوبة اللي باين في الحيطة، والعرض هو سُمك حائط النص طوبة.", last="F")
note(ct, LAST + 2, "تقدر تعدّل أي مقاس، أو تكتب نوع جديد في الصفوف الفاضية تحت، وهيظهر لوحده في القايمة في شيت «الحسبة».", last="F")
note(ct, LAST + 3, "المقاسات دي الشائعة في السوق المصري وبتختلف شوية من مصنع للتاني، فراجع مقاس المورد قبل الحساب.", RED, last="F")
merge(ct, f"B{LAST + 5}:F{LAST + 5}", "إعداد: Eng/ Mostafa Elgindi   |   Gindi Innovations", f=NAVY, fn=font(11, True, WHITE))
ct.row_dimensions[LAST + 5].height = 27.75
dvc = DataValidation(type="decimal", operator="greaterThanOrEqual", formula1="0", showErrorMessage=True,
                     errorTitle="قيمة غير مقبولة", error="اكتب رقم (صفر أو أكبر)")
ct.add_data_validation(dvc)
dvc.add(f"C{FIRST}:E{LAST}")
ct.freeze_panes = "A5"
ct.protection.sheet = True
ct.print_area = f"A1:G{LAST + 5}"
ct.page_setup.fitToWidth = 1
ct.page_setup.fitToHeight = 1
ct.sheet_properties.pageSetUpPr.fitToPage = True

# ================= main sheet =================
ws.sheet_view.rightToLeft = True
ws.sheet_view.showGridLines = False
widths = {"A": 2, "B": 30, "C": 13, "D": 13, "E": 14, "F": 14, "G": 15, "H": 13, "I": 16, "J": 2}
for k, v in widths.items():
    ws.column_dimensions[k].width = v
banner(ws, 10, "حاسبة عدد وتكلفة الطوب", "اختار نوع الطوبة واكتب أبعاد الحوائط وسعر الألف طوبة")

# rows: 12 brick, 13 dims, 14 joint, 15 waste, 16 price, 17 rate half, 18 rate full
# 23..37 walls, 38 totals, 43..47 results
ws.row_dimensions[6].height = 24
ws.row_dimensions[7].height = 45.75
ws.row_dimensions[8].height = 30
cards = [
    ("B", "B", "عدد الطوب للشراء", "=C46", "#,##0", '="طوبة شامل "&TEXT($C$15,"0%")&" هالك"', True),
    ("C", "D", "صافي مساحة الحوائط", "=G38", NUM, '="م² بعد خصم الفتحات"', False),
    ("E", "F", "التكلفة الإجمالية", "=C47", "#,##0",
     '=IF($C$16=0,"اكتب سعر الألف طوبة في الخانة الصفرا","جنيه بسعر "&TEXT($C$16,"#,##0")&" للألف طوبة")', True),
    ("G", "I", "طوب في المتر (نص طوبة)", "=C17", "0.0", '="طوبة/م² بعرموس "&$C$14&" سم"', False),
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

# ---------- 1. brick & price ----------
section(ws, 10, "١ — اختار الطوبة والسعر")
header(ws, 11, [("B11", "المدخل"), ("C11:F11", "القيمة"), ("G11:I11", "توضيح")])
IDX = f"MATCH($C$12,{CATQ}!$F${FIRST}:$F${LAST},0)"
put(ws, "B12", "نوع ومقاس الطوبة", f=LABEL, fn=font(11, True), a=al("right", 1), bd=B_ROW)
merge(ws, "C12:F12", f"{BRICKS[0][0]}  {BRICKS[0][1]}x{BRICKS[0][2]}x{BRICKS[0][3]} سم",
      f=INPUT, fn=font(12, True, "0000FF"), bd=B_IN, unlock=True)
merge(ws, "G12:I12", "اضغط على الخانة الصفرا هتطلعلك قايمة بكل الأنواع والمقاسات", f=WHITE,
      fn=font(9, False, GRAYTXT), a=al("right", 1), bd=B_ROW)
put(ws, "B13", "الطول × العرض × الارتفاع", f=LABEL, fn=font(11, True), a=al("right", 1), bd=B_ROW)
for col, src in (("C", "C"), ("D", "D"), ("E", "E")):
    put(ws, f"{col}13", f"=IFERROR(INDEX({CATQ}!${src}${FIRST}:${src}${LAST},{IDX}),0)", f=GREEN,
        fn=font(11, True, DARK), fmt="0.##", bd=B_ROW)
put(ws, "F13", "سم", f=ZEBRA, fn=font(10, True, GRAYTXT), bd=B_ROW)
merge(ws, "G13:I13", "بيتجاب لوحده من شيت «أنواع الطوب»", f=ZEBRA, fn=font(9, False, GRAYTXT), a=al("right", 1), bd=B_ROW)
ins = [
    (14, "سُمك العرموس (اللحام)", 1, "0.0#", "سم", "عادة 1 سم للطوب العادي، و0.3 سم للطوب الخفيف اللي بيتركب بلاصق"),
    (15, "الهالك", 0.05, "0%", "%", "عادة من 3% لـ 5%، وزوّده لو الطوب بيتكسر في النقل"),
    (16, "سعر الألف طوبة", 0, "#,##0.##", "جنيه", "سعر المورد للألف طوبة، وبيتضرب في العدد للشراء ÷ 1000"),
]
for i, (r, lab, v, fmt, unit, txt) in enumerate(ins):
    z = WHITE if i % 2 == 0 else ZEBRA
    put(ws, f"B{r}", lab, f=LABEL, fn=font(11, True), a=al("right", 1), bd=B_ROW)
    put(ws, f"C{r}", v, f=INPUT, fn=font(12, True, "0000FF"), fmt=fmt, bd=B_IN, unlock=True)
    put(ws, f"D{r}", unit, f=z, fn=font(10, True, GRAYTXT), bd=B_ROW)
    merge(ws, f"E{r}:I{r}", txt, f=z, fn=font(9, False, GRAYTXT), a=al("right", 1), bd=B_ROW)
rates = [
    (17, "عدد الطوب في المتر — نص طوبة", "=IF(OR(C13=0,E13=0),0,10000/((C13+$C$14)*(E13+$C$14)))",
     "10000 ÷ ((الطول + العرموس) × (الارتفاع + العرموس))"),
    (18, "عدد الطوب في المتر — طوبة", "=IF(OR(D13=0,E13=0),0,10000/((D13+$C$14)*(E13+$C$14)))",
     "10000 ÷ ((العرض + العرموس) × (الارتفاع + العرموس))"),
]
for i, (r, lab, f, txt) in enumerate(rates):
    z = ZEBRA if i % 2 == 0 else WHITE
    put(ws, f"B{r}", lab, f=LABEL, fn=font(11, True), a=al("right", 1), bd=B_ROW)
    put(ws, f"C{r}", f, f=GREEN, fn=font(11, True, DARK), fmt="#,##0.0", bd=B_ROW)
    put(ws, f"D{r}", "طوبة/م²", f=z, fn=font(10, True, GRAYTXT), bd=B_ROW)
    merge(ws, f"E{r}:I{r}", txt, f=z, fn=font(9, False, GRAYTXT), a=al("right", 1), bd=B_ROW)
for r in range(12, 19):
    ws.row_dimensions[r].height = 25.5
note(ws, 19, "الخلايا الصفراء بخط أزرق = مدخلات تقدر تغيّرها، والخلايا الخضرا = نتايج بتتحسب لوحدها. الشيت محمي عشان المعادلات ماتتمسحش (من غير باسورد).")

# ---------- 2. walls ----------
section(ws, 21, "٢ — الحوائط")
header(ws, 22, [("B22", "الحائط"), ("C22", "الطول (م)"), ("D22", "الارتفاع (م)"), ("E22", "خصم الفتحات (م²)"),
                ("F22", "سُمك الحائط"), ("G22", "المساحة الصافية (م²)"), ("H22", "طوب/م²"), ("I22", "عدد الطوب")])
W1, WN = 23, 37
for i, r in enumerate(range(W1, WN + 1)):
    z = WHITE if i % 2 == 0 else ZEBRA
    ex_row = (5, 3, 3.33) if i == 0 else (None, None, None)
    put(ws, f"B{r}", f"حائط {i + 1}", f=INPUT, fn=font(11, True, "0000FF"), a=al("right", 1), bd=B_IN, unlock=True)
    for col, v in zip("CDE", ex_row):
        put(ws, f"{col}{r}", v, f=INPUT, fn=font(12, True, "0000FF"), fmt="#,##0.##", bd=B_IN, unlock=True)
    put(ws, f"F{r}", THICK[0], f=INPUT, fn=font(11, True, "0000FF"), bd=B_IN, unlock=True)
    put(ws, f"G{r}", f"=MAX(0,C{r}*D{r}-E{r})", f=GREEN, fn=font(11, False, DARK), fmt=NUM, bd=B_ROW)
    put(ws, f"H{r}", f'=IF(F{r}="{THICK[1]}",$C$18,IF(F{r}="{THICK[2]}",$C$17+$C$18,$C$17))',
        f=GREEN, fn=font(11, False, DARK), fmt="#,##0.0", bd=B_ROW)
    put(ws, f"I{r}", f"=G{r}*H{r}", f=GREEN, fn=font(11, True, DARK), fmt="#,##0", bd=B_ROW)
    ws.row_dimensions[r].height = 22
put(ws, "B38", "الإجمالي", f=NAVY, fn=font(11, True, WHITE), a=al("right", 1))
for col in "CDEFH":
    put(ws, f"{col}38", None, f=NAVY)
put(ws, "G38", f"=SUM(G{W1}:G{WN})", f=GREEN, fn=font(12, True, GREEN_TXT), fmt=NUM, bd=B_ROW)
put(ws, "I38", f"=SUM(I{W1}:I{WN})", f=GREEN, fn=font(12, True, GREEN_TXT), fmt="#,##0", bd=B_ROW)
ws.row_dimensions[38].height = 25.5
note(ws, 39, "اكتب طول وارتفاع كل حائط بالمتر. الفتحات = مجموع مساحات الأبواب والشبابيك في الحائط (مثلًا باب 0.9×2.1 + شباك 1.2×1.2 = 3.33 م²)، ولو مفيش سيبها فاضية.")
note(ws, 40, "سُمك الحائط من القايمة: نص طوبة (حيطة بعرض الطوبة) أو طوبة (بطول الطوبة) أو طوبة ونص. البلوك والطوب الخفيف عادة بيتبنوا نص طوبة.")

# ---------- 3. totals ----------
section(ws, 42, "٣ — الإجمالي والتكلفة")
header(ws, 43, [("B43", "البند"), ("C43", "القيمة"), ("D43", "الوحدة"), ("E43:I43", "ملاحظة")])
res = [
    (44, "عدد الطوب الصافي (قبل الهالك)", "=I38", "#,##0.0", "طوبة", "مجموع عدد الطوب في كل الحوائط"),
    (45, "عدد الطوب شامل الهالك (حسابي)", "=C44*(1+C15)", "#,##0.0", "طوبة", "العدد الصافي × (1 + الهالك)"),
    (46, "عدد الطوب للشراء", "=ROUNDUP(C45,0)", "#,##0", "طوبة", "مقرّب لأعلى لطوبة كاملة"),
    (47, "التكلفة الإجمالية", "=C46/1000*C16", "#,##0.00", "جنيه", "عدد الطوب للشراء ÷ 1000 × سعر الألف طوبة"),
]
for i, (r, lab, f, fmt, unit, txt) in enumerate(res):
    z = WHITE if i % 2 == 0 else ZEBRA
    key = r in (46, 47)
    put(ws, f"B{r}", lab, f=z, fn=font(11, True), a=al("right", 1), bd=B_ROW)
    put(ws, f"C{r}", f, f=GREEN, fn=font(12 if key else 11, key, GREEN_TXT if key else DARK), fmt=fmt, bd=B_ROW)
    put(ws, f"D{r}", unit, f=z, fn=font(10, True, GRAYTXT), bd=B_ROW)
    merge(ws, f"E{r}:I{r}", txt, f=z, fn=font(9, False, GRAYTXT), a=al("right", 1), bd=B_ROW)
    ws.row_dimensions[r].height = 24
note(ws, 49, "الحسبة تقديرية وبتتغير حسب مقاس الطوب الفعلي وسُمك العرموس وطريقة التنفيذ، ولازم يعتمدها مهندس مدني مختص.", RED)
merge(ws, "B51:I51", "إعداد: Eng/ Mostafa Elgindi   |   Gindi Innovations   |   الحسبة تقديرية وتُعتمد من مهندس مدني مختص",
      f=NAVY, fn=font(10, True, WHITE))
ws.row_dimensions[51].height = 27.75
for r in (9, 20, 41, 48, 50):
    ws.row_dimensions[r].height = 12


def dv(sheet, rng, msg, typ="decimal", op=None, f1=None, f2=None, title="قيمة غير مقبولة"):
    v = DataValidation(type=typ, operator=op, formula1=f1, formula2=f2, allow_blank=True,
                       showErrorMessage=True, errorStyle="stop", errorTitle=title, error=msg)
    sheet.add_data_validation(v)
    for part in rng.split():
        v.add(part)


dv(ws, "C12", "اختار نوع الطوبة من القايمة", typ="list", f1=f"{CATQ}!$F${FIRST}:$F${LAST}")
dv(ws, f"F{W1}:F{WN}", "اختار سُمك الحائط من القايمة", typ="list", f1='"' + ",".join(THICK) + '"')
dv(ws, f"C{W1}:E{WN} C16", "اكتب رقم (صفر أو أكبر)", op="greaterThanOrEqual", f1="0")
dv(ws, "C14", "اكتب سُمك العرموس بالسنتيمتر بين 0 و5", op="between", f1="0", f2="5")
dv(ws, "C15", "اكتب نسبة بين 0% و100%", op="between", f1="0", f2="1")

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
add_watermark(ct, wm1, 7, LAST + 5)

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
    ("الخطوة 1", "اضغط على خانة «نوع ومقاس الطوبة» واختار الطوبة اللي هتشتغل بيها من القايمة."),
    ("الخطوة 2", "اكتب سعر الألف طوبة، وراجع سُمك العرموس والهالك لو مختلفين عندك."),
    ("الخطوة 3", "في جدول «الحوائط» اكتب طول وارتفاع كل حائط، ومساحة الفتحات لو فيه، واختار سُمك الحائط."),
    ("الخطوة 4", "اقرا الكروت اللي فوق: عدد الطوب للشراء والتكلفة الإجمالية."),
    ("نوع مش موجود؟", "روح شيت «أنواع الطوب» واكتب الاسم والمقاس في صف فاضي، وهيظهر في القايمة على طول."),
])
block("المعادلات", [
    ("المساحة الصافية", "الطول × الارتفاع − مساحة الفتحات."),
    ("طوب المتر (نص طوبة)", "10000 ÷ ((طول الطوبة + العرموس) × (ارتفاع الطوبة + العرموس)) بالسنتيمتر."),
    ("طوب المتر (طوبة)", "10000 ÷ ((عرض الطوبة + العرموس) × (ارتفاع الطوبة + العرموس))، يعني حوالي ضعف النص طوبة."),
    ("طوب المتر (طوبة ونص)", "طوب النص طوبة + طوب الطوبة."),
    ("عدد طوب الحائط", "المساحة الصافية × طوب المتر حسب سُمك الحائط."),
    ("الهالك", "مجموع الطوب × (1 + نسبة الهالك)، وبعدين بيتقرّب لأعلى لطوبة كاملة."),
    ("التكلفة", "عدد الطوب للشراء ÷ 1000 × سعر الألف طوبة."),
])
block("مثال اختبار بالقيم الافتراضية", [
    ("المدخلات", "طوب أحمر طفلي مصمت 25×12×6، عرموس 1 سم، حائط 5 م × 3 م نص طوبة، فتحات 3.33 م²، هالك 5%."),
    ("طوب المتر", "10000 ÷ (26 × 7) = 54.9 طوبة/م²."),
    ("النتيجة", "11.67 م² × 54.9 = 641.2 طوبة، وشامل الهالك 673.3 ← 674 طوبة للشراء."),
])
block("ملاحظات مهمة", [
    ("المقاسات", "المقاسات في شيت «أنواع الطوب» هي الشائعة في مصر وبتختلف من مصنع للتاني، فراجع مقاس المورد."),
    ("الطوب الخفيف", "بيتركب بلاصق رفيع، فخلي العرموس حوالي 0.3 سم وانت بتحسبه."),
    ("المونة", "الشيت بيحسب عدد الطوب والتكلفة بس، من غير أسمنت ورمل المونة."),
    ("بدون ماكروز", "الشيت شغال بمعادلات Excel عادية، ومحمي من غير باسورد عشان المعادلات ماتتمسحش."),
])
block("حقوق الملكية", [
    ("© Gindi Innovations", "هذا الملف ملك لـ Gindi Innovations وEng/ Mostafa Elgindi. ممنوع إعادة النشر أو البيع أو إزالة الاسم أو العلامة المائية بدون إذن كتابي."),
])
block("تنبيه مهم", [
    ("اعتماد المهندس", "الحسبة تقديرية، ولازم يعتمدها مهندس مدني مختص حسب نوع الطوب وطريقة التنفيذ."),
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
wb.properties.title = "حاسبة عدد وتكلفة الطوب"
wb.active = 0
wb.save(out)
print("saved", out)

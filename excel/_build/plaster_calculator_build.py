"""Plaster & spatter calculator in the Gindi Innovations house style (copied from the Wire calculator)."""
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


wb = Workbook()
ws = wb.active
ws.title = "الحسبة"
ws.sheet_view.rightToLeft = True
ws.sheet_view.showGridLines = False
widths = {"A": 2, "B": 34, "C": 14, "D": 14, "E": 14, "F": 12, "G": 13, "H": 13, "I": 24, "J": 2}
for k, v in widths.items():
    ws.column_dimensions[k].width = v

banner(ws, 10, "حاسبة أسمنت ورمل المحارة والطرطشة", "تقدير كميات الشراء لأعمال المحارة والطرطشة")

# ---------- KPI cards (rows 6-8) ----------
ws.row_dimensions[6].height = 24
ws.row_dimensions[7].height = 45.75
ws.row_dimensions[8].height = 30
cards = [
    # (range cols, title, value formula, fmt, subtitle formula, hero?)
    ("B", "B", "شكاير الأسمنت للشراء", "=ROUNDUP(E33,0)", "#,##0",
     '="شيكارة "&TEXT($C$24,"0.##")&" كجم = "&TEXT(B7*$C$24,"#,##0")&" كجم مشتراة"', True),
    ("C", "D", "الأسمنت المطلوب (حسابي)", "=E31", NUM,
     '="كجم شامل الهالك = "&TEXT(E33,"#,##0.00")&" شيكارة قبل التقريب"', False),
    ("E", "F", "الرمل للشراء", "=_xlfn.CEILING.MATH(E35,$C$26)", NUM,
     '="م³ مقرّب لأعلى كل "&TEXT($C$26,"0.0#")&" م³"', True),
    ("G", "I", "الرمل المطلوب (حسابي)", "=E35", NUM, '="م³ شامل الهالك قبل التقريب"', False),
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
        rng = f"{c1}{r}:{c2}{r}" if c1 != c2 else f"{c1}{r}"
        if c1 != c2:
            merge(ws, rng, v, f=bg, fn=fn, fmt=nf)
        else:
            put(ws, rng, v, f=bg, fn=fn, fmt=nf)
        cols = range(ord(c1), ord(c2) + 1)
        for k in cols:
            cell = ws[f"{chr(k)}{r}"]
            cell.border = Border(left=wht if chr(k) == c2 else None, right=wht if chr(k) == c1 else None,
                                 top=top if r == 6 else None)

# ---------- 1. stage inputs ----------
section(ws, 10, "١ — مدخلات كل مرحلة")
header(ws, 11, [("B11", "المدخل"), ("C11", "المحارة"), ("D11", "الطرطشة"), ("E11", "الوحدة"), ("F11:I11", "توضيح")])
inputs = [
    ("مساحة الشقة (على الأرض)", 100, None, "#,##0.##", "م²",
     "اكتب مساحة الشقة بس، والحسبة بتطلع منها صافي مساحة التنفيذ تلقائي. بتتكتب مرة واحدة والطرطشة بتاخدها"),
    ("معامل تحويل مساحة الشقة لمسطح المحارة", 3, None, "0.0#", "معامل",
     "مسطح الحوائط والأسقف ≈ 3 أضعاف مساحة الشقة تقريبًا. زوّده لو الشقة أوضها كتير أو السقف عالي، وقلّله لو مفتوحة"),
    ("صافي مساحة التنفيذ", "=C12*C13", None, "#,##0.##", "م²",
     "بتتحسب لوحدها = مساحة الشقة × المعامل (صافي مسطح الحوائط والأسقف)"),
    ("متوسط سُمك الطبقة", 20, 3, "#,##0.##", "مم",
     "سُمك المحارة لا يشمل الطرطشة، والطبقتين بيتحسبوا منفصلين. سُمك الطرطشة = متوسط سُمك مكافئ موزع على المساحة، مش ارتفاع الحبيبات"),
    ("أجزاء الأسمنت (بالحجم)", 1, 1, "0.##", "جزء", "نسب الخلط بالحجم مش بالوزن"),
    ("أجزاء الرمل (بالحجم)", 4, 2, "0.##", "جزء", "قيم الطرطشة الافتراضية مثال للحساب، وتتعدّل حسب التنفيذ الفعلي"),
    ("الهالك", 0.10, 0.10, "0%", "%", "خانة واحدة للمرحلتين، وبيتضاف مرة واحدة بس على الأسمنت والرمل"),
    ("معامل تحويل حجم المونة لخامات جافة", 1.27, 1.27, "0.00", "معامل", "بيحوّل حجم المونة المبلولة لحجم الخامات الجافة، ومش شامل أي هالك"),
]
for i, (lab, p, t, fmt, unit, txt) in enumerate(inputs):
    r = 12 + i
    z = WHITE if i % 2 == 0 else ZEBRA
    put(ws, f"B{r}", lab, f=LABEL, fn=font(11, True), a=al("right", 1), bd=B_ROW)
    for col, v in (("C", p), ("D", t)):
        if r in (12, 13, 14, 18) and col == "D":  # spatter shares the plaster's area and waste
            put(ws, f"D{r}", f"=C{r}", f=GREEN, fn=font(12, True, DARK), fmt=fmt, bd=B_ROW)
            continue
        if r == 14:  # net area = apartment area × factor (computed)
            put(ws, f"C{r}", v, f=GREEN, fn=font(12, True, DARK), fmt=fmt, bd=B_ROW)
            continue
        put(ws, f"{col}{r}", v, f=INPUT, fn=font(12, True, "0000FF"), fmt=fmt, bd=B_IN, unlock=True)
    put(ws, f"E{r}", unit, f=z, fn=font(10, True, GRAYTXT), bd=B_ROW)
    merge(ws, f"F{r}:I{r}", txt, f=z, fn=font(9, False, GRAYTXT), a=al("right", 1), bd=B_ROW)
    ws.row_dimensions[r].height = 30 if len(txt) > 60 else 25.5
# rows: 12 apartment area, 13 area factor, 14 net area, 15 thickness, 16 cement parts, 17 sand parts, 18 waste, 19 dry factor
note(ws, 20, "الخلايا الصفراء بخط أزرق = مدخلات تقدر تغيّرها، والخلايا الخضرا = نتايج بتتحسب لوحدها. الشيت محمي عشان المعادلات ماتتمسحش (من غير باسورد).")

# ---------- 2. general inputs ----------
section(ws, 22, "٢ — مدخلات عامة")
header(ws, 23, [("B23", "المدخل"), ("C23", "القيمة"), ("D23", "الوحدة"), ("E23:I23", "توضيح")])
gen = [
    ("وزن شيكارة الأسمنت", 50, "#,##0.##", "كجم", "لازم يكون أكبر من صفر"),
    ("الكثافة الحجمية للأسمنت السائب", 1440, "#,##0", "كجم/م³", "قيمة تقريبية، لازم تكون أكبر من صفر"),
    ("خطوة تقريب الرمل للشراء", 0.5, "0.0#", "م³", "مثلًا 0.5 أو 1 حسب طريقة توريد الرمل عندك"),
]
for i, (lab, v, fmt, unit, txt) in enumerate(gen):
    r = 24 + i
    z = WHITE if i % 2 == 0 else ZEBRA
    put(ws, f"B{r}", lab, f=LABEL, fn=font(11, True), a=al("right", 1), bd=B_ROW)
    put(ws, f"C{r}", v, f=INPUT, fn=font(12, True, "0000FF"), fmt=fmt, bd=B_IN, unlock=True)
    put(ws, f"D{r}", unit, f=z, fn=font(10, True, GRAYTXT), bd=B_ROW)
    merge(ws, f"E{r}:I{r}", txt, f=z, fn=font(9, False, GRAYTXT), a=al("right", 1), bd=B_ROW)
    ws.row_dimensions[r].height = 25.5
# 24 bag weight, 25 density, 26 step

# ---------- 3. results ----------
section(ws, 28, "٣ — النتائج التفصيلية")
header(ws, 29, [("B29", "البند"), ("C29", "المحارة"), ("D29", "الطرطشة"), ("E29", "الإجمالي"), ("F29", "الوحدة"), ("G29:I29", "ملاحظة")])
results = [
    (30, "الأسمنت قبل الهالك", "=#44*$C$25", "=C30+D30", "كجم", "حجم الأسمنت × كثافة الأسمنت السائب"),
    (31, "الأسمنت شامل الهالك", "=#30*(1+#18)", "=C31+D31", "كجم", "وزن الأسمنت المطلوب (حسابي)"),
    (32, "الأسمنت شامل الهالك بالطن", "=#31/1000", "=C32+D32", "طن", ""),
    (33, "عدد الشكاير الحسابي قبل التقريب", "=#31/$C$24", "=C33+D33", "شيكارة", "التقريب على الإجمالي بس، فوق في الكروت"),
    (34, "الرمل قبل الهالك", "=#45", "=C34+D34", "م³", ""),
    (35, "الرمل شامل الهالك", "=#34*(1+#18)", "=C35+D35", "م³", "كمية الرمل الحسابية قبل تقريب الشراء"),
    (36, "معدل فرد الشيكارة (مع حصتها من الرمل)", '=IF(#33=0,"—",#14/#33)', "—",
     "م²/شيكارة", "مساحة المرحلة ÷ شكايرها غير المقربة. كل مرحلة لوحدها لأن الطبقتين على نفس الحيطان"),
]
for i, (r, lab, f, tot, unit, txt) in enumerate(results):
    z = WHITE if i % 2 == 0 else ZEBRA
    key = r in (31, 33, 35)
    put(ws, f"B{r}", lab, f=z, fn=font(11, True), a=al("right", 1), bd=B_ROW)
    for col in "CD":
        put(ws, f"{col}{r}", f.replace("#", col), f=GREEN, fn=font(11, key, DARK), fmt=NUM, bd=B_ROW)
    if tot == "—":
        put(ws, f"E{r}", tot, f=z, fn=font(11, False, GRAYTXT), bd=B_ROW)
    else:
        put(ws, f"E{r}", tot, f=GREEN, fn=font(12, True, GREEN_TXT), fmt=NUM, bd=B_ROW)
    put(ws, f"F{r}", unit, f=z, fn=font(10, True, GRAYTXT), bd=B_ROW)
    merge(ws, f"G{r}:I{r}", txt, f=z, fn=font(9, False, GRAYTXT), a=al("right", 1), bd=B_ROW)
    ws.row_dimensions[r].height = 24
note(ws, 37, "الأرقام معروضة بمنزلتين عشريتين، والمعادلات شغالة بالدقة الكاملة. لو المساحة صفر الكميات بتبقى صفر ومعدل الفرد بيظهر «—».")

# ---------- 4. intermediate ----------
section(ws, 39, "٤ — خطوات الحساب")
header(ws, 40, [("B40", "الخطوة"), ("C40", "المحارة"), ("D40", "الطرطشة"), ("E40", "الإجمالي"), ("F40", "الوحدة"), ("G40:I40", "المعادلة")])
calc = [
    (41, "حجم المونة", "=#14*#15/1000", "=C41+D41", "م³", "المساحة × السُمك بالمم ÷ 1000"),
    (42, "حجم الخامات الجافة", "=#41*#19", "=C42+D42", "م³", "حجم المونة × معامل التحويل"),
    (43, "مجموع أجزاء الخلطة", "=#16+#17", None, "جزء", "أجزاء الأسمنت + أجزاء الرمل"),
    (44, "حجم الأسمنت", "=IF(#43=0,0,#42*#16/#43)", "=C44+D44", "م³", "الخامات الجافة × أجزاء الأسمنت ÷ مجموع الأجزاء"),
    (45, "حجم الرمل قبل الهالك", "=IF(#43=0,0,#42*#17/#43)", "=C45+D45", "م³", "الخامات الجافة × أجزاء الرمل ÷ مجموع الأجزاء"),
]
calc = [c for c in calc if c[2]]
for i, (r, lab, f, tot, unit, txt) in enumerate(calc):
    z = WHITE if i % 2 == 0 else ZEBRA
    put(ws, f"B{r}", lab, f=z, fn=font(11, True), a=al("right", 1), bd=B_ROW)
    for col in "CD":
        put(ws, f"{col}{r}", f.replace("#", col), f=GREEN, fn=font(11, False, DARK), fmt=NUM, bd=B_ROW)
    if tot:
        put(ws, f"E{r}", tot, f=GREEN, fn=font(11, True, GREEN_TXT), fmt=NUM, bd=B_ROW)
    else:
        put(ws, f"E{r}", "—", f=z, fn=font(11, False, GRAYTXT), bd=B_ROW)
    put(ws, f"F{r}", unit, f=z, fn=font(10, True, GRAYTXT), bd=B_ROW)
    merge(ws, f"G{r}:I{r}", txt, f=z, fn=font(9, False, GRAYTXT), a=al("right", 1), bd=B_ROW)
    ws.row_dimensions[r].height = 24
note(ws, 47, "الحسبة تقديرية وبتتغير حسب استواء الحيطان ونوع الرمل وطريقة الخلط والتنفيذ، ولازم يعتمدها مهندس مدني مختص.", RED)
merge(ws, "B49:I49", "إعداد: Eng/ Mostafa Elgindi   |   Gindi Innovations   |   الحسبة تقديرية وتُعتمد من مهندس مدني مختص",
      f=NAVY, fn=font(10, True, WHITE))
ws.row_dimensions[49].height = 27.75
for r in (9, 21, 27, 38, 46, 48):
    ws.row_dimensions[r].height = 12

# ---------- validation (wire-sheet wording) ----------
def dv(rng, msg, typ="decimal", op=None, f1=None, f2=None):
    v = DataValidation(type=typ, operator=op, formula1=f1, formula2=f2, allow_blank=False,
                       showErrorMessage=True, errorStyle="stop", errorTitle="قيمة غير مقبولة", error=msg)
    ws.add_data_validation(v)
    for part in rng.split():
        v.add(part)

dv("C12:C13 C15:D15 C19:D19", "اكتب رقم (صفر أو أكبر)", op="greaterThanOrEqual", f1="0")
dv("C18", "اكتب نسبة بين 0% و100%", op="between", f1="0", f2="1")
dv("C16:D16", "أجزاء الخلطة لازم تكون صفر أو أكبر، ومجموع الأسمنت والرمل أكبر من صفر",
   typ="custom", f1="AND(ISNUMBER(C16),C16>=0,C16+C17>0)")
dv("C17:D17", "أجزاء الخلطة لازم تكون صفر أو أكبر، ومجموع الأسمنت والرمل أكبر من صفر",
   typ="custom", f1="AND(ISNUMBER(C17),C17>=0,C16+C17>0)")
dv("C24:C26", "اكتب رقم أكبر من صفر", op="greaterThan", f1="0")

ws.freeze_panes = "A5"
ws.protection.sheet = True
ws.protection.objects = True
ws.protection.scenarios = True
ws.print_area = "A1:J49"
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


add_watermark(ws, wm1, 10, 49)

# ---------- explanation sheet ----------
ex = wb.create_sheet("شرح الحسبة")
ex.sheet_view.rightToLeft = True
ex.sheet_view.showGridLines = False
for k, v in {"A": 2, "B": 26, "C": 100, "D": 2}.items():
    ex.column_dimensions[k].width = v
banner(ex, 4, "شرح الحسبة", "كل اللي محتاج تعرفه عن الشيت", brand_size=12)
ex.merge_cells("C2:C2") if False else None

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
    ("الخطوة 1", "اكتب مساحة الشقة على الأرض بس، والحسبة بتضربها في المعامل (3 افتراضيًا) وتطلع صافي مساحة التنفيذ تلقائي، والطرطشة بتاخدها. وبعدين سُمك كل طبقة لوحدها."),
    ("الخطوة 2", "عدّل نسب الخلط (بالحجم) ومعامل التحويل لو مختلفين عندك. الهالك خانة واحدة في المحارة والطرطشة بتاخده تلقائي."),
    ("الخطوة 3", "راجع المدخلات العامة: وزن الشيكارة، كثافة الأسمنت، وخطوة تقريب الرمل."),
    ("الخطوة 4", "اقرا الكروت اللي فوق: عدد الشكاير والرمل للشراء، وجنبهم الكميات الحسابية قبل التقريب."),
])
block("المعادلات", [
    ("صافي مساحة التنفيذ", "مساحة الشقة (م²) × معامل التحويل (3 افتراضيًا) = صافي مسطح الحوائط والأسقف."),
    ("حجم المونة", "صافي المساحة (م²) × السُمك (مم) ÷ 1000 = م³ مونة."),
    ("الخامات الجافة", "حجم المونة × معامل التحويل (1.27 افتراضيًا) عشان الخامات الجافة بتنكمش لما تتخلط بالمية. المعامل ده مش شامل هالك، والهالك بيتحسب لوحده."),
    ("مجموع الأجزاء", "أجزاء الأسمنت + أجزاء الرمل."),
    ("حجم الأسمنت", "الخامات الجافة × أجزاء الأسمنت ÷ مجموع الأجزاء."),
    ("وزن الأسمنت", "حجم الأسمنت × الكثافة الحجمية للأسمنت السائب (1440 كجم/م³)."),
    ("حجم الرمل", "الخامات الجافة × أجزاء الرمل ÷ مجموع الأجزاء."),
    ("الهالك", "الكمية × (1 + نسبة الهالك، 10% افتراضيًا). بيتضاف مرة واحدة بس، ونفس النسبة للمرحلتين."),
    ("عدد الشكاير", "وزن الأسمنت شامل الهالك ÷ وزن الشيكارة، من غير تقريب لكل مرحلة."),
    ("معدل فرد الشيكارة", "مساحة المرحلة ÷ عدد شكايرها غير المقرب، لكل مرحلة لوحدها: الشيكارة مع حصتها من الرمل بتغطي كام م². مفيش إجمالي لأن الطرطشة والمحارة على نفس الحيطان."),
    ("شكاير الشراء", "ROUNDUP(مجموع شكاير المرحلتين غير المقرب، 0): بنجمع الأول وبعدين نقرّب لأعلى لشيكارة كاملة."),
    ("وزن المشترى", "عدد الشكاير المقرب × وزن الشيكارة، وبيبقى أكبر شوية من وزن الأسمنت المطلوب بسبب التقريب."),
    ("رمل الشراء", "CEILING.MATH(مجموع رمل المرحلتين شامل الهالك، خطوة الشراء): بيتقرّب لأعلى لأقرب مضاعف للخطوة."),
])
block("ملاحظات مهمة", [
    ("المساحة", "بتكتب مساحة الشقة على الأرض، والمعامل بيحوّلها لصافي مسطح الحوائط والأسقف. المعامل 3 تقريبي: زوّده لو الأوض كتير أو السقف عالي، وقلّله لو الشقة مفتوحة. واحدة للمرحلتين."),
    ("السُمك", "سُمك المحارة مش شامل الطرطشة. سُمك الطرطشة متوسط سُمك مكافئ موزع على المساحة، مش ارتفاع الحبيبات."),
    ("نسب الخلط", "بالحجم مش بالوزن. قيم الطرطشة الافتراضية مثال وتتعدّل حسب التنفيذ."),
    ("المساحة صفر", "الكميات بتبقى صفر ومعدل الفرد بيظهر «—»."),
    ("بدون ماكروز", "الشيت شغال بمعادلات Excel عادية، ومحمي من غير باسورد عشان المعادلات ماتتمسحش."),
])
block("مثال اختبار بالقيم الافتراضية", [
    ("المساحة", "شقة 100 م² × 3 = 300 م² صافي مساحة التنفيذ."),
    ("المحارة", "أسمنت 2,414.016 كجم — رمل 6.7056 م³ (شامل الهالك)."),
    ("الطرطشة", "أسمنت 603.504 كجم — رمل 0.8382 م³ (شامل الهالك)."),
    ("الأسمنت", "3,017.52 كجم = 60.35 شيكارة ← 61 شيكارة للشراء (3,050 كجم)."),
    ("الرمل", "7.5438 م³ ← 8 م³ للشراء (تقريب كل 0.5 م³)."),
])
block("حقوق الملكية", [
    ("© Gindi Innovations", "هذا الملف ملك لـ Gindi Innovations وEng/ Mostafa Elgindi. ممنوع إعادة النشر أو البيع أو إزالة الاسم أو العلامة المائية بدون إذن كتابي."),
])
block("تنبيه مهم", [
    ("اعتماد المهندس", "الحسبة تقديرية، ولازم يعتمدها مهندس مدني مختص حسب حالة الحيطان ونوع الرمل وطريقة التنفيذ."),
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
wb.properties.title = "حاسبة أسمنت ورمل المحارة والطرطشة"
wb.active = 0
wb.save(out)
print("saved", out)

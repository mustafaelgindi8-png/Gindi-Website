"""Wire calculator (rooms + sockets + devices + El Sewedy prices) in the Gindi Innovations house style.
Same logic as /mnt/project-files/web/wire-calculator.html.
Usage: python3 -I wire_calculator_build.py OUT.xlsx SHEET_WATERMARK.png NOTES_WATERMARK.png
"""
import sys
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side, Protection
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.drawing.image import Image
from openpyxl.utils import get_column_letter
from openpyxl.utils.cell import range_boundaries

out, wm1, wm2 = sys.argv[1], sys.argv[2], sys.argv[3]

NAVY, ORANGE, CREAM = "0B1F3A", "F5A623", "F3D9A4"
LABEL, ZEBRA, WHITE = "F3F5F9", "F9FAFC", "FFFFFF"
INPUT, INPUT_B, LINE = "FFF8E1", "E8CF85", "DDE2EA"
GREEN, GREEN_TXT = "E2F0D9", "1E5631"
GRAYTXT, DARK, RED, FIXED = "7F7F7F", "1A1A1A", "C00000", "EDEFF3"
M1 = "#,##0.0"
M0 = "#,##0"

# لستة أسعار السويدي للكابلات: سلك نحاس مجدول، لفة 100 م، جنيه شامل الضريبة
PRICE_DATE = "2 يونيو 2026"
SIZES = [1.5, 2, 4, 6, 10, 16]
PRICES = {1.5: 1510.45, 2: 2008.73, 4: 3800.71, 6: 5722.30, 10: 9401.24, 16: 15047.57}
LAST = "K"          # last content column; L is the right margin
COLS = "BCDEFGHIJK"

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
    c1, r1, c2, r2 = range_boundaries(rng)
    for r in range(r1, r2 + 1):
        for c in range(c1, c2 + 1):
            ref = f"{get_column_letter(c)}{r}"
            put(ws, ref, v if ref == first else None, **kw)


def inp(ws, ref, v, fmt=None):
    put(ws, ref, v, f=INPUT, fn=font(12, True, "0000FF"), fmt=fmt, bd=B_IN, unlock=True)


def res(ws, ref, v, fmt=M1, key=False):
    put(ws, ref, v, f=GREEN, fn=font(12 if key else 11, True if key else False, GREEN_TXT if key else DARK), fmt=fmt, bd=B_ROW)


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


def section(ws, row, text, last=LAST):
    put(ws, f"B{row}", text, fn=font(13, True), a=al("right", 1, False))
    for col in "BCDEFGHIJK"[: "BCDEFGHIJK".index(last) + 1]:
        ws[f"{col}{row}"].border = Border(bottom=side("medium", NAVY))
    ws.row_dimensions[row].height = 27.75


def note(ws, row, text, color=GRAYTXT, last=LAST, h=15):
    merge(ws, f"B{row}:{last}{row}", text, fn=font(9, False, color), a=al("right", 1))
    ws.row_dimensions[row].height = h


def header(ws, row, cells, h=33.75):
    for ref, text in cells:
        if ":" in ref:
            merge(ws, ref, text, f=NAVY, fn=font(10, True, WHITE))
        else:
            put(ws, ref, text, f=NAVY, fn=font(10, True, WHITE))
    ws.row_dimensions[row].height = h


wb = Workbook()
ws = wb.active
ws.title = "الحسبة"
ws.sheet_view.rightToLeft = True
ws.sheet_view.showGridLines = False
widths = {"A": 2, "B": 26, "C": 13, "D": 11, "E": 11, "F": 13, "G": 13, "H": 13, "I": 13, "J": 13, "K": 14, "L": 2}
for k, v in widths.items():
    ws.column_dimensions[k].width = v

banner(ws, 12, "حاسبة لفات سلك الكهرباء", "تقدير كميات أسلاك شقة التشطيب بالغرف والأجهزة وأسعار السويدي")

# ---------- rows used below ----------
R_AREA, R_REF, R_ROLL, R_MARGIN, R_WMIN, R_WAVG, R_WMAX, R_ELEC, R_FACT = range(12, 21)
ROOM0, NROOMS = 25, 8
ROOM_T = ROOM0 + NROOMS            # 33
DEV0 = 38
SZ0 = 55
SZ_T = SZ0 + len(SIZES)            # 61
CMP0 = 65

A = lambda r: f"$C${r}"            # absolute ref to an input in column C
FACT = A(R_FACT)

# ---------- KPI cards (rows 6-8) ----------
ws.row_dimensions[6].height = 24
ws.row_dimensions[7].height = 45.75
ws.row_dimensions[8].height = 30
cards = [
    ("B", "C", "إجمالي اللفات (متوسط)", f"=F{SZ_T}", M0, '="لفة بعد الهالك"', True),
    ("D", "F", "النطاق المتوقع", f'=IF(G{SZ_T}=0,"—",E{SZ_T}&" – "&G{SZ_T})', None, '="لفة (أدنى – أعلى)"', False),
    ("G", "H", "إجمالي الأطوال", f"=C{SZ_T}", M1,
     f'=IF({A(R_AREA)}="","متر قبل الهالك","متر قبل الهالك — شقة "&{A(R_AREA)}&" م²")', False),
    ("I", "K", "التكلفة التقريبية", f'=IF(I{SZ_T}="","—",I{SZ_T})', M0,
     f'="جنيه — أسعار السويدي (مجدول) {PRICE_DATE}"', True),
]
top, wht = side("thick", ORANGE), side("thick", WHITE)
for c1, c2, title, val, fmt, sub, hero in cards:
    bg = NAVY if hero else GREEN
    for r, v, fn, nf in (
        (6, title, font(10, True, "D6DCE8" if hero else GREEN_TXT), None),
        (7, val, font(26, True, ORANGE if hero else NAVY), fmt),
        (8, sub, font(9, False, "AEB8CC" if hero else GRAYTXT), None),
    ):
        merge(ws, f"{c1}{r}:{c2}{r}", v, f=bg, fn=fn, fmt=nf)
        for k in range(ord(c1), ord(c2) + 1):
            ws[f"{chr(k)}{r}"].border = Border(left=wht if chr(k) == c2 else None, right=wht if chr(k) == c1 else None,
                                              top=top if r == 6 else None)

# ---------- 1. general inputs ----------
section(ws, 10, "١ — المدخلات العامة")
header(ws, 11, [("B11", "المدخل"), ("C11", "القيمة"), ("D11", "الوحدة"), ("E11:K11", "توضيح")])
gen = [
    (R_AREA, "مساحة الشقة", None, "#,##0.##", "م²", "سيبها فاضية لو مش عايز تحجيم بالمساحة"),
    (R_REF, "المساحة المرجعية للأطوال", 100, "#,##0.##", "م²", "الأطوال اللي بتكتبها محسوبة على المساحة دي"),
    (R_ROLL, "طول اللفة الواحدة", 100, "#,##0.##", "متر", "لفة السويدي 100 متر"),
    (R_MARGIN, "هامش اختلاف الأطوال (±)", 0.15, "0%", "%", "بيدي النطاق الأدنى والأعلى للفات"),
    (R_WMIN, "نسبة الهالك — الحد الأدنى", 0.10, "0%", "%", ""),
    (R_WAVG, "نسبة الهالك — المتوسط", 0.12, "0%", "%", "دي اللي بتتحسب عليها التكلفة"),
    (R_WMAX, "نسبة الهالك — الحد الأعلى", 0.15, "0%", "%", ""),
    (R_ELEC, "عدد اللفات اللي الكهربائي طلبها", None, "#,##0.##", "لفة", "سيبها فاضية لو مفيش، وهتشوف المقارنة تحت في «المقارنة مع طلب الكهربائي»"),
]
for i, (r, lab, v, fmt, unit, txt) in enumerate(gen):
    z = WHITE if i % 2 == 0 else ZEBRA
    put(ws, f"B{r}", lab, f=LABEL, fn=font(11, True), a=al("right", 1), bd=B_ROW)
    inp(ws, f"C{r}", v, fmt)
    put(ws, f"D{r}", unit, f=z, fn=font(10, True, GRAYTXT), bd=B_ROW)
    merge(ws, f"E{r}:K{r}", txt, f=z, fn=font(9, False, GRAYTXT), a=al("right", 1), bd=B_ROW)
    ws.row_dimensions[r].height = 24
put(ws, f"B{R_FACT}", "معامل المساحة", f=LABEL, fn=font(11, True), a=al("right", 1), bd=B_ROW)
res(ws, f"C{R_FACT}", f'=IF(OR({A(R_AREA)}="",N({A(R_REF)})=0),1,{A(R_AREA)}/{A(R_REF)})', "0.00", True)
put(ws, f"D{R_FACT}", "×", f=ZEBRA, fn=font(10, True, GRAYTXT), bd=B_ROW)
merge(ws, f"E{R_FACT}:K{R_FACT}", "مساحة الشقة ÷ المساحة المرجعية. بيتضرب فيه طول الغرف (إنارة ومفاتيح وبرايز) والبنود اللي قدامها «نعم»",
      f=ZEBRA, fn=font(9, False, GRAYTXT), a=al("right", 1), bd=B_ROW)
ws.row_dimensions[R_FACT].height = 24
note(ws, 21, "الخلايا الصفراء بخط أزرق = مدخلات تقدر تغيّرها، والخلايا الخضرا = نتايج بتتحسب لوحدها. الشيت محمي عشان المعادلات ماتتمسحش (من غير باسورد).")

# ---------- 2. rooms ----------
section(ws, 23, "٢ — الغرف (إنارة + مفتاح إنارة + برايز)")
header(ws, 24, [("B24", "الغرفة"), ("C24", "طول لينية الإنارة (م)"), ("D24", "مفاتيح الإنارة"), ("E24", "عدد البرايز"),
                ("F24", "طول لينية البريزة (م)"), ("G24", "طول التمديدة لكل بريزة (م)"), ("H24", "البرايز متأرضة؟"),
                ("I24", "سلك 1.5 مم (م)"), ("J24", "سلك 2 مم (م)"), ("K24", "إجمالي الغرفة (م)")], h=45)
for k in range(NROOMS):
    r = ROOM0 + k
    z = WHITE if k % 2 == 0 else ZEBRA
    first = k == 0
    put(ws, f"B{r}", f"غرفة {k + 1}", f=LABEL, fn=font(11, True), a=al("right", 1), bd=B_ROW, unlock=True)
    ws[f"B{r}"].fill = fill(INPUT); ws[f"B{r}"].font = font(11, True, "0000FF"); ws[f"B{r}"].border = B_IN
    inp(ws, f"C{r}", 15 if first else None, "#,##0.##")
    inp(ws, f"D{r}", 1 if first else None, "0")
    inp(ws, f"E{r}", 1 if first else None, "0")
    inp(ws, f"F{r}", 15, "#,##0.##")
    inp(ws, f"G{r}", 3, "#,##0.##")
    inp(ws, f"H{r}", "نعم")
    res(ws, f"I{r}", f"=(N(C{r})*3+N(D{r})*5*2)*{FACT}")
    res(ws, f"J{r}", f'=IF(N(E{r})>0,(N(F{r})+(E{r}-1)*N(G{r}))*IF(H{r}="لا",2,3),0)*{FACT}')
    res(ws, f"K{r}", f"=I{r}+J{r}", key=True)
    ws.row_dimensions[r].height = 22.5
put(ws, f"B{ROOM_T}", "إجمالي الغرف (متر)", f=NAVY, fn=font(11, True, WHITE), a=al("right", 1))
for col in "CDEFGH":
    put(ws, f"{col}{ROOM_T}", None, f=NAVY)
for col in "IJK":
    put(ws, f"{col}{ROOM_T}", f"=SUM({col}{ROOM0}:{col}{ROOM_T - 1})", f=NAVY, fn=font(12, True, ORANGE), fmt=M1)
ws.row_dimensions[ROOM_T].height = 25.5
note(ws, 34, "اكتب طول الإنارة وعدد المفاتيح والبرايز للغرف اللي عندك بس، والغرفة الفاضية بتتحسب صفر. الإنارة = الطول × 3 أسلاك. مفتاح الإنارة = 5 م ثابتة × سلكين لكل مفتاح (1.5 مم).", h=27)
note(ws, 35, "البرايز: لينية واحدة للغرفة من اللوحة لأول بريزة، وباقي البرايز تمديدات منها: (طول اللينية + (عدد البرايز − 1) × التمديدة) × 3 أسلاك، أو سلكين لو «متأرضة؟ لا». مقاس 2 مم.", h=27)

# ---------- 3. devices ----------
section(ws, 36, "٣ — الأجهزة واللينيات المستقلة")
header(ws, 37, [("B37", "البند"), ("C37", "المقاس (مم)"), ("D37", "العدد"), ("E37", "الطول للوحدة (م)"),
                ("F37", "أسلاك في الخط"), ("G37", "يتأثر بالمساحة؟"), ("H37:J37", "ملاحظة"), ("K37", "الإجمالي (م)")])
devices = [
    # name, size, count (None=input blank, 1=fixed), length, note, editable name
    ("غسالة", 4, None, 12, "لينية مستقلة", False),
    ("غسالة أطباق", 4, None, 12, "لينية مستقلة", False),
    ("تكييف 1", 4, 1, 15, "كل صف = تكييف واحد", False),
    ("تكييف 2", 4, 1, None, "اكتب الطول لو فيه تكييف تاني", False),
    ("تكييف 3", 4, 1, None, "اكتب الطول لو فيه تكييف تالت", False),
    ("تكييف 4", 4, 1, None, "اكتب الطول لو فيه تكييف رابع", False),
    ("سخان فوري 1", 6, 1, 10, "كل صف = سخان واحد على لينية مستقلة", False),
    ("سخان فوري 2", 6, 1, None, "اكتب الطول لو فيه سخان تاني", False),
    ("سخان فوري 3", 6, 1, None, "اكتب الطول لو فيه سخان تالت", False),
    ("فرن / بوتاجاز كهربائي", 6, None, 10, "لينية مستقلة", False),
    ("بند إضافي 1", 4, None, None, "مثلاً كابل العداد أو أي لينية زيادة (تقدر تغيّر الاسم)", True),
    ("بند إضافي 2", 10, None, None, "مثلاً كابل العداد أو أي لينية زيادة (تقدر تغيّر الاسم)", True),
]
DEV_T = DEV0 + len(devices)        # 50
for k, (name, size, cnt, ln, txt, editable) in enumerate(devices):
    r = DEV0 + k
    z = WHITE if k % 2 == 0 else ZEBRA
    if editable:
        put(ws, f"B{r}", name, f=INPUT, fn=font(11, True, "0000FF"), a=al("right", 1), bd=B_IN, unlock=True)
    else:
        put(ws, f"B{r}", name, f=LABEL, fn=font(11, True), a=al("right", 1), bd=B_ROW)
    inp(ws, f"C{r}", size, "0.##")
    if cnt == 1:
        put(ws, f"D{r}", 1, f=FIXED, fn=font(11, True, GRAYTXT), fmt="0", bd=B_ROW)
    else:
        inp(ws, f"D{r}", None, "#,##0.##")
    inp(ws, f"E{r}", ln, "#,##0.##")
    inp(ws, f"F{r}", 3, "0")
    inp(ws, f"G{r}", "لا")
    merge(ws, f"H{r}:J{r}", txt, f=z, fn=font(9, False, GRAYTXT), a=al("right", 1), bd=B_ROW)
    res(ws, f"K{r}", f'=N(D{r})*N(E{r})*N(F{r})*IF(G{r}="نعم",{FACT},1)', key=True)
    ws.row_dimensions[r].height = 22.5
put(ws, f"B{DEV_T}", "إجمالي الأجهزة (متر)", f=NAVY, fn=font(11, True, WHITE), a=al("right", 1))
for col in "CDEFGHIJ":
    put(ws, f"{col}{DEV_T}", None, f=NAVY)
put(ws, f"K{DEV_T}", f"=SUM(K{DEV0}:K{DEV_T - 1})", f=NAVY, fn=font(12, True, ORANGE), fmt=M1)
ws.row_dimensions[DEV_T].height = 25.5
note(ws, 51, "الإجمالي = العدد × الطول × عدد الأسلاك. العدد في التكييفات والسخانات ثابت 1 لكل صف، والصف اللي طوله فاضي بيتحسب صفر. المقاسات: غسالات وتكييفات 4 مم، سخان فوري وفرن 6 مم.", h=27)

# ---------- 4. rolls by size ----------
section(ws, 53, "٤ — ملخص اللفات حسب المقاس")
header(ws, 54, [("B54", "المقاس (مم)"), ("C54", "الطول (م)"), ("D54", "بعد الهالك (م)"), ("E54", "لفات — أدنى"),
                ("F54", "لفات — متوسط"), ("G54", "لفات — أعلى"), ("H54", "سعر اللفة (جنيه)"), ("I54:K54", "التكلفة التقريبية (جنيه)")])
roll, margin = A(R_ROLL), A(R_MARGIN)
for k, s in enumerate(SIZES):
    r = SZ0 + k
    z = WHITE if k % 2 == 0 else ZEBRA
    put(ws, f"B{r}", s, f=LABEL, fn=font(11, True), fmt='0.## "مم"', bd=B_ROW)
    extra = f"+SUM($I${ROOM0}:$I${ROOM_T - 1})" if s == 1.5 else f"+SUM($J${ROOM0}:$J${ROOM_T - 1})" if s == 2 else ""
    res(ws, f"C{r}", f"=SUMIF($C${DEV0}:$C${DEV_T - 1},B{r},$K${DEV0}:$K${DEV_T - 1}){extra}")
    res(ws, f"D{r}", f"=C{r}*(1+{A(R_WAVG)})")
    res(ws, f"E{r}", f"=IF(N({roll})=0,0,ROUNDUP(C{r}*(1-{margin})*(1+{A(R_WMIN)})/{roll},0))", M0)
    res(ws, f"F{r}", f"=IF(N({roll})=0,0,ROUNDUP(D{r}/{roll},0))", M0, key=True)
    res(ws, f"G{r}", f"=IF(N({roll})=0,0,ROUNDUP(C{r}*(1+{margin})*(1+{A(R_WMAX)})/{roll},0))", M0)
    inp(ws, f"H{r}", PRICES[s], "#,##0.00")
    merge(ws, f"I{r}:K{r}", f'=IF(H{r}="","",F{r}*H{r})', f=GREEN, fn=font(11, False, DARK), fmt=M0, bd=B_ROW)
    ws.row_dimensions[r].height = 22.5
put(ws, f"B{SZ_T}", "الإجمالي", f=NAVY, fn=font(11, True, WHITE))
for col, fmt in (("C", M1), ("D", M1), ("E", M0), ("F", M0), ("G", M0)):
    put(ws, f"{col}{SZ_T}", f"=SUM({col}{SZ0}:{col}{SZ_T - 1})", f=NAVY, fn=font(12, True, ORANGE), fmt=fmt)
put(ws, f"H{SZ_T}", None, f=NAVY)
merge(ws, f"I{SZ_T}:K{SZ_T}", f'=IF(COUNT(H{SZ0}:H{SZ_T - 1})=0,"",SUM(I{SZ0}:I{SZ_T - 1}))', f=NAVY, fn=font(12, True, ORANGE), fmt=M0)
ws.row_dimensions[SZ_T].height = 25.5
note(ws, 62, f"اللفات متقرّبة لأعلى لكل مقاس. الأسعار من لستة السويدي للكابلات (سلك نحاس مجدول، لفة 100 م، شامل الضريبة) بتاريخ {PRICE_DATE}، وتقدر تعدّلها لو سعر السوق عندك مختلف. التكلفة على عدد اللفات المتوسط.", h=27)

# ---------- 5. comparison ----------
section(ws, 64, "٥ — المقارنة مع طلب الكهربائي")
elec = A(R_ELEC)
cmp_rows = [
    ("اللفات اللي الكهربائي طلبها", f'=IF({elec}="","—",{elec})'),
    ("نطاق الحسبة (أدنى – أعلى)", f'=IF(G{SZ_T}=0,"—",E{SZ_T}&" – "&G{SZ_T}&" لفة")'),
    ("الفرق عن المتوسط", f'=IF({elec}="","—",{elec}-F{SZ_T})'),
    ("التقييم", f'=IF({elec}="","اكتب عدد اللفات اللي الكهربائي طلبها في الخانة C{R_ELEC}",'
                f'IF({elec}>G{SZ_T},"أعلى من النطاق: اسأله الرقم جاي منين وبالتفصيل",'
                f'IF({elec}<E{SZ_T},"أقل من النطاق: اتأكد إن مفيش بند ناقص","داخل النطاق المعقول ✓")))'),
]
for k, (lab, f) in enumerate(cmp_rows):
    r = CMP0 + k
    put(ws, f"B{r}", lab, f=LABEL, fn=font(11, True), a=al("right", 1), bd=B_ROW)
    merge(ws, f"C{r}:K{r}", f, f=GREEN, fn=font(12 if k == 3 else 11, k == 3, GREEN_TXT if k == 3 else DARK),
          fmt="#,##0.##", a=al("right", 1), bd=B_ROW)
    ws.row_dimensions[r].height = 24
note(ws, 70, "الحسبة تقريبية وبتتغير حسب توزيع اللوحة وعدد النقاط وأطوال المسارات والأحمال، ولازم يعتمدها مهندس كهرباء مختص.", RED)
FOOT = 72
merge(ws, f"B{FOOT}:K{FOOT}", "إعداد: Eng/ Mostafa Elgindi   |   Gindi Innovations   |   الحسبة تقديرية وتُعتمد من مهندس كهرباء مختص",
      f=NAVY, fn=font(10, True, WHITE))
ws.row_dimensions[FOOT].height = 27.75
for r in (9, 22, 52, 63, 69, 71):
    ws.row_dimensions[r].height = 12


# ---------- validation ----------
def dv(sheet, rng, msg, typ="decimal", op=None, f1=None, f2=None):
    v = DataValidation(type=typ, operator=op, formula1=f1, formula2=f2, allow_blank=True,
                       showErrorMessage=True, errorStyle="stop", errorTitle="قيمة غير مقبولة", error=msg)
    sheet.add_data_validation(v)
    for part in rng.split():
        v.add(part)


dv(ws, f"C{R_AREA}:C{R_WMAX - 4} C{R_ELEC}", "اكتب رقم (صفر أو أكبر)", op="greaterThanOrEqual", f1="0")
dv(ws, f"C{R_MARGIN}:C{R_WMAX}", "اكتب نسبة بين 0% و100%", op="between", f1="0", f2="1")
dv(ws, f"C{ROOM0}:G{ROOM_T - 1} D{DEV0}:F{DEV_T - 1} H{SZ0}:H{SZ_T - 1}", "اكتب رقم (صفر أو أكبر)", op="greaterThanOrEqual", f1="0")
dv(ws, f"H{ROOM0}:H{ROOM_T - 1} G{DEV0}:G{DEV_T - 1}", "اختار نعم أو لا", typ="list", f1='"نعم,لا"')
dv(ws, f"C{DEV0}:C{DEV_T - 1}", "اختار مقاس من القايمة", typ="list", f1='"' + ",".join(f"{s:g}" for s in SIZES) + '"')

ws.freeze_panes = "A5"
ws.protection.sheet = True
ws.protection.objects = True
ws.protection.scenarios = True
ws.print_area = f"A1:L{FOOT}"
ws.page_setup.orientation = "portrait"
ws.page_setup.paperSize = ws.PAPERSIZE_A4
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


add_watermark(ws, wm1, 12, FOOT)

# ---------- notes sheet ----------
ex = wb.create_sheet("ملاحظات")
ex.sheet_view.rightToLeft = True
ex.sheet_view.showGridLines = False
for k, v in {"A": 2, "B": 24, "C": 100, "D": 2}.items():
    ex.column_dimensions[k].width = v
banner(ex, 4, "دليل الاستخدام والملاحظات", "كل اللي محتاج تعرفه عن الشيت", brand_size=12)

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
    ("الخطوة 1", "اكتب مساحة الشقة، وراجع باقي المدخلات العامة: طول اللفة ونسب الهالك وهامش اختلاف الأطوال."),
    ("الخطوة 2", "في «الغرف» اكتب لكل غرفة طول لينية الإنارة وعدد مفاتيح الإنارة وعدد البرايز، واختار البرايز متأرضة ولا لأ. الغرف الفاضية بتتحسب صفر (لحد 8 غرف)."),
    ("الخطوة 3", "في «الأجهزة» اكتب عدد الغسالات والفرن، واكتب طول كل تكييف وسخان فوري (صف لكل جهاز، لحد 4 تكييفات و3 سخانات)."),
    ("الخطوة 4", "راجع أسعار اللفات في «ملخص اللفات» وعدّلها لو السوق عندك مختلف."),
    ("الخطوة 5", f"اكتب عدد اللفات اللي الكهربائي طلبها في الخانة C{R_ELEC} وشوف التقييم في «المقارنة مع طلب الكهربائي»."),
])
block("منطق الحسبة", [
    ("اللينية", "الدايرة اللي بتطلع من قاطع في اللوحة وتخدم مجموعة نقاط أو جهاز واحد."),
    ("عدد الأسلاك", "كل لينية = 3 أسلاك: فاز + نيوترال + أرضي، فالطول بيتضرب في 3."),
    ("مفتاح إنارة", "السلك اللي نازل من السقف للمفتاح، وبيتحسب مع كل غرفة: سلكين (المفتاح بيقطع الفاز بس) بطول ثابت 5 متر لكل مفتاح، مقاس 1.5 مم."),
    ("البرايز", "كل غرفة ليها لينية بريزة واحدة من اللوحة لأول بريزة، وباقي برايز الغرفة تمديدات منها. الطول = طول اللينية + (عدد البرايز − 1) × طول التمديدة، وبيتضرب في 3 أسلاك بمقاس 2 مم، أو سلكين بس لو البرايز مش متأرضة."),
    ("المقاسات", "إنارة 1.5 مم، برايز 2 مم، غسالات وتكييفات 4 مم، سخان فوري وفرن 6 مم."),
    ("المساحة", "الإنارة ومفاتيح الإنارة والبرايز بيتضرب طولها في مساحة الشقة ÷ المساحة المرجعية. لو مساحة الشقة فاضية بيتحسب من غير تحجيم. الأجهزة لينيات مستقلة ومش بتتأثر بالمساحة إلا لو اخترت «نعم»."),
    ("الهالك والنطاق", "الهالك 10% أدنى و12% متوسط و15% أعلى، وهامش ±15% للأطوال بيدي النطاق الأدنى والأعلى للفات."),
    ("التقريب", "اللفات بتتقرّب لأعلى لكل مقاس."),
    ("الأسعار", f"من لستة السويدي للكابلات: سلك نحاس مجدول، لفة 100 م، شامل الضريبة، بتاريخ {PRICE_DATE}. التكلفة = عدد اللفات المتوسط × سعر اللفة."),
])
block("حاجات مش محسوبة", [
    ("كابل العداد", "كابل العداد للوحة (غالبًا 10 أو 16 مم) بيتحسب منفصل، وتقدر تضيفه في «بند إضافي»."),
    ("التيار الخفيف", "إنتركم ودش وإنترنت وكاميرات."),
])
block("حقوق الملكية", [
    ("© Gindi Innovations", "هذا الملف ملك لـ Gindi Innovations وEng/ Mostafa Elgindi. ممنوع إعادة النشر أو البيع أو إزالة الاسم أو العلامة المائية بدون إذن كتابي."),
])
block("تنبيه مهم", [
    ("اعتماد المهندس", "الحسبة تقديرية لكشف أي رقم مبالغ فيه، ولازم يعتمدها مهندس كهرباء مختص حسب توزيع اللوحة وعدد النقاط وأطوال المسارات والأحمال."),
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
wb.properties.title = "حاسبة لفات سلك الكهرباء"
wb.active = 0
wb.save(out)
print("saved", out)

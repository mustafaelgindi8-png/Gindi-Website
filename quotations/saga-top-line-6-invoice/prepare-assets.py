"""Prepare the images used by invoice.html.

1. top-line-6.jpg: SAGA's studio render of the Top Line 6-seater (from saga-mobility.com),
   cropped to the cover panel's shape.
2. whatsapp-qr.svg: QR code opening a WhatsApp chat with SAGA, invoice number pre-filled.

Needs: pip install pillow segno
Usage: python3 -I quotations/saga-top-line-6-invoice/prepare-assets.py [path-to-render.png]
       (without a path, the render is downloaded from saga-mobility.com)
"""
import os
import sys
import tempfile
import urllib.parse
import urllib.request

import segno
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
A = lambda name: os.path.join(HERE, 'assets', name)

RENDER_URL = 'https://www.saga-mobility.com/renders/TOP-LINE_4%2B2_6-seater_front-34.png'
WHATSAPP = '201080066055'
INVOICE = 'SAGA-INV-261108-TL6'
PANEL_RATIO = 105 / 68          # cover photo panel, width / height in mm


def cover_photo(src):
    im = Image.open(src).convert('RGB')                 # 2400 x 1792 studio render
    w, h = im.size
    ch = round(w / PANEL_RATIO)
    top = min(max(0, round(h * 0.084)), h - ch)          # keep the roof and the wheels in frame
    im = im.crop((0, top, w, top + ch)).resize((1600, round(1600 / PANEL_RATIO)), Image.LANCZOS)
    im.save(A('top-line-6.jpg'), quality=90)


def whatsapp_qr():
    url = f'https://wa.me/{WHATSAPP}?text=' + urllib.parse.quote(f'Hello SAGA, about invoice {INVOICE}')
    segno.make(url, error='m').save(A('whatsapp-qr.svg'), kind='svg', dark='#013C41', light=None,
                                    border=0, scale=10, xmldecl=False, omitsize=True)
    return url


if __name__ == '__main__':
    if len(sys.argv) > 1:
        cover_photo(sys.argv[1])
    else:
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, 'render.png')
            req = urllib.request.Request(RENDER_URL, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=60) as r, open(path, 'wb') as f:
                f.write(r.read())
            cover_photo(path)
    print('QR ->', whatsapp_qr())

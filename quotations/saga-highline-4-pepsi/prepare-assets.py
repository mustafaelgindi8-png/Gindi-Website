"""Prepare the images used by quote.html (High Line 4-seater price offer).

1. high-line-4.jpg: SAGA's studio render of the High Line 4-seater (saga-mobility.com),
   framed for the tall cover panel. 62 px of plain wall are added above the render so the
   whole cart fits; the cart itself is not altered.
2. detail-*.jpg: three detail crops for the spec columns.
3. whatsapp-qr.svg: QR code opening a WhatsApp chat with SAGA, offer reference pre-filled.

Needs: pip install pillow numpy segno
Usage: python3 -I quotations/saga-highline-4-pepsi/prepare-assets.py [path-to-render.png]
       (without a path, the render is downloaded from saga-mobility.com)
"""
import os
import sys
import tempfile
import urllib.parse
import urllib.request

import numpy as np
import segno
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
A = lambda name: os.path.join(HERE, 'assets', name)

RENDER_URL = 'https://www.saga-mobility.com/renders/HIGH-LINE_2%2B2_4-seater_front-34.png'
WHATSAPP = '201080066055'
REFERENCE = 'SAGA-PO-261112-HL4'

CART_CENTRE_X = 1194        # the cart spans x 481-1908 in the 2400 x 1792 render
COVER_W, EXTRA_TOP = 1520, 62   # 1520 x 1854 = the 105 x 128 mm cover panel

DETAILS = {                  # ~1.61:1, the spec-column photo frames
    'detail-seats.jpg': (1290, 500, 1830, 836),
    'detail-wheel.jpg': (940, 1180, 1450, 1497),
    'detail-lights.jpg': (560, 880, 1200, 1278),
}


def build(render_path):
    im = Image.open(render_path).convert('RGB')
    a = np.asarray(im)
    canvas = np.vstack([np.repeat(a[:1], EXTRA_TOP, axis=0), a])   # continue the plain wall upwards
    x0 = CART_CENTRE_X - COVER_W // 2
    Image.fromarray(canvas[:, x0:x0 + COVER_W]).save(A('high-line-4.jpg'), quality=90)
    for name, box in DETAILS.items():
        im.crop(box).save(A(name), quality=90)


def whatsapp_qr():
    url = f'https://wa.me/{WHATSAPP}?text=' + urllib.parse.quote(f'Hello SAGA, about offer {REFERENCE}')
    segno.make(url, error='m').save(A('whatsapp-qr.svg'), kind='svg', dark='#013C41', light=None,
                                    border=0, scale=10, xmldecl=False, omitsize=True)
    return url


if __name__ == '__main__':
    if len(sys.argv) > 1:
        build(sys.argv[1])
    else:
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, 'render.png')
            req = urllib.request.Request(RENDER_URL, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=60) as r, open(path, 'wb') as f:
                f.write(r.read())
            build(path)
    print('QR ->', whatsapp_qr())

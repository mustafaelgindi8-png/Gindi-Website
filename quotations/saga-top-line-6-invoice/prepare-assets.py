"""Prepare the images used by invoice.html.

1. top-line-6-purple.jpg: the purple cart photo, already cleaned of the orange wall letters
   by ../saga-highline-6-purple/prepare-assets.py, cropped around the cart for the cover panel.
2. whatsapp-qr.svg: QR code opening a WhatsApp chat with SAGA, invoice number pre-filled.

Needs: pip install pillow segno
Usage: python3 -I quotations/saga-top-line-6-invoice/prepare-assets.py
"""
import os
import urllib.parse

import segno
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
A = lambda name: os.path.join(HERE, 'assets', name)

PHOTO = os.path.join(HERE, '..', 'saga-highline-6-purple', 'assets', 'highline-6-purple-clean.jpg')
WHATSAPP = '201080066055'
INVOICE = 'SAGA-INV-261108-TL6'
PANEL_W, PANEL_H = 70, 72        # cover photo panel in mm (keep in step with .hero in invoice.html)


def cover_photo():
    im = Image.open(PHOTO).convert('RGB')                  # 961 x 1280; cart spans x 125-850, y 325-1090
    ch = 900                                                 # a little headroom above the roof
    cw = round(ch * PANEL_W / PANEL_H)
    cx, cy = 487, 707                                        # centre of the cart
    box = (cx - cw // 2, cy - ch // 2, cx - cw // 2 + cw, cy - ch // 2 + ch)
    im.crop(box).save(A('top-line-6-purple.jpg'), quality=92)


def whatsapp_qr():
    url = f'https://wa.me/{WHATSAPP}?text=' + urllib.parse.quote(f'Hello SAGA, about invoice {INVOICE}')
    segno.make(url, error='m').save(A('whatsapp-qr.svg'), kind='svg', dark='#013C41', light=None,
                                    border=0, scale=10, xmldecl=False, omitsize=True)
    return url


if __name__ == '__main__':
    cover_photo()
    print('QR ->', whatsapp_qr())

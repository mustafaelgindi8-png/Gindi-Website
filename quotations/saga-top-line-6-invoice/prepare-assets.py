"""Prepare the images used by invoice.html (same design as the High Line price offer).

1. Copies the purple cart photo (orange wall letters already removed) and the three
   detail crops from ../saga-highline-6-purple/assets, where that folder's
   prepare-assets.py makes them.
2. whatsapp-qr.svg: QR code opening a WhatsApp chat with SAGA, invoice number pre-filled.

Needs: pip install segno
Usage: python3 -I quotations/saga-top-line-6-invoice/prepare-assets.py
"""
import os
import shutil
import urllib.parse

import segno

HERE = os.path.dirname(os.path.abspath(__file__))
A = lambda name: os.path.join(HERE, 'assets', name)
OFFER_ASSETS = os.path.join(HERE, '..', 'saga-highline-6-purple', 'assets')

WHATSAPP = '201080066055'
INVOICE = 'SAGA-INV-261108-TL6'

COPIES = {
    'highline-6-purple-clean.jpg': 'top-line-6-purple.jpg',
    'detail-seats.jpg': 'detail-seats.jpg',
    'detail-wheel.jpg': 'detail-wheel.jpg',
    'detail-lights.jpg': 'detail-lights.jpg',
}


def copy_photos():
    for src, dst in COPIES.items():
        shutil.copyfile(os.path.join(OFFER_ASSETS, src), A(dst))


def whatsapp_qr():
    url = f'https://wa.me/{WHATSAPP}?text=' + urllib.parse.quote(f'Hello SAGA, about invoice {INVOICE}')
    segno.make(url, error='m').save(A('whatsapp-qr.svg'), kind='svg', dark='#013C41', light=None,
                                    border=0, scale=10, xmldecl=False, omitsize=True)
    return url


if __name__ == '__main__':
    copy_photos()
    print('QR ->', whatsapp_qr())

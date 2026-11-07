"""Prepare the images used by quote.html.

1. highline-6-purple-clean.jpg: the showroom photo with the orange wall letters
   removed (each masked run is filled row by row from the clean wall on both
   sides, so wall gradients and the horizontal glass lines survive).
2. detail-*.jpg: three detail crops for the spec columns (2x Lanczos + light sharpening).
3. whatsapp-qr.svg: QR code opening a WhatsApp chat with SAGA, offer reference pre-filled.

Needs: pip install opencv-python-headless pillow segno
Usage: python3 -I quotations/saga-highline-6-purple/prepare-assets.py
"""
import os
import urllib.parse

import cv2
import numpy as np
import segno
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
A = lambda name: os.path.join(HERE, 'assets', name)

WHATSAPP = '201080066055'
REFERENCE = 'SAGA-PO-261107-HL6'


def remove_wall_letters(src, dst):
    img = cv2.imread(src).astype(np.float32)
    H, W = img.shape[:2]
    b, r = img[..., 0], img[..., 2]
    v = img.max(axis=2)
    warm = (r - b) > 30          # letters and their halo; the beige wall itself sits at ~10-20
    dark = v < 105               # windshield post, mirror, basket rim stay untouched

    boxes = {'G': (22, 130, 504, 628), 'O': (204, 302, 510, 616), 'I': (398, 440, 510, 606)}
    mask = np.zeros((H, W), np.uint8)
    x0, x1, y0, y1 = boxes['G']
    mask[y0:y1, x0:x1] = 1       # G sits on plain wall: replace the whole box, soft shadow included
    for key in ('O', 'I'):
        x0, x1, y0, y1 = boxes[key]
        m = np.zeros((H, W), np.uint8)
        m[y0:y1, x0:x1] = warm[y0:y1, x0:x1]
        m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
        clip = np.zeros_like(m)
        clip[y0:y1, x0:x1] = 1
        mask |= m & clip
    mask[dark] = 0

    def wall(p):
        return p.max() > 150 and (p.max() - p.min()) < 40

    def side(y, start, step):
        vals, x = [], start
        for _ in range(16):
            if not 0 <= x < W:
                break
            if not mask[y, x] and wall(img[y, x]):
                vals.append(img[y, x])
                if len(vals) == 5:
                    break
            x += step
        return np.mean(vals, axis=0) if vals else None

    out = img.copy()
    for y in range(H):
        row = mask[y]
        if not row.any():
            continue
        x = 0
        while x < W:
            if not row[x]:
                x += 1
                continue
            s = x
            while x < W and row[x]:
                x += 1
            e = x
            L, R = side(y, s - 1, -1), side(y, e, 1)
            if L is not None and R is not None:
                t = np.linspace(0, 1, e - s + 2)[1:-1][:, None]
                out[y, s:e] = L * (1 - t) + R * t
            elif L is not None or R is not None:
                out[y, s:e] = L if L is not None else R
            else:                # boxed in by dark parts: use the nearby wall colour
                win = img[max(0, y - 14):y + 15, max(0, s - 14):e + 14].reshape(-1, 3)
                mw = mask[max(0, y - 14):y + 15, max(0, s - 14):e + 14].reshape(-1)
                ok = (win.max(axis=1) > 150) & ((win.max(axis=1) - win.min(axis=1)) < 40) & (mw == 0)
                if ok.any():
                    out[y, s:e] = win[ok].mean(axis=0)

    m3 = mask[..., None].astype(bool)
    mf = mask.astype(np.float32)[..., None]
    num = cv2.GaussianBlur(out * mf, (1, 15), 0)
    den = cv2.GaussianBlur(mask.astype(np.float32), (1, 15), 0)[..., None]
    out = np.where(m3, num / np.maximum(den, 1e-3), out)          # smooth only among filled pixels
    grain = cv2.GaussianBlur(np.random.default_rng(7).normal(0, 1.4, out.shape).astype(np.float32), (3, 3), 0)
    out = np.where(m3, out + grain, out)
    alpha = np.maximum(mask.astype(np.float32), cv2.GaussianBlur(mask.astype(np.float32), (5, 5), 0))[..., None]
    out = img * (1 - alpha) + out * alpha

    def to_gray(reg):
        return (0.114 * reg[..., 0] + 0.587 * reg[..., 1] + 0.299 * reg[..., 2])[..., None].repeat(3, axis=2)

    for x0, x1, y0, y1 in boxes.values():   # neutralise orange fringe left on dark edges
        reg = out[y0 - 4:y1 + 4, x0 - 4:x1 + 4]
        fringe = (((reg[..., 2] - reg[..., 0]) > 12) & (reg.max(axis=2) < 165))[..., None]
        reg[:] = np.where(fringe, to_gray(reg), reg)
    sp = out[514:536, 236:272]              # orange left under the mirror's lower edge
    sp[:] = np.where(((sp[..., 2] - sp[..., 0]) > 30)[..., None], to_gray(sp), sp)

    cv2.imwrite(dst, np.clip(out, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 95])


def detail_crops(src):
    im = Image.open(src)
    crops = {
        'detail-seats.jpg': (585, 478, 815, 621),
        'detail-wheel.jpg': (95, 878, 365, 1058),
        'detail-lights.jpg': (210, 640, 540, 860),
    }
    for name, box in crops.items():
        c = im.crop(box)
        c = c.resize((c.width * 2, c.height * 2), Image.LANCZOS)
        c.filter(ImageFilter.UnsharpMask(radius=2, percent=55, threshold=2)).save(A(name), quality=90)


def whatsapp_qr():
    url = f'https://wa.me/{WHATSAPP}?text=' + urllib.parse.quote(f'Hello SAGA, about offer {REFERENCE}')
    segno.make(url, error='m').save(A('whatsapp-qr.svg'), kind='svg', dark='#013C41', light=None,
                                    border=0, scale=10, xmldecl=False, omitsize=True)
    return url


if __name__ == '__main__':
    remove_wall_letters(A('highline-6-purple.jpg'), A('highline-6-purple-clean.jpg'))
    detail_crops(A('highline-6-purple-clean.jpg'))
    print('QR ->', whatsapp_qr())

import zlib
import struct
import math

def create_gems_crm_icon(size):
    # RGBA buffer
    # Background: Royal blue gradient (#1e40af to #2563eb to #3b82f6)
    # Rounded corners with radius = size * 0.22
    radius = size * 0.22
    img = bytearray(size * size * 4)

    center = size / 2.0
    scale = size / 24.0

    # Draw background with rounded corners
    for y in range(size):
        # Gradient ratio from top-left to bottom-right
        for x in range(size):
            # Check rounded corner distance
            dx = 0
            if x < radius:
                dx = radius - x
            elif x > size - 1 - radius:
                dx = x - (size - 1 - radius)

            dy = 0
            if y < radius:
                dy = radius - y
            elif y > size - 1 - radius:
                dy = y - (size - 1 - radius)

            if dx > 0 and dy > 0 and (dx * dx + dy * dy) > (radius * radius):
                # Outside rounded corner (transparent)
                idx = (y * size + x) * 4
                img[idx] = 0
                img[idx + 1] = 0
                img[idx + 2] = 0
                img[idx + 3] = 0
                continue

            # Inside rounded rectangle: Blue gradient
            t = (x + y) / (2.0 * size)
            r = int(30 * (1 - t) + 37 * t)
            g = int(64 * (1 - t) + 99 * t)
            b = int(175 * (1 - t) + 235 * t)

            idx = (y * size + x) * 4
            img[idx] = r
            img[idx + 1] = g
            img[idx + 2] = b
            img[idx + 3] = 255

    # Draw Mortarboard cap shape in white
    # Coordinate system based on 24x24:
    # Top rhombus: (12, 4) -> (21, 9) -> (12, 14) -> (3, 9)
    # Lower cap neck: from y=14 to y=19
    # Tassel: right side dangling
    for y in range(size):
        ny = y / scale  # 0 to 24
        for x in range(size):
            nx = x / scale # 0 to 24
            idx = (y * size + x) * 4
            if img[idx + 3] == 0:
                continue

            is_white = False

            # 1. Main mortarboard diamond: |(nx - 12) / 9| + |(ny - 9) / 5| <= 1.0
            val_diamond = abs(nx - 12.0) / 9.0 + abs(ny - 8.5) / 4.8
            if val_diamond <= 1.0:
                is_white = True

            # 2. Lower skull cap under diamond: ny between 12.0 and 17.5, nx between 5.5 and 18.5
            if 12.0 <= ny <= 17.5 and 5.5 <= nx <= 18.5:
                # curved bottom
                bot_y = 15.5 + 2.0 * math.cos((nx - 12.0) / 6.5 * 1.57)
                if ny <= bot_y:
                    is_white = True

            # 3. Tassel cord: from (12, 8.5) to right edge (21, 9) down to (21.5, 16)
            if 8.5 <= ny <= 16.0 and abs(nx - 21.0) <= 0.6:
                is_white = True
            # Tassel bobble
            if 15.5 <= ny <= 17.2 and abs(nx - 21.0) <= 1.2:
                is_white = True

            if is_white:
                img[idx] = 255
                img[idx + 1] = 255
                img[idx + 2] = 255
                img[idx + 3] = 255

    # Encode PNG
    raw_rows = bytearray()
    row_bytes = size * 4
    for y in range(size):
        raw_rows.append(0) # Filter type 0 (None)
        start = y * row_bytes
        raw_rows.extend(img[start:start + row_bytes])

    compressed = zlib.compress(bytes(raw_rows), 9)

    png = bytearray(b'\x89PNG\r\n\x1a\n')
    ihdr = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)
    crc = zlib.crc32(b'IHDR' + ihdr)
    png.extend(struct.pack('>I', len(ihdr)) + b'IHDR' + ihdr + struct.pack('>I', crc))

    crc = zlib.crc32(b'IDAT' + compressed)
    png.extend(struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', crc))

    crc = zlib.crc32(b'IEND')
    png.extend(struct.pack('>I', 0) + b'IEND' + struct.pack('>I', crc))

    return bytes(png)

for sz, name in [(512, 'public/icon-512.png'), (192, 'public/icon-192.png'), (180, 'public/apple-touch-icon.png')]:
    data = create_gems_crm_icon(sz)
    with open(name, 'wb') as f:
        f.write(data)
    print(f'Wrote {name} ({sz}x{sz}, {len(data)} bytes)')

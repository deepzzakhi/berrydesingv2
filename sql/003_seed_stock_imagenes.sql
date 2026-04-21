-- ════════════════════════════════════════════════════════════════════════════
-- Berry Stock · Seed: stock inicial + imágenes reales del catálogo
-- Ejecutar en: Supabase → SQL Editor
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Poner todos los productos existentes en 20 unidades y estado 'stock' ──

UPDATE productos
SET
  cantidad   = 20,
  estado     = 'stock',
  updated_at = now();

-- ── 2. Registrar el movimiento de ingreso masivo ──────────────────────────────
-- (opcional pero recomendado para que quede en el historial)

INSERT INTO movimientos (
  producto_id,
  tipo_movimiento,
  estado_anterior,
  estado_nuevo,
  cantidad_delta,
  notas
)
SELECT
  id,
  'ingreso_stock',
  estado,
  'stock',
  20,
  'Carga inicial de stock — seed masivo'
FROM productos;

-- ── 3. Imágenes reales de telas (catálogo berrydesign.com.ar) ─────────────────
-- Actualiza foto_url en la tabla telas según el código de tela.
-- Si la tela no existe todavía, el UPDATE simplemente no afecta filas.

-- · Materas ───────────────────────────────────────────────────────────────────

UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/WhatsApp-Image-2025-12-10-at-17.04.33-2.jpeg'   WHERE codigo = '26/0004';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/WhatsApp-Image-2025-10-09-at-14.52.40-3.jpeg'   WHERE codigo = '23/0002';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/WhatsApp-Image-2025-12-10-at-17.04.32.jpeg'     WHERE codigo = '21/0001';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/WhatsApp-Image-2025-12-10-at-17.04.47-2.jpeg'   WHERE codigo = '21/0002';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/WhatsApp-Image-2025-12-10-at-17.04.48-1.jpeg'   WHERE codigo = '21/0020';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/WhatsApp-Image-2025-12-10-at-16.48.02-1.jpeg'   WHERE codigo = '26/0021';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/WhatsApp-Image-2025-10-09-at-14.52.42.jpeg'     WHERE codigo = '27/0001';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/WhatsApp-Image-2025-10-09-at-14.52.44-1.jpeg'   WHERE codigo = '27/0002';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/WhatsApp-Image-2025-10-09-at-14.52.39.jpeg'     WHERE codigo = '26/0001';

-- · Porta anteojos ────────────────────────────────────────────────────────────

UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/WhatsApp-Image-2025-10-03-at-15.11.45-6.jpeg'   WHERE codigo = '07/0003';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/WhatsApp-Image-2025-10-03-at-15.11.45-2.jpeg'   WHERE codigo = '07/0006';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/WhatsApp-Image-2025-10-03-at-14.59.28-3.jpeg'   WHERE codigo = '18/0019';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/WhatsApp-Image-2025-10-03-at-14.59.29-3.jpeg'   WHERE codigo = '21/0002';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/WhatsApp-Image-2025-10-03-at-15.11.45-22.jpeg'  WHERE codigo = '23/0002';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/WhatsApp-Image-2025-10-03-at-15.11.46-4.jpeg'   WHERE codigo = '24/0019';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/WhatsApp-Image-2025-10-03-at-15.11.45-7.jpeg'   WHERE codigo = '26/0002';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/WhatsApp-Image-2025-10-03-at-15.11.45-29.jpeg'  WHERE codigo = '26/0005';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/WhatsApp-Image-2025-10-03-at-15.11.45-35.jpeg'  WHERE codigo = '26/0010';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/WhatsApp-Image-2025-10-03-at-15.11.45-18.jpeg'  WHERE codigo = '26/0012';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/WhatsApp-Image-2025-10-03-at-15.11.45-26.jpeg'  WHERE codigo = '26/0013';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/WhatsApp-Image-2025-10-03-at-15.11.45-14.jpeg'  WHERE codigo = '27/0013';

-- · Alfombras vinílicas (serie 30) ────────────────────────────────────────────

UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/30-0001.jpg'  WHERE codigo = '30/0001';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/30-0002.jpg'  WHERE codigo = '30/0002';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/30-0003.jpg'  WHERE codigo = '30/0003';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/30-0004.jpg'  WHERE codigo = '30/0004';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/30-0005.jpg'  WHERE codigo = '30/0005';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/30-0006.jpg'  WHERE codigo = '30/0006';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/30-0007-1.jpg' WHERE codigo = '30/0007';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/30-0008.jpg'  WHERE codigo = '30/0008';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/30-0009.jpg'  WHERE codigo = '30/0009';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/30-0010.jpg'  WHERE codigo = '30/0010';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/30-0011.jpg'  WHERE codigo = '30/0011';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/30-0012.jpg'  WHERE codigo = '30/0012';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/30-0013.jpg'  WHERE codigo = '30/0013';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/30-0014.jpg'  WHERE codigo = '30/0014';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/30-0015.jpg'  WHERE codigo = '30/0015';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/30-0016.jpg'  WHERE codigo = '30/0016';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/30-0017.jpg'  WHERE codigo = '30/0017';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/30-0018.jpg'  WHERE codigo = '30/0018';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/30-0019.jpg'  WHERE codigo = '30/0019';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/30-0020.jpg'  WHERE codigo = '30/0020';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/30-0021.jpg'  WHERE codigo = '30/0021';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/30-0022.jpg'  WHERE codigo = '30/0022';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/30-0023.jpg'  WHERE codigo = '30/0023';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/30-0024.jpg'  WHERE codigo = '30/0024';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/30-0025.jpg'  WHERE codigo = '30/0025';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/30-0026.jpg'  WHERE codigo = '30/0026';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/30-0027.jpg'  WHERE codigo = '30/0027';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/30-0028.jpg'  WHERE codigo = '30/0028';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/30-0029.jpg'  WHERE codigo = '30/0029';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/30-0030.jpg'  WHERE codigo = '30/0030';

-- · Alfombras vinílicas YUTE ──────────────────────────────────────────────────

UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/yute-1.png'   WHERE codigo = 'yute-1'  OR lower(codigo) LIKE '%yute%1%';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/yute-2.png'   WHERE codigo = 'yute-2'  OR lower(codigo) LIKE '%yute%2%';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/yute-3.png'   WHERE codigo = 'yute-3'  OR lower(codigo) LIKE '%yute%3%';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/yute-4.png'   WHERE codigo = 'yute-4'  OR lower(codigo) LIKE '%yute%4%';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/yute-5.png'   WHERE codigo = 'yute-5'  OR lower(codigo) LIKE '%yute%5%';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/yute-6.png'   WHERE codigo = 'yute-6'  OR lower(codigo) LIKE '%yute%6%';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/yute-7.png'   WHERE codigo = 'yute-7'  OR lower(codigo) LIKE '%yute%7%';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/yute-8.png'   WHERE codigo = 'yute-8'  OR lower(codigo) LIKE '%yute%8%';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/yute-9.png'   WHERE codigo = 'yute-9'  OR lower(codigo) LIKE '%yute%9%';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/yute-10.png'  WHERE codigo = 'yute-10' OR lower(codigo) LIKE '%yute%10%';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/yute-11.png'  WHERE codigo = 'yute-11' OR lower(codigo) LIKE '%yute%11%';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/yute-12.png'  WHERE codigo = 'yute-12' OR lower(codigo) LIKE '%yute%12%';
UPDATE telas SET foto_url = 'https://www.berrydesign.com.ar/wp-content/uploads/yute-13.png'  WHERE codigo = 'yute-13' OR lower(codigo) LIKE '%yute%13%';

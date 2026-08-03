import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Extract Invoice — Visión IA para facturas y tickets
 * Modelo principal: NVIDIA NIM Nemotron 3 Nano Omni 30B (OVNI) — gratis
 * Fallback: Gemini 2.5 Flash (si NVIDIA falla)
 */

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const formData = await req.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No se proporcionó ninguna imagen' },
        { status: 400 }
      );
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no válido. Use JPG, PNG o WebP' },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024;
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        { error: 'La imagen es muy grande. Máximo 10MB' },
        { status: 400 }
      );
    }

    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const base64Image = imageBuffer.toString('base64');
    const mimeType = imageFile.type;

    const prompt = `Eres un asistente experto en inventario de ropa en México. Analiza esta imagen de una factura o ticket. Extrae los productos y devuélvelos EXCLUSIVAMENTE en un array JSON con esta estructura: [{name: string, brand: string, season: string, purchase_price: number, quantity: number, size: string, color: string}]. Incluye marca (brand), temporada (season), talla (size), color si se identifican; si no hay información usa valores vacíos. Si no hay datos, devuelve un array vacío. No incluyas texto markdown, solo el JSON puro.`;

    let text = '';

    // ─── Intentar primero con NVIDIA NIM (OVNI, gratis) ───
    const nvKey = process.env.NVIDIA_NIM_API_KEY;
    const nvModel = process.env.NVIDIA_NIM_MODEL || 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning';
    const nvBase = process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1';

    if (nvKey) {
      try {
        const res = await fetch(nvBase + '/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + nvKey,
          },
          body: JSON.stringify({
            model: nvModel,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
                ],
              },
            ],
            max_tokens: 2000,
            temperature: 0.2,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          text = data.choices?.[0]?.message?.content || '';
          console.error('Invoice via NVIDIA NIM OK');
        } else {
          const errText = await res.text();
          console.error('NVIDIA NIM invoice error', res.status, errText.slice(0, 300));
        }
      } catch (e: any) {
        console.error('NVIDIA NIM invoice fetch error:', e.message);
      }
    }

    // ─── Fallback: Gemini 2.5 Flash ───
    if (!text) {
      const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: 'Error de configuración: sin modelo de visión disponible' },
          { status: 500 }
        );
      }
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Image, mimeType } },
      ])
      text = (await result.response).text();
      console.error('Invoice via Gemini fallback OK');
    }

    text = text.trim();

    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      text = jsonMatch[1] || jsonMatch[0];
    }

    let products;
    try {
      products = JSON.parse(text);
    } catch (parseError) {
      console.error('Error al parsear JSON de la IA:', text.slice(0, 300));
      return NextResponse.json(
        { error: 'No se pudo procesar la factura. Intenta con otra foto más clara' },
        { status: 422 }
      );
    }

    if (!Array.isArray(products)) {
      return NextResponse.json(
        { error: 'Formato de respuesta inválido de la IA' },
        { status: 422 }
      );
    }

    const validatedProducts = products.map((product: any, index: number) => ({
      name: String(product.name || '').trim() || `Producto ${index + 1}`,
      brand: String(product.brand || '').trim() || '',
      season: String(product.season || '').trim() || '',
      purchase_price: parseFloat(product.purchase_price) || 0,
      quantity: parseInt(product.quantity) || 1,
      size: String(product.size || '').trim(),
      color: String(product.color || '').trim(),
    }));

    return NextResponse.json({ products: validatedProducts });
  } catch (error: any) {
    console.error('Error en extract-invoice API:', error);
    return NextResponse.json(
      { error: 'Error al procesar la imagen. Intenta de nuevo o sube otra foto' },
      { status: 500 }
    );
  }
}

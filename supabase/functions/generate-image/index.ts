import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function aspectToDimensions(aspectRatio: string): { width: number; height: number } {
  if (aspectRatio.includes("16:9")) {
    return { width: 1280, height: 720 };
  }
  if (aspectRatio.includes("4:5")) {
    return { width: 800, height: 1000 };
  }
  return { width: 1024, height: 1024 };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const prompt: string = typeof body.prompt === "string" ? body.prompt : "";
    const aspectRatio: string = typeof body.aspectRatio === "string" ? body.aspectRatio : "1:1";

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");

    // Demo mode: no image-generation API key configured.
    if (!apiKey) {
      const { width, height } = aspectToDimensions(aspectRatio);
      const seed = encodeURIComponent(
        prompt.trim().split(" ").slice(0, 3).join("-") + "-" + Math.floor(Math.random() * 100000),
      );
      return new Response(
        JSON.stringify({
          url: `https://picsum.photos/seed/${seed}/${width}/${height}`,
          isDemo: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Real API mode: call OpenAI Images API securely from the server.
    const { width, height } = aspectToDimensions(aspectRatio);
    const size =
      width === height ? "1024x1024" : width > height ? "1792x1024" : "1024x1792";

    const apiRes = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size,
        quality: body.quality === "High Quality" ? "hd" : "standard",
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return new Response(
        JSON.stringify({ error: `Image API error: ${apiRes.status} ${errText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiData = await apiRes.json();
    const url: string | undefined = apiData?.data?.[0]?.url;

    if (!url) {
      return new Response(
        JSON.stringify({ error: "Image API returned no image" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ url, isDemo: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err?.message ?? "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

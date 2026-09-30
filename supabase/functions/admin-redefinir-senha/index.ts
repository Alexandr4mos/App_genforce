import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function respostaJson(corpo: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return respostaJson({ error: "Método não permitido." }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return respostaJson({ error: "Não autenticado." }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return respostaJson({ error: "Sessão inválida." }, 401);
    }

    const { data: caller, error: callerError } = await userClient
      .from("usuarios")
      .select("papel, ativo")
      .eq("id", user.id)
      .single();

    if (
      callerError ||
      !caller?.ativo ||
      !["admin", "supervisor"].includes(caller.papel)
    ) {
      return respostaJson(
        { error: "Apenas administradores podem redefinir senhas." },
        403,
      );
    }

    const body = await req.json();
    const userIdAlvo = String(body.user_id || "").trim();
    const senha = String(body.senha || "");

    if (!userIdAlvo) {
      return respostaJson({ error: "Informe o usuário." }, 400);
    }

    if (!senha || senha.length < 6) {
      return respostaJson(
        { error: "A senha deve ter pelo menos 6 caracteres." },
        400,
      );
    }

    const { data: alvo, error: alvoError } = await userClient
      .from("usuarios")
      .select("id, nome, ativo")
      .eq("id", userIdAlvo)
      .single();

    if (alvoError || !alvo) {
      return respostaJson({ error: "Usuário não encontrado." }, 404);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      userIdAlvo,
      { password: senha },
    );

    if (updateError) {
      return respostaJson(
        { error: updateError.message || "Erro ao redefinir senha." },
        400,
      );
    }

    return respostaJson({ ok: true, id: userIdAlvo, nome: alvo.nome });
  } catch (e) {
    return respostaJson({ error: String(e) }, 500);
  }
});

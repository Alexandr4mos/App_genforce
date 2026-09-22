import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const DOMINIO_INTERNO = "genforce.app";

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

function normalizarLoginUsuario(texto: string): string {
  return String(texto || "")
    .trim()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/@.*/, "")
    .replace(/[^a-z0-9._-]/g, "");
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
        { error: "Apenas administradores podem criar usuários." },
        403,
      );
    }

    const body = await req.json();
    const nome = String(body.nome || "").trim();
    const usuario = normalizarLoginUsuario(String(body.usuario || ""));
    const papel = body.papel === "admin" ? "admin" : "tecnico";
    const senha = String(body.senha || "");

    if (!nome || !usuario || !senha) {
      return respostaJson({ error: "Preencha nome, usuário e senha." }, 400);
    }

    if (!/^[a-z0-9._-]+$/.test(usuario)) {
      return respostaJson(
        { error: "Usuário inválido após normalização. Use letras, números, ponto, hífen ou underline." },
        400,
      );
    }

    const email = `${usuario}@${DOMINIO_INTERNO}`;

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
    });

    if (createError || !created?.user) {
      const msg = createError?.message || "";
      const duplicado =
        msg.toLowerCase().includes("already") ||
        msg.toLowerCase().includes("registered") ||
        msg.toLowerCase().includes("exists");
      return respostaJson(
        { error: duplicado ? "Este usuário já existe." : msg || "Erro ao criar conta." },
        400,
      );
    }

    const { error: insertError } = await adminClient.from("usuarios").insert({
      id: created.user.id,
      nome,
      papel,
      ativo: true,
    });

    if (insertError) {
      await adminClient.auth.admin.deleteUser(created.user.id);
      return respostaJson({ error: insertError.message }, 500);
    }

    return respostaJson({ ok: true, id: created.user.id });
  } catch (e) {
    return respostaJson({ error: String(e) }, 500);
  }
});

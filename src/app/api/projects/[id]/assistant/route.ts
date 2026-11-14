import { z } from "zod";
import { aiConfigured, askProject } from "@/lib/ai";
import { apiUser, body, handler, HttpError, oid, ok, ownedProject } from "@/lib/api";
import { Conversation, type IConversation } from "@/lib/models";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler<Ctx>(async (req, ctx) => {
  const a = await apiUser();
  const p = await ownedProject(a, (await ctx.params).id);
  const cid = new URL(req.url).searchParams.get("c");
  if (cid) {
    const c = await Conversation.findOne({ _id: oid(cid), projectId: p._id, userId: a.user._id }).lean<IConversation>();
    if (!c) throw new HttpError(404, "Conversation not found");
    return ok({ conversation: c });
  }
  const list = await Conversation.find({ projectId: p._id, userId: a.user._id }).sort({ updatedAt: -1 }).select("title updatedAt").limit(30).lean<IConversation[]>();
  return ok({ conversations: list.map((c) => ({ id: String(c._id), title: c.title, updatedAt: c.updatedAt })) });
});

const tries = new Map<string, number[]>();

export const POST = handler<Ctx>(async (req, ctx) => {
  const a = await apiUser();
  const p = await ownedProject(a, (await ctx.params).id);
  if (!aiConfigured()) throw new HttpError(503, "AI isn't configured. Add GOOGLE_API_KEY to .env.local.");
  const { question, conversationId } = await body(req, z.object({ question: z.string().trim().min(1).max(2000), conversationId: z.string().optional().nullable() }));

  const k = String(a.user._id);
  const recent = (tries.get(k) || []).filter((t) => Date.now() - t < 60_000);
  if (recent.length >= 15) throw new HttpError(429, "You're asking quickly — wait a moment and try again.");
  tries.set(k, [...recent, Date.now()]);

  let convo = conversationId ? await Conversation.findOne({ _id: oid(conversationId), projectId: p._id, userId: a.user._id }) : null;
  if (!convo) convo = new Conversation({ userId: a.user._id, projectId: p._id, title: question.slice(0, 60), messages: [] });

  let answer;
  try {
    answer = await askProject(p, question, convo.messages.map((m) => ({ role: m.role, content: m.content })));
  } catch (e) {
    console.error("[assistant]", e);
    throw new HttpError(502, "The AI model is busy or unavailable right now. Try again in a moment.");
  }
  convo.messages.push({ role: "user", content: question, at: new Date() });
  convo.messages.push({ role: "assistant", content: answer.facts, suggestion: answer.suggestion, suggestedTask: answer.suggestedTask, sources: answer.sources, context: answer.context, at: new Date() });
  await convo.save();
  return ok({ conversationId: String(convo._id), message: convo.messages[convo.messages.length - 1] });
});

export const DELETE = handler<Ctx>(async (req, ctx) => {
  const a = await apiUser();
  const p = await ownedProject(a, (await ctx.params).id);
  const cid = new URL(req.url).searchParams.get("c");
  if (cid) await Conversation.deleteOne({ _id: oid(cid), projectId: p._id, userId: a.user._id });
  return ok({ ok: true });
});

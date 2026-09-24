import type { NextApiRequest, NextApiResponse } from "next"
import nodemailer from "nodemailer"
import { Resend } from "resend"
import { getBearerToken, resolveUserFromJwt } from "@/lib/api-server"
import { getServerClient } from "@/lib/server-db"
import { hashTeamInviteToken, TEAM_INVITE_PREFIX } from "@/lib/teams"

type ResponseBody = { ok: boolean; error?: string }

type OutgoingEmail = {
  to: string
  subject: string
  html: string
}

async function sendViaSmtp(email: OutgoingEmail): Promise<{ ok: boolean; error?: string }> {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    return { ok: false, error: "SMTP is not configured" }
  }

  const port = Number(process.env.SMTP_PORT || 587)
  const fromAddress = process.env.SMTP_FROM || process.env.RESEND_FROM_EMAIL || user
  const senderName = process.env.SMTP_SENDER_NAME

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })

    await transporter.sendMail({
      from: senderName ? `"${senderName}" <${fromAddress}>` : fromAddress,
      to: email.to,
      subject: email.subject,
      html: email.html,
    })

    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "SMTP send failed"
    console.error("SMTP error:", message)
    return { ok: false, error: message }
  }
}

async function sendViaResend(email: OutgoingEmail): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, error: "Resend is not configured" }
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Portfolio <onboarding@resend.dev>",
      to: [email.to],
      subject: email.subject,
      html: email.html,
    })

    if (error) {
      console.error("Resend error:", error)
      return { ok: false, error: error.message }
    }

    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Resend send failed"
    console.error("Resend error:", message)
    return { ok: false, error: message }
  }
}

function getOrigin(req: NextApiRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured) return configured.replace(/\/+$/, "")

  const proto = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0]?.trim() || "http"
  const host = (req.headers["x-forwarded-host"] as string | undefined) || req.headers.host || "localhost:3001"

  return `${proto}://${host}`
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" })
  }

  const jwt = getBearerToken(req)
  const userId = jwt ? await resolveUserFromJwt(jwt) : null

  if (!userId) {
    return res.status(401).json({ ok: false, error: "Unauthorized" })
  }

  const token = typeof req.body?.token === "string" ? req.body.token.trim() : ""
  if (!token || !token.startsWith(TEAM_INVITE_PREFIX)) {
    return res.status(400).json({ ok: false, error: "Invalid invite token" })
  }

  const client = getServerClient()
  const tokenHash = await hashTeamInviteToken(token)

  const { data: invite } = await client
    .from("folio_team_invites")
    .select("id, team_id, email, expires_at, accepted_at, revoked, team:folio_teams(name, slug, owner_id)")
    .eq("token_hash", tokenHash)
    .maybeSingle()

  if (!invite) {
    return res.status(404).json({ ok: false, error: "Invite not found" })
  }

  const team = Array.isArray(invite.team) ? invite.team[0] : invite.team

  if (!team || team.owner_id !== userId) {
    return res.status(403).json({ ok: false, error: "Only the team owner can send this invite" })
  }

  if (invite.revoked) {
    return res.status(400).json({ ok: false, error: "This invite has been revoked" })
  }

  if (invite.accepted_at) {
    return res.status(400).json({ ok: false, error: "This invite has already been used" })
  }

  if (new Date(invite.expires_at).getTime() <= Date.now()) {
    return res.status(400).json({ ok: false, error: "This invite has expired" })
  }

  if (!invite.email) {
    return res.status(400).json({ ok: false, error: "This invite has no email — share the invite link instead" })
  }

  const { data: inviter } = await client
    .from("profiles")
    .select("firstname, lastname, username")
    .eq("id", userId)
    .maybeSingle()

  const inviterName =
    [inviter?.firstname, inviter?.lastname].filter(Boolean).join(" ").trim() ||
    inviter?.username ||
    "A teammate"

  const inviteLink = `${getOrigin(req)}/invite/${token}`
  const expiresOn = new Date(invite.expires_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const outgoing: OutgoingEmail = {
    to: invite.email,
    subject: `${inviterName} invited you to join ${team.name} on folio`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #0f172a;">You've been invited to join ${team.name}</h2>
        <p>${inviterName} invited you to collaborate on the <strong>${team.name}</strong> team portfolio on folio.</p>
        <p>As a team member you can share your projects, skills, and experience directly on the team page — while keeping your own personal portfolio.</p>
        <p style="margin: 28px 0;">
          <a href="${inviteLink}" style="background: linear-gradient(90deg, #22d3ee, #14b8a6); color: #0f172a; padding: 12px 24px; border-radius: 12px; font-weight: bold; text-decoration: none; display: inline-block;">
            Accept invitation
          </a>
        </p>
        <p style="color: #64748b; font-size: 13px;">This invitation expires on ${expiresOn}.</p>
        <p style="color: #64748b; font-size: 13px;">If the button doesn't work, copy this link into your browser:<br />${inviteLink}</p>
        <hr style="border: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">You received this email because someone invited this address to a folio team. If you weren't expecting it, you can ignore it.</p>
      </div>
    `,
  }

  const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  const smtpResult = smtpConfigured ? await sendViaSmtp(outgoing) : { ok: false, error: "SMTP is not configured" }

  if (smtpResult.ok) {
    return res.status(200).json({ ok: true })
  }

  const resendResult = await sendViaResend(outgoing)

  if (resendResult.ok) {
    return res.status(200).json({ ok: true })
  }

  console.error("Team invite email failed:", { smtp: smtpResult.error, resend: resendResult.error })
  return res
    .status(502)
    .json({ ok: false, error: `Failed to send invite email (${smtpResult.error ?? resendResult.error ?? "unknown error"})` })
}

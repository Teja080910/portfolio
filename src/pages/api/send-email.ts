import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

type RequestBody = {
  name: string;
  email: string;
  subject: string;
  message: string;
  toEmail: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean; error?: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { name, email, subject, message, toEmail } = req.body as RequestBody;

  // Validate required fields
  if (!name || !email || !subject || !message || !toEmail) {
    return res.status(400).json({ success: false, error: 'All fields are required' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || !emailRegex.test(toEmail)) {
    return res.status(400).json({ success: false, error: 'Invalid email format' });
  }

  try {
    // Initialize Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send email
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Portfolio <onboarding@resend.dev>',
      to: [toEmail],
      replyTo: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>New Message from Portfolio</h2>
          <p><strong>From:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr style="border: 1px solid #e0e0e0; margin: 20px 0;" />
          <p>${message.replace(/\n/g, '<br>')}</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ success: false, error: 'Failed to send email. Please try again later.' });
    }

    console.log('Email sent successfully:', data);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to send email. Please try again later.' 
    });
  }
}

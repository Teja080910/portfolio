# Email Configuration Guide

## Overview
The portfolio now supports sending messages to any email address using Resend. Visitors can fill out a contact form and send messages directly to any email address they specify.

## Setup Instructions

### 1. Get Your Resend API Key

1. Go to [Resend.com](https://resend.com)
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Copy your API key

### 2. Configure Environment Variables

Create a `.env.local` file in the root of your project (if it doesn't exist):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Resend Email API
RESEND_API_KEY=re_your_resend_api_key_here
RESEND_FROM_EMAIL=your_verified_email@yourdomain.com
```

### 3. Verify Your Email Domain in Resend

1. In Resend dashboard, go to **Domains**
2. Add your domain or use a verified Resend domain
3. Follow the DNS verification steps
4. Once verified, you can send emails from that domain

### 4. Test the Contact Form

1. Start your development server: `npm run dev`
2. Navigate to your portfolio
3. Fill out the contact form:
   - **Name**: Your name
   - **Email**: Your email address (reply-to address)
   - **Recipient Email**: The email address you want to send the message to
   - **Subject**: Message subject
   - **Message**: Your message content
4. Click "Send Message"

## Features

- ✅ Send messages to any email address
- ✅ Reply-to functionality (recipient can reply directly to sender)
- ✅ Beautiful HTML email templates
- ✅ Form validation
- ✅ Error handling
- ✅ Success feedback

## Security Notes

- All email addresses are validated for proper format
- API endpoint only accepts POST requests
- Environment variables are kept secure (not exposed to client)
- Rate limiting should be added for production use

## Production Considerations

Before deploying to production:

1. **Add Rate Limiting**: Prevent spam by limiting requests per IP
2. **Add CAPTCHA**: Consider adding reCAPTCHA or similar
3. **Logging**: Implement proper logging for sent emails
4. **Error Monitoring**: Set up error tracking (e.g., Sentry)
5. **Email Templates**: Customize the email template for your brand

## Troubleshooting

### Email Not Sending

1. Check your Resend API key is correct
2. Verify your domain/email in Resend dashboard
3. Check the browser console for errors
4. Check server logs for detailed error messages

### Validation Errors

- Ensure all required fields are filled
- Email addresses must be in valid format (e.g., user@example.com)
- Message must be at least 10 characters
- Subject must be at least 5 characters

## API Endpoint

The contact form uses the `/api/send-email` endpoint which accepts:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "toEmail": "recipient@example.com",
  "subject": "Project Inquiry",
  "message": "Hello, I'd like to discuss a project..."
}
```

Returns:
```json
{
  "success": true
}
```

Or on error:
```json
{
  "success": false,
  "error": "Error message here"
}
```

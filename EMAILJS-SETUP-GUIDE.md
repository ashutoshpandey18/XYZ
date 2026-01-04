# EmailJS Template Configuration Guide

## Current Setup
- Service ID: `service_j5b5n9l`
- Public Key: `OB8zWyOp1gGkNwZcO`
- Template ID: `template_99rui32`

## Template Configuration for College Email Issuance

Your EmailJS template (`template_99rui32`) should have the following structure:

### Template Variables:
- `{{to_name}}` - Student's name
- `{{to_email}}` - Student's email (recipient)
- `{{from_name}}` - Sender name (College Email SaaS)
- `{{subject}}` - Email subject
- `{{message}}` - Email message content

### Recommended Template HTML:
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #10B981;
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
        }
        .content {
            background-color: white;
            padding: 30px;
            border: 1px solid #E5E7EB;
            border-radius: 0 0 8px 8px;
        }
        .credentials {
            background-color: #F3F4F6;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            color: #6B7280;
            font-size: 12px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>🎓 {{subject}}</h2>
        </div>
        <div class="content">
            <p>Hi {{to_name}},</p>
            <p style="white-space: pre-line;">{{message}}</p>
            <div class="footer">
                <p>Best regards,<br>{{from_name}}</p>
                <p>This is an automated email. Please do not reply.</p>
            </div>
        </div>
    </div>
</body>
</html>
```

### Template Settings:
1. **To Email**: Use `{{to_email}}` variable
2. **From Name**: Use `{{from_name}}` or set a fixed name
3. **Subject**: Use `{{subject}}`
4. **Content**: Use the HTML template above

## Testing the EmailJS Integration

Run the test script:
```bash
cd frontend
npm run dev
```

Then test by:
1. Login as admin
2. Approve a student request
3. Click "Issue College Email"
4. Student should receive email with credentials via EmailJS

## Email Delivery Flow

1. Admin clicks "Issue College Email" button
2. Frontend calls backend API to generate credentials
3. Backend returns: `{ collegeEmail, tempPassword }`
4. Frontend sends email via EmailJS with credentials
5. Student receives email with college email and password

## Troubleshooting

### If emails don't send:
1. Check EmailJS dashboard for failed sends
2. Verify template ID matches: `template_99rui32`
3. Check browser console for errors
4. Ensure recipient email is valid
5. Check EmailJS free tier limits (200 emails/month)

### Common Issues:
- **Template not found**: Update VITE_EMAILJS_TEMPLATE_ID in .env
- **Service error**: Verify service is connected to email provider
- **Public key invalid**: Check VITE_EMAILJS_PUBLIC_KEY in .env
- **Rate limit**: EmailJS free tier is 200 emails/month

## Environment Variables

Make sure these are set in `frontend/.env`:
```env
VITE_EMAILJS_SERVICE_ID=service_j5b5n9l
VITE_EMAILJS_PUBLIC_KEY=OB8zWyOp1gGkNwZcO
VITE_EMAILJS_TEMPLATE_ID=template_99rui32
VITE_API_URL=https://xyz-production-b23d.up.railway.app
```

## Next Steps

1. Verify template in EmailJS dashboard
2. Test email sending from admin dashboard
3. Deploy frontend to Vercel with updated code
4. Monitor EmailJS dashboard for delivery status

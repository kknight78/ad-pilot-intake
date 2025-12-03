# Ad Pilot Client Intake Form

A professional intake form for onboarding new Ad Pilot clients. Designed for sales reps to complete during or after client meetings.

## Live URL
- **Production**: https://intake.ad-pilot.ai
- **GitHub Pages**: https://kellyknights.github.io/ad-pilot-intake

## Features

- **8-Section Multi-Step Form**: Clean navigation with progress tracking
- **File Uploads**: Cloudinary integration for documents and images
- **Google Sheets Integration**: All submissions saved automatically
- **Email Notifications**: Eric and Kelly notified on new submissions
- **Auto-Generated Client IDs**: Format: ADP-YYMM-XXX
- **Mobile-Friendly**: Fully responsive design
- **Validation**: Required field enforcement with visual feedback

## Form Sections

1. **Business Info**: Name, address, phone, website, industry
2. **Platforms**: Selected platforms with status indicators (Green/Yellow/Red)
3. **Portal Access**: Primary contact and additional users
4. **Verification Docs**: Business license, owner ID uploads
5. **Brand Assets**: Logo, colors, tagline, photos
6. **Avatar People**: Repeatable section for video talent
7. **Plan & Pricing**: Plan selection with auto-calculated onboarding cost
8. **Eric's Notes**: Meeting notes, follow-ups, red flags

## Technical Setup

### Backend (n8n)
- **Workflow**: "Client Intake Handler" (ID: fQN528uM15TWbJZQ)
- **Webhook URL**: https://kelly-ads.app.n8n.cloud/webhook/client-intake
- **Google Sheet**: Set `CLIENT_INTAKE_SHEET_ID` environment variable

### File Uploads (Cloudinary)
1. Create a Cloudinary account if needed
2. Create an unsigned upload preset named `intake_unsigned`
3. Set the folder to `intake`
4. Update `CLOUDINARY_UPLOAD_URL` in app.js with your cloud name

### Email Notifications
Configure SMTP credentials in n8n for email notifications.

## Local Development

```bash
# Clone the repo
git clone https://github.com/kellyknights/ad-pilot-intake.git
cd ad-pilot-intake

# Serve locally (use any static server)
npx serve .
# or
python -m http.server 8000
```

## Deployment

The site is deployed via GitHub Pages from the `main` branch.

### Custom Domain Setup (intake.ad-pilot.ai)
1. Add CNAME file with `intake.ad-pilot.ai`
2. Configure DNS: CNAME record pointing to `kellyknights.github.io`
3. Enable HTTPS in GitHub Pages settings

## Google Sheets Structure

Create a sheet named "Client Intake" with a tab called "Submissions" with these columns:

| Column | Description |
|--------|-------------|
| clientId | Auto-generated ID (ADP-YYMM-XXX) |
| timestamp | Submission date/time |
| businessName | Business name |
| businessAddress | Full address |
| businessPhone | Phone number |
| websiteUrl | Website URL |
| socialHandle | Desired social handle |
| industry | Industry type |
| platforms | Comma-separated platform list |
| platformStatuses | JSON object of status per platform |
| platformEmail | Email for platform accounts |
| platformNotes | Notes on platform situation |
| primaryContactName | Main contact name |
| primaryContactEmail | Main contact email |
| primaryContactPhone | Main contact phone |
| additionalUsers | JSON array of additional users |
| ownerName | Owner name as on ID |
| businessLicenseUrl | Cloudinary URL |
| ownerIdFrontUrl | Cloudinary URL |
| ownerIdBackUrl | Cloudinary URL |
| logoUrl | Cloudinary URL |
| brandColors | Hex codes or notes |
| tagline | Business tagline |
| exteriorPhotoUrl | Cloudinary URL |
| interiorPhotoUrl | Cloudinary URL |
| otherPhotosUrls | Comma-separated URLs |
| avatarPeople | JSON array of people |
| selectedPlan | Plan name and price |
| addons | Comma-separated addons |
| onboardingComplexity | Green/Yellow/Red |
| onboardingTotal | Dollar amount |
| meetingNotes | Free text |
| followUpItems | Free text |
| redFlags | Free text |

## File Structure

```
ad-pilot-intake/
├── index.html          # Main form page
├── css/
│   └── styles.css      # All styling
├── js/
│   └── app.js          # Form logic & API calls
├── assets/             # Static assets
├── CNAME               # Custom domain config
├── n8n-workflow.json   # Workflow backup
└── README.md
```

## Support

Contact: kelly@ad-pilot.ai

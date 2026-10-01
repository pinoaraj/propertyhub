# OAuth Configuration Guide

## Google Cloud Console

### 1. Create Project
1. Go to https://console.cloud.google.com
2. Click **New Project**
3. Name: `propertyhub`
4. Click **Create**

### 2. Configure OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** → **Create**
3. Fill:
   - App name: `PropertyHub`
   - User support email: your email
   - Developer contact email: your email
4. Click **Save and Continue**

### 3. Add Scopes
1. Click **Add or Remove Scopes**
2. Add:
   - `openid`
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/calendar.events`
3. Click **Save and Continue**

### 4. Create Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: `PropertyHub Web`
5. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://propertyhub-qximg82fq-pino25.vercel.app/api/auth/callback/google`
6. Click **Create**
7. Copy **Client ID** and **Client Secret**

---

## Microsoft Azure Portal

### 1. Register App
1. Go to https://portal.azure.com
2. Search for **Microsoft Entra ID** (formerly Azure AD)
3. Go to **App registrations** → **New registration**
4. Fill:
   - Name: `PropertyHub`
   - Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
   - Redirect URI: **Web** → `http://localhost:3000/api/auth/callback/microsoft-entra-id`
5. Click **Register**

### 2. Add Redirect URIs
1. Go to **Authentication** → **Add a platform** → **Web**
2. Add:
   - `http://localhost:3000/api/auth/callback/microsoft-entra-id`
   - `https://propertyhub-qximg82fq-pino25.vercel.app/api/auth/callback/microsoft-entra-id`
3. Click **Configure**

### 3. Add API Permissions
1. Go to **API permissions** → **Add a permission**
2. Select **Microsoft Graph** → **Delegated permissions**
3. Add:
   - `openid`
   - `email`
   - `profile`
   - `offline_access`
   - `Calendars.ReadWrite`
4. Click **Grant admin consent** (if you have admin access)

### 4. Create Client Secret
1. Go to **Certificates & secrets** → **New client secret**
2. Description: `PropertyHub Secret`
3. Expires: **24 months**
4. Click **Add**
5. Copy **Value** (the secret)

### 5. Get Tenant ID
1. Go to **Overview**
2. Copy **Directory (tenant) ID**
3. If using multi-tenant, set to `common`

---

## Environment Variables

Add to `.env` and Vercel:

```env
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"

MICROSOFT_CLIENT_ID="xxx-xxx-xxx"
MICROSOFT_CLIENT_SECRET="xxx"
MICROSOFT_TENANT_ID="common"
```

---

## Testing OAuth

1. Run `npm run dev`
2. Go to http://localhost:3000/login
3. Click **Google** → should redirect to Google login
4. Click **Microsoft** → should redirect to Microsoft login
5. After login, check **Settings** → **Calendar Connections**
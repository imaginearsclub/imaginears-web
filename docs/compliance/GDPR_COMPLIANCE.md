# GDPR Compliance Guide

## Overview

This document outlines how Imaginears Club implements GDPR (General Data Protection Regulation) compliance features to protect user privacy and data rights.

**Last Updated:** October 25, 2025

---

## Table of Contents

1. [Features Implemented](#features-implemented)
2. [User Rights](#user-rights)
3. [Cookie Consent](#cookie-consent)
4. [Data Export](#data-export)
5. [Account Deletion](#account-deletion)
6. [Data Retention](#data-retention)
7. [Security Measures](#security-measures)
8. [Developer Guide](#developer-guide)

---

## Features Implemented

### ✅ Cookie Consent Banner
- **Location:** `components/common/CookieConsent.tsx`
- **Features:**
  - First-time visitor consent prompt
  - Granular cookie preferences (Necessary, Analytics, Marketing)
  - Persistent storage of user preferences
  - Easy access to Privacy Policy and Terms of Service

### ✅ Privacy Policy
- **Route:** `/privacy`
- **File:** `app/privacy/page.tsx`
- **Content:**
  - Data controller information
  - Types of data collected
  - Legal basis for processing (GDPR Article 6)
  - User rights under GDPR
  - Data retention policies
  - Security measures
  - Cookie policy
  - Contact information

### ✅ Terms of Service
- **Route:** `/terms`
- **File:** `app/terms/page.tsx`
- **Content:**
  - Service usage terms
  - Community rules
  - Intellectual property
  - Liability limitations
  - Governing law

### ✅ Data Export
- **API:** `/api/user/export`
- **Method:** GET
- **Format:** JSON
- **Includes:**
  - User profile data
  - Account information (sanitized)
  - Activity history
  - Created/updated content
  - Sessions (IP addresses partial for privacy)
- **Excludes:**
  - Encrypted passwords
  - 2FA secrets
  - OAuth tokens

### ✅ Account Deletion
- **API:** `/api/user/delete`
- **Method:** POST
- **Features:**
  - Password verification (if applicable)
  - Confirmation text requirement
  - Cascade deletion of all related data
  - Permanent and irreversible

### ✅ User Profile Privacy Section
- **Location:** `app/profile/components/GDPRDataManagement.tsx`
- **Features:**
  - One-click data export
  - Account deletion with safeguards
  - Privacy rights information
  - Contact details for privacy concerns

---

## User Rights (GDPR Articles 15-22)

### 1. Right to Access (Article 15)
**Implementation:** Data export feature
- Users can download all their personal data
- Provided in machine-readable JSON format
- Available via profile settings

### 2. Right to Rectification (Article 16)
**Implementation:** Profile settings
- Users can update their profile information
- Email, name, timezone, preferences
- Real-time updates

### 3. Right to Erasure / "Right to be Forgotten" (Article 17)
**Implementation:** Account deletion
- Complete data purge
- Cascade deletion of related records
- 30-day retention only for legal compliance

### 4. Right to Restriction of Processing (Article 18)
**Implementation:** Account suspension
- Users can request processing restriction
- Contact privacy@imaginears.club

### 5. Right to Data Portability (Article 20)
**Implementation:** Data export
- JSON format (machine-readable)
- Includes all personal data
- Easy re-import capability

### 6. Right to Object (Article 21)
**Implementation:** Cookie preferences
- Opt-out of analytics
- Opt-out of marketing
- Essential cookies only option

### 7. Rights Related to Automated Decision Making (Article 22)
**Implementation:** Not applicable
- We don't use automated decision-making or profiling

---

## Cookie Consent

### Cookie Categories

#### 1. Necessary Cookies
- **Purpose:** Essential for website functionality
- **Consent:** Not required (legitimate interest)
- **Examples:**
  - Session authentication
  - CSRF protection
  - Theme preferences
- **Cannot be disabled**

#### 2. Analytics Cookies
- **Purpose:** Understand usage patterns
- **Consent:** Required (opt-in)
- **Examples:**
  - Page views
  - User flows
  - Performance metrics
- **Can be disabled**

#### 3. Marketing Cookies
- **Purpose:** Personalized content
- **Consent:** Required (opt-in)
- **Examples:**
  - Ad targeting
  - Campaign tracking
- **Can be disabled**

### Implementation Details

```typescript
// Cookie consent stored in localStorage
{
  necessary: true,  // Always true
  analytics: boolean,
  marketing: boolean
}
```

### Events

```typescript
// Listen for consent changes
window.addEventListener('cookieConsentChanged', (event) => {
  const preferences = event.detail;
  // Initialize/destroy analytics/marketing scripts
});
```

---

## Data Export

### What's Included

```json
{
  "id": "user_id",
  "name": "User Name",
  "email": "user@example.com",
  "minecraftName": "MinecraftUser",
  "timezone": "America/New_York",
  "role": "USER",
  "emailVerified": true,
  "twoFactorEnabled": false,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-10-25T00:00:00.000Z",
  "accounts": [...],
  "sessions": [...],
  "createdEvents": [...],
  "updatedEvents": [...],
  "createdApplications": [...],
  "updatedApplications": [...],
  "exportedAt": "2025-10-25T00:00:00.000Z",
  "exportFormat": "JSON",
  "gdprCompliance": true
}
```

### Sensitive Data Handling

**Excluded from export:**
- Encrypted passwords
- 2FA secrets
- Backup codes
- OAuth tokens/refresh tokens
- Full IP addresses (partial only)

**Reasoning:** These are security credentials that should never be exported, even to the user.

---

## Account Deletion

### Process Flow

1. **User initiates deletion** (Profile → Privacy & Data → Delete Account)
2. **Confirmation dialog** with warnings
3. **Password verification** (if password-based account)
4. **Confirmation text** ("DELETE MY ACCOUNT")
5. **Cascade deletion** of all related data
6. **Session termination**
7. **Redirect to home**

### What Gets Deleted

- ✅ User profile
- ✅ Account credentials
- ✅ Sessions
- ✅ Preferences
- ✅ Activity history
- ✅ Created content metadata (events, applications)
- ✅ Linked accounts (Discord, etc.)

### Cascade Delete Configuration

```prisma
// prisma/schema.prisma
model User {
  accounts      Account[]
  sessions      Session[]
  // All relations use onDelete: Cascade
}
```

### Retention Policy

**Immediate deletion:**
- User profile data
- Preferences and settings
- Active sessions

**30-day retention** (if required by law):
- Financial records
- Audit logs (anonymized)

---

## Data Retention

### Active Accounts
- Data retained as long as account is active
- Regular cleanup of expired sessions (automatic)

### Deleted Accounts
- Immediate purge of personal data
- 30 days for legal compliance records
- Anonymized statistics retained indefinitely

### Sessions
- Expire based on `expiresAt` field
- Automatic cleanup via cron/background job
- Immediate deletion on logout

---

## Security Measures

### Data Protection

1. **Encryption in Transit**
   - HTTPS/TLS for all connections
   - Secure WebSocket connections

2. **Encryption at Rest**
   - Password hashing (bcrypt, cost factor 10)
   - 2FA secrets encrypted (AES-256)
   - Database encryption at infrastructure level

3. **Access Controls**
   - Role-based access control (RBAC)
   - Session-based authentication
   - CSRF protection
   - Rate limiting

4. **Security Headers**
   - X-Frame-Options: SAMEORIGIN
   - X-Content-Type-Options: nosniff
   - X-XSS-Protection: 1; mode=block

### Compliance Measures

1. **Data Minimization**
   - Only collect necessary data
   - Clear purpose for each field

2. **Purpose Limitation**
   - Data used only for stated purposes
   - No selling of data

3. **Storage Limitation**
   - Automatic cleanup of old data
   - Clear retention policies

4. **Integrity and Confidentiality**
   - Regular security audits
   - Monitoring and logging
   - Incident response procedures

---

## Developer Guide

### Adding New Data Collection

When adding features that collect user data:

1. **Update Privacy Policy** (`app/privacy/page.tsx`)
   - Add to "Information We Collect"
   - Specify legal basis
   - Update retention policy

2. **Update Data Export** (`app/api/user/export/route.ts`)
   - Include new data in export
   - Sanitize sensitive fields

3. **Update Account Deletion** (if needed)
   - Ensure cascade delete works
   - Test data purge

4. **Cookie Consent** (if tracking)
   - Add to appropriate category
   - Request consent if needed

### Testing GDPR Features

```bash
# Test data export
curl -H "Cookie: auth_token=XXX" http://localhost:3000/api/user/export

# Test account deletion
curl -X POST http://localhost:3000/api/user/delete \
  -H "Cookie: auth_token=XXX" \
  -H "Content-Type: application/json" \
  -d '{"password":"test","confirmText":"DELETE MY ACCOUNT"}'
```

### Compliance Checklist

- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] Cookie consent implemented
- [ ] Data export includes new data
- [ ] Account deletion purges new data
- [ ] Sensitive data encrypted
- [ ] Access controls implemented
- [ ] Audit logging added
- [ ] User rights documented
- [ ] Data retention policy defined

---

## Contact Information

For privacy-related inquiries:

- **Email:** privacy@imaginears.club
- **Response Time:** Within 30 days (GDPR requirement)
- **Data Protection Officer:** [To be assigned]

---

## Legal References

- **GDPR:** Regulation (EU) 2016/679
- **ePrivacy Directive:** Directive 2002/58/EC
- **CCPA:** California Consumer Privacy Act (US)
- **COPPA:** Children's Online Privacy Protection Act (US)

---

## Changelog

### October 25, 2025
- ✅ Initial GDPR implementation
- ✅ Cookie consent banner
- ✅ Privacy policy page
- ✅ Terms of service page
- ✅ Data export functionality
- ✅ Account deletion with data purge
- ✅ GDPR section in user profile

### Future Enhancements
- [ ] Cookie preference management in profile
- [ ] Automated data retention cleanup
- [ ] Enhanced audit logging
- [ ] Data breach notification system
- [ ] Consent management API
- [ ] Multi-language support for legal pages

---

## Notes for Compliance

This implementation provides a solid foundation for GDPR compliance. However:

⚠️ **Consult with legal counsel** to ensure full compliance with your specific jurisdiction and use case.

⚠️ **Regular audits** should be conducted to maintain compliance as regulations evolve.

⚠️ **Update legal documents** annually or when services change significantly.

⚠️ **Staff training** on data protection principles and user rights is essential.

---

**Document Version:** 1.0  
**Last Review:** October 25, 2025  
**Next Review Due:** April 25, 2026


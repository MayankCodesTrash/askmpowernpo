// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE SHEETS CONFIGURATION (via Apps Script Web App)
// ─────────────────────────────────────────────────────────────────────────────
// HOW TO SET UP:
// 1. Go to script.google.com → New project
// 2. Paste the doPost() script from the setup instructions
// 3. Deploy → New deployment → Web app
//    - Execute as: Me
//    - Who has access: Anyone
// 4. Copy the Web App URL and paste it below
// ─────────────────────────────────────────────────────────────────────────────

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx_xFhcP0JtrN3J6om2pKGCxWj4v5OtDGXK3_s5y9K3IF2-u3WqmxdP5V-X-cz0ief6/exec'

export const STUDENT_FORM = {
  sheetName: 'Students',
}

export const MENTOR_FORM = {
  sheetName: 'Mentors',
}

// Submits data to Google Sheets via Apps Script Web App.
export async function submitToGoogleForm(formConfig, data) {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.startsWith('PASTE')) return

  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ sheet: formConfig.sheetName, fields: data }),
    })
  } catch {
    // Silent fail — Firestore always saves regardless
  }
}

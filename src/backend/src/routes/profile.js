// src/routes/profile.js
import { Router } from 'express'
import { db }     from '../config.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

/* ══════════════════════════════════════════════════════════════════
   GENDER OPTIONS VALIDATION
   Must match frontend GENDER_OPTIONS constant
══════════════════════════════════════════════════════════════════ */
const VALID_GENDERS = ['male', 'female', 'non-binary', 'prefer-not-to-say']

/* ══════════════════════════════════════════════════════════════════
   HELPER — generate ordered username candidates from name parts
   Priority mirrors how companies like GitHub / Linear generate slugs:
     1. firstnamelastname          → johndoe
     2. firstname_lastname         → john_doe
     3. firstinitial + lastname    → jdoe
     4. firstname + last initial   → johnd
     5. firstname + 2-digit random → john42
     6. full + 2-digit random      → johndoe42
   All lowercased, special chars stripped, max 20 chars.
══════════════════════════════════════════════════════════════════ */
function buildCandidates(firstName, lastName) {
  const clean = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15)
  const f = clean(firstName)
  const l = clean(lastName)
  const n = Math.floor(Math.random() * 90 + 10)   // 10–99

  const candidates = []
  if (f && l) {
    candidates.push(`${f}${l}`.slice(0, 20))
    candidates.push(`${f}_${l}`.slice(0, 20))
    candidates.push(`${f[0]}${l}`.slice(0, 20))
    candidates.push(`${f}${l[0]}`.slice(0, 20))
    candidates.push(`${f}${n}`)
    candidates.push(`${f}${l}${n}`.slice(0, 20))
  } else if (f) {
    candidates.push(f)
    candidates.push(`${f}${n}`)
    candidates.push(`${f}_${n}`)
  }

  /* deduplicate while preserving order */
  return [...new Set(candidates)]
}

/* ══════════════════════════════════════════════════════════════════
   HELPER — validate and normalize form input
══════════════════════════════════════════════════════════════════ */
function validateProfileInput(data) {
  const errors = {}

  /* First name validation */
  if (!data.firstName?.trim()) {
    errors.firstName = 'First name is required'
  } else if (data.firstName.trim().length < 2) {
    errors.firstName = 'First name must be at least 2 characters'
  }

  /* Last name validation */
  if (!data.lastName?.trim()) {
    errors.lastName = 'Last name is required'
  } else if (data.lastName.trim().length < 2) {
    errors.lastName = 'Last name must be at least 2 characters'
  }

  /* Username validation */
  if (!data.username?.trim()) {
    errors.username = 'Username is required'
  } else if (!/^[a-zA-Z0-9_.]{3,20}$/.test(data.username.trim())) {
    errors.username = 'Username must be 3-20 characters with only letters, numbers, _ and .'
  }

  /* Gender validation — REQUIRED */
  if (!data.gender?.trim()) {
    errors.gender = 'Gender is required'
  } else if (!VALID_GENDERS.includes(data.gender.toLowerCase())) {
    errors.gender = `Invalid gender. Must be one of: ${VALID_GENDERS.join(', ')}`
  }

  /* Date of birth validation */
  if (!data.dob) {
    errors.dob = 'Date of birth is required'
  } else {
    const dobDate = new Date(data.dob)
    if (isNaN(dobDate.getTime())) {
      errors.dob = 'Invalid date format'
    } else if (dobDate > new Date()) {
      errors.dob = 'Date of birth cannot be in the future'
    } else {
      const age = new Date().getFullYear() - dobDate.getFullYear()
      if (age < 13) {
        errors.dob = 'You must be at least 13 years old'
      }
    }
  }

  /* Occupation validation */
  if (!data.occupation?.trim()) {
    errors.occupation = 'Occupation is required'
  } else if (data.occupation.trim().length < 2) {
    errors.occupation = 'Occupation must be at least 2 characters'
  }

  /* Investment experience validation */
  if (!data.investmentExperience) {
    errors.investmentExperience = 'Investment experience is required'
  } else {
    const validExperience = ['limited', 'moderate', 'extensive']
    if (!validExperience.includes(data.investmentExperience)) {
      errors.investmentExperience = `Must be one of: ${validExperience.join(', ')}`
    }
  }

  /* Phone validation (optional) */
  if (data.phone && data.phone.length < 8) {
    errors.phone = 'Phone number is invalid'
  }

  /* Bio validation (optional) */
  if (data.bio && data.bio.length > 160) {
    errors.bio = 'Bio must be 160 characters or less'
  }

  /* Website validation (optional) */
  if (data.website) {
    try {
      new URL(data.website)
    } catch {
      errors.website = 'Invalid URL format'
    }
  }

  return errors
}

/* ══════════════════════════════════════════════════════════════════
   GET /api/profile/check-username?u=johndoe
   Public — used by frontend while user is typing / on mount.
   Returns { available: bool, suggestion?: string }
══════════════════════════════════════════════════════════════════ */
router.get('/check-username', async (req, res) => {
  const username = (req.query.u || '').toLowerCase().trim()

  if (!username || username.length < 3)
    return res.status(400).json({ available: false, message: 'Username must be at least 3 characters.' })
  if (!/^[a-zA-Z0-9_.]{3,20}$/.test(username))
    return res.status(400).json({ available: false, message: 'Only letters, numbers, _ and . allowed (3–20 chars).' })

  try {
    const [[row]] = await db.execute(
      'SELECT user_id FROM profiles WHERE username = ?', [username]
    )
    return res.json({ available: !row })
  } catch (err) {
    console.error('Username check error:', err.message)
    return res.status(500).json({ available: false })
  }
})

/* ══════════════════════════════════════════════════════════════════
   GET /api/profile/suggest-username?first=John&last=Doe
   Public — called on mount to pre-fill username field.
   Walks the candidate list until it finds one not in the DB.
══════════════════════════════════════════════════════════════════ */
router.get('/suggest-username', async (req, res) => {
  const first = (req.query.first || '').trim()
  const last  = (req.query.last  || '').trim()

  if (!first)
    return res.status(400).json({ message: 'First name is required.' })

  try {
    const candidates = buildCandidates(first, last)

    for (const candidate of candidates) {
      const [[row]] = await db.execute(
        'SELECT user_id FROM profiles WHERE username = ?', [candidate]
      )
      if (!row) return res.json({ username: candidate })
    }

    /* all candidates taken — append timestamp suffix as last resort */
    const fallback = `${candidates[0]}${Date.now().toString().slice(-4)}`
    return res.json({ username: fallback.slice(0, 20) })

  } catch (err) {
    console.error('Suggest username error:', err.message)
    return res.status(500).json({ message: 'Could not generate username.' })
  }
})

/* ══════════════════════════════════════════════════════════════════
   POST /api/profile/create
   Protected — requires Bearer token.
   Body: all CreateProfile form fields including gender.
   Saves to profiles table, updates users table with plan/risk.
══════════════════════════════════════════════════════════════════ */
router.post('/create', requireAuth, async (req, res) => {
  const userId = req.userId

  const {
    /* identity */
    firstName, lastName, username, bio,
    avatarUrl,
    /* contact */
    email, phone, dob, gender,
    /* address */
    address, apt, city, state, zip, country,
    /* investor profile */
    occupation, investmentExperience, investmentGoal,
    website,
  } = req.body

  /* ── comprehensive validation ── */
  const validationErrors = validateProfileInput({
    firstName,
    lastName,
    username,
    dob,
    gender,
    occupation,
    investmentExperience,
    bio,
    phone,
    website,
  })

  if (Object.keys(validationErrors).length > 0) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: validationErrors,
    })
  }

  try {
    /* ── username uniqueness (excluding current user's own row) ── */
    const [[existing]] = await db.execute(
      'SELECT user_id FROM profiles WHERE username = ? AND user_id != ?',
      [username.toLowerCase(), userId]
    )
    if (existing)
      return res.status(409).json({
        message: 'That username is already taken.',
        field:   'username',
      })

    /* ── parse DOB safely ── */
    const dobValue = dob ? new Date(dob) : null
    const dobSql   = dobValue && !isNaN(dobValue) ? dobValue : null

    /* ── normalize gender to lowercase ── */
    const normalizedGender = gender.toLowerCase().trim()

    /* ── update profiles row (created as stub during register) ── */
    await db.execute(
      `UPDATE profiles SET
         first_name      = ?,
         last_name       = ?,
         username        = ?,
         display_name    = ?,
         bio             = ?,
         avatar_url      = ?,
         avatar_type     = ?,
         date_of_birth   = ?,
         gender          = ?,
         phone           = ?,
         address_line1   = ?,
         address_line2   = ?,
         city            = ?,
         state           = ?,
         zip             = ?,
         country         = ?,
         website         = ?,
         occupation      = ?,
         investment_experience = ?,
         investment_goal = ?,
         updated_at      = NOW()
       WHERE user_id = ?`,
      [
        firstName.trim(),
        lastName.trim(),
        username.toLowerCase().trim(),
        `${firstName.trim()} ${lastName.trim()}`,
        bio?.trim() || null,
        avatarUrl || null,
        avatarUrl?.startsWith('data:') ? 'upload' : 'preset',
        dobSql,
        normalizedGender,
        phone || null,
        address?.trim() || null,
        apt?.trim()     || null,
        city?.trim()    || null,
        state?.trim()   || null,
        zip?.trim()     || null,
        country?.trim() || null,
        website?.trim() || null,
        occupation?.trim()   || null,
        investmentExperience || null,
        investmentGoal       || null,
        userId,
      ]
    )

    /* ── update email if provided (shouldn't change but keeps in sync) ── */
    if (email) {
      await db.execute(
        'UPDATE users SET updated_at = NOW() WHERE id = ?', [userId]
      )
    }

    return res.status(200).json({
      message:   'Profile saved successfully.',
      nextStep:  'onboard',
      firstName: firstName.trim(),
      lastName:  lastName.trim(),
    })

  } catch (err) {
    console.error('Profile create error:', err.message)
    return res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
})

/* ══════════════════════════════════════════════════════════════════
   GET /api/profile/me
   Protected — returns current user's profile including gender.
══════════════════════════════════════════════════════════════════ */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [[profile]] = await db.execute(
      `SELECT p.*, u.email, u.plan, u.risk_profile, u.is_verified, u.onboarding_complete
       FROM profiles p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = ?`,
      [req.userId]
    )
    if (!profile)
      return res.status(404).json({ message: 'Profile not found.' })

    const PROFILE_REQUIRED = [
      'first_name','last_name','username','gender','date_of_birth',
      'address_line1','city','state','zip','country',
      'occupation','investment_experience',
    ]
    const profileComplete = PROFILE_REQUIRED.every(f => !!profile[f])

    return res.json({ profile, profileComplete })
  } catch (err) {
    console.error('Profile fetch error:', err.message)
    return res.status(500).json({ message: 'Could not fetch profile.' })
  }
})
/* ── PUT /api/profile/update ─────────────────────────────────────
   Partial profile update — only supplied fields are changed.
   Used by Settings page.
──────────────────────────────────────────────────────────────── */
router.put('/update', requireAuth, async (req, res) => {
  try {
    const userId = req.userId
    const {
      first_name, last_name, display_name, username, phone, phone_country,
      bio, avatar_url, date_of_birth, gender,
      address_line1, address_line2, city, state, zip, country, country_code,
      occupation, investment_experience, investment_goal, website,
    } = req.body

    const [[existing]] = await db.execute(
      'SELECT id FROM profiles WHERE user_id = ?', [userId]
    )
    if (!existing)
      return res.status(404).json({ message: 'Profile not found. Create a profile first.' })

    // Build dynamic SET clause from only provided fields
    const fields = []
    const vals   = []

    if (first_name        !== undefined) { fields.push('first_name = ?');        vals.push(first_name.trim())                             }
    if (last_name         !== undefined) { fields.push('last_name = ?');         vals.push(last_name.trim())                              }
    if (display_name      !== undefined) { fields.push('display_name = ?');      vals.push(display_name?.trim() || null)                  }
    if (phone             !== undefined) { fields.push('phone = ?');             vals.push(phone || null)                                 }
    if (phone_country     !== undefined) { fields.push('phone_country = ?');     vals.push(phone_country || null)                         }
    if (bio               !== undefined) { fields.push('bio = ?');               vals.push(bio?.trim() || null)                           }
    if (avatar_url        !== undefined) {
      fields.push('avatar_url = ?');  vals.push(avatar_url || null)
      fields.push('avatar_type = ?'); vals.push(avatar_url && avatar_url.startsWith('data:') ? 'upload' : 'preset')
    }
    if (date_of_birth     !== undefined) { fields.push('date_of_birth = ?');     vals.push(date_of_birth ? new Date(date_of_birth) : null) }
    if (gender            !== undefined) { fields.push('gender = ?');            vals.push(gender ? gender.toLowerCase().trim() : null)   }
    if (address_line1     !== undefined) { fields.push('address_line1 = ?');     vals.push(address_line1 || null)                         }
    if (address_line2     !== undefined) { fields.push('address_line2 = ?');     vals.push(address_line2 || null)                         }
    if (city              !== undefined) { fields.push('city = ?');              vals.push(city || null)                                  }
    if (state             !== undefined) { fields.push('state = ?');             vals.push(state || null)                                 }
    if (zip               !== undefined) { fields.push('zip = ?');               vals.push(zip || null)                                   }
    if (country           !== undefined) { fields.push('country = ?');           vals.push(country || null)                               }
    if (country_code      !== undefined) { fields.push('country_code = ?');      vals.push(country_code || null)                          }
    if (occupation        !== undefined) { fields.push('occupation = ?');        vals.push(occupation || null)                            }
    if (investment_experience !== undefined) { fields.push('investment_experience = ?'); vals.push(investment_experience || null)          }
    if (investment_goal   !== undefined) { fields.push('investment_goal = ?');   vals.push(investment_goal || null)                       }
    if (website           !== undefined) { fields.push('website = ?');           vals.push(website || null)                               }

    if (username !== undefined) {
      const [[taken]] = await db.execute(
        'SELECT id FROM profiles WHERE username = ? AND user_id != ?',
        [username.toLowerCase().trim(), userId]
      )
      if (taken) return res.status(409).json({ message: 'Username already taken.' })
      fields.push('username = ?')
      vals.push(username.toLowerCase().trim())
    }

    if (fields.length === 0)
      return res.status(400).json({ message: 'No fields to update.' })

    fields.push('updated_at = NOW()')
    vals.push(userId)

    await db.execute(
      `UPDATE profiles SET ${fields.join(', ')} WHERE user_id = ?`,
      vals
    )

    return res.json({ message: 'Profile updated successfully.' })
  } catch (err) {
    console.error('profile/update error:', err.message)
    return res.status(500).json({ message: 'Failed to update profile.' })
  }
})

export default router

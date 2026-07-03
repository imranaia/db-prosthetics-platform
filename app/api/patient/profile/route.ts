import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();

  const patient = db.prepare('SELECT * FROM patients WHERE user_id = ?').get(user.id);

  if (!patient) {
    return NextResponse.json({ error: 'Patient record not found' }, { status: 404 });
  }

  return NextResponse.json({ patient });
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as {
    full_name?: string;
    phone?: string;
    dob?: string;
    address?: string;
    state?: string;
    lga?: string;
    gender?: string;
    marital_status?: string;
    religion?: string;
    occupation?: string;
    next_of_kin_name?: string;
    next_of_kin_relationship?: string;
    next_of_kin_phone?: string;
    referral_source?: string;
    amputation_yes?: number;
    amputation_level?: string;
    amputation_side?: string;
    amputation_date?: string;
    amputation_cause?: string;
    previous_prosthesis?: string;
    allergies?: string;
    functional_mobility_status?: string;
    caregiver_info?: string;
    declaration_signature?: string | null;
  };

  const db = getDb();
  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];

  if (body.full_name !== undefined)              { setClauses.push('full_name = ?');              values.push(body.full_name); }
  if (body.phone !== undefined)                  { setClauses.push('phone = ?');                  values.push(body.phone); }
  if (body.dob !== undefined)                    { setClauses.push('dob = ?');                    values.push(body.dob); }
  if (body.address !== undefined)                { setClauses.push('address = ?');                values.push(body.address); }
  if (body.state !== undefined)                  { setClauses.push('state = ?');                  values.push(body.state); }
  if (body.lga !== undefined)                    { setClauses.push('lga = ?');                    values.push(body.lga); }
  if (body.gender !== undefined)                 { setClauses.push('gender = ?');                 values.push(body.gender); }
  if (body.marital_status !== undefined)         { setClauses.push('marital_status = ?');         values.push(body.marital_status); }
  if (body.religion !== undefined)               { setClauses.push('religion = ?');               values.push(body.religion); }
  if (body.occupation !== undefined)             { setClauses.push('occupation = ?');             values.push(body.occupation); }
  if (body.next_of_kin_name !== undefined)       { setClauses.push('next_of_kin_name = ?');       values.push(body.next_of_kin_name); }
  if (body.next_of_kin_relationship !== undefined){ setClauses.push('next_of_kin_relationship = ?'); values.push(body.next_of_kin_relationship); }
  if (body.next_of_kin_phone !== undefined)      { setClauses.push('next_of_kin_phone = ?');      values.push(body.next_of_kin_phone); }
  if (body.referral_source !== undefined)        { setClauses.push('referral_source = ?');        values.push(body.referral_source); }
  if (body.amputation_yes !== undefined)         { setClauses.push('amputation_yes = ?');         values.push(body.amputation_yes); }
  if (body.amputation_level !== undefined)       { setClauses.push('amputation_level = ?');       values.push(body.amputation_level); }
  if (body.amputation_side !== undefined)        { setClauses.push('amputation_side = ?');        values.push(body.amputation_side); }
  if (body.amputation_date !== undefined)        { setClauses.push('amputation_date = ?');        values.push(body.amputation_date); }
  if (body.amputation_cause !== undefined)       { setClauses.push('amputation_cause = ?');       values.push(body.amputation_cause); }
  if (body.previous_prosthesis !== undefined)    { setClauses.push('previous_prosthesis = ?');    values.push(body.previous_prosthesis); }
  if (body.allergies !== undefined)              { setClauses.push('allergies = ?');              values.push(body.allergies); }
  if (body.functional_mobility_status !== undefined) { setClauses.push('functional_mobility_status = ?'); values.push(body.functional_mobility_status); }
  if (body.caregiver_info !== undefined)         { setClauses.push('caregiver_info = ?');         values.push(body.caregiver_info); }
  if (body.declaration_signature !== undefined) {
    setClauses.push('declaration_signature = ?');
    values.push(body.declaration_signature);
    setClauses.push("declaration_signed_at = datetime('now')");
  }

  if (setClauses.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  values.push(user.id);
  db.prepare(`UPDATE patients SET ${setClauses.join(', ')} WHERE user_id = ?`).run(...values);

  return NextResponse.json({ success: true });
}

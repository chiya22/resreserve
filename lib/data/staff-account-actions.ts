'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import {
  isValidLoginIdShape,
  loginIdToAuthEmail,
  normalizeLoginId,
} from '@/lib/auth/login-id'
import { getCurrentStaff } from '@/lib/data/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { err, ok, type Result } from '@/types/result'
import type { Staff } from '@/types'

const loginIdSchema = z
  .string()
  .trim()
  .min(3, 'アカウントは3文字以上です')
  .max(32, 'アカウントは32文字までです')
  .transform(normalizeLoginId)
  .refine(isValidLoginIdShape, '英数字・_・- で、先頭は英数字にしてください')

const passwordSchema = z.string().min(8, 'パスワードは8文字以上です').max(128)

const staffRoleSchema = z.enum(['owner', 'manager', 'staff'])

const createSchema = z.object({
  login_id: loginIdSchema,
  password: passwordSchema,
  name: z.string().trim().min(1, '名前を入力してください').max(100),
  role: staffRoleSchema,
})

const updateSchema = z.object({
  staffId: z.string().uuid(),
  login_id: loginIdSchema.optional(),
  name: z.string().trim().min(1, '名前を入力してください').max(100).optional(),
  role: staffRoleSchema.optional(),
  newPassword: passwordSchema.optional().or(z.literal('')),
})

async function requireOwner(): Promise<Result<{ userId: string }, string>> {
  const me = await getCurrentStaff()
  if (!me) return err('ログインが必要です')
  if (me.role !== 'owner') return err('オーナーのみ実行できます')
  return ok({ userId: me.user_id })
}

function revalidateStaffUi(): void {
  revalidatePath('/settings/staff')
  revalidatePath('/calendar')
}

export async function createStaffAccount(
  input: z.infer<typeof createSchema>,
): Promise<Result<Pick<Staff, 'id' | 'login_id'>, string>> {
  const owner = await requireOwner()
  if (!owner.success) return owner

  const parsed = createSchema.safeParse(input)
  if (!parsed.success) {
    const first =
      Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ??
      parsed.error.flatten().formErrors[0] ??
      '入力内容に問題があります'
    return err(first)
  }

  const { login_id, password, name, role } = parsed.data
  const email = loginIdToAuthEmail(login_id)

  let admin
  try {
    admin = createAdminClient()
  } catch (e) {
    console.error(e)
    return err('サーバー設定（SUPABASE_SERVICE_ROLE_KEY）を確認してください')
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createErr || !created.user) {
    const msg =
      createErr?.message.includes('already been registered') || createErr?.status === 422
        ? 'このアカウントは既に使われています'
        : createErr?.message ?? 'ユーザーの作成に失敗しました'
    return err(msg)
  }

  const supabase = await createClient()
  const { data: row, error: insErr } = await supabase
    .from('staff')
    .insert({
      user_id: created.user.id,
      login_id,
      name,
      role,
    })
    .select('id, login_id')
    .single()

  if (insErr || !row) {
    await admin.auth.admin.deleteUser(created.user.id)
    console.error('staff insert failed after auth user:', insErr)
    return err(
      insErr?.code === '23505'
        ? 'このアカウント名は既に使われています'
        : 'スタッフ登録に失敗しました',
    )
  }

  revalidateStaffUi()
  return ok(row)
}

export async function updateStaffAccount(
  input: z.infer<typeof updateSchema>,
): Promise<Result<void, string>> {
  const owner = await requireOwner()
  if (!owner.success) return owner

  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) {
    const first =
      Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ??
      parsed.error.flatten().formErrors[0] ??
      '入力内容に問題があります'
    return err(first)
  }

  const { staffId, login_id: nextLoginId, name, role, newPassword } = parsed.data

  const supabase = await createClient()
  const { data: target, error: fetchErr } = await supabase
    .from('staff')
    .select('id, user_id, login_id, role')
    .eq('id', staffId)
    .maybeSingle()

  if (fetchErr || !target) {
    console.error(fetchErr)
    return err('対象スタッフが見つかりません')
  }

  if (target.user_id === owner.data.userId && role !== undefined && role !== 'owner') {
    return err('自分自身をオーナー以外に変更することはできません')
  }

  if (role === 'owner' || target.role === 'owner') {
    const { data: owners, error: coErr } = await supabase
      .from('staff')
      .select('id')
      .eq('role', 'owner')

    if (coErr || !owners) return err('権限情報の確認に失敗しました')

    if (target.role === 'owner' && role !== undefined && role !== 'owner') {
      if (owners.length <= 1) {
        return err('少なくとも1名のオーナーが必要です')
      }
    }
  }

  let admin: ReturnType<typeof createAdminClient> | undefined
  const needAdmin =
    Boolean(nextLoginId !== undefined && nextLoginId !== target.login_id) ||
    Boolean(newPassword && newPassword.length > 0)

  if (needAdmin) {
    try {
      admin = createAdminClient()
    } catch (e) {
      console.error(e)
      return err('サーバー設定（SUPABASE_SERVICE_ROLE_KEY）を確認してください')
    }
  }

  if (nextLoginId !== undefined && nextLoginId !== target.login_id) {
    const email = loginIdToAuthEmail(nextLoginId)
    const { error: upAuth } = await admin!.auth.admin.updateUserById(target.user_id, {
      email,
    })
    if (upAuth) {
      const msg =
        upAuth.message.includes('already been registered') || upAuth.status === 422
          ? 'このアカウントは既に使われています'
          : upAuth.message
      return err(msg)
    }
  }

  if (newPassword && newPassword.length > 0) {
    const { error: pwErr } = await admin!.auth.admin.updateUserById(target.user_id, {
      password: newPassword,
    })
    if (pwErr) return err(pwErr.message)
  }

  const patch: { login_id?: string; name?: string; role?: 'owner' | 'manager' | 'staff' } =
    {}
  if (nextLoginId !== undefined) patch.login_id = nextLoginId
  if (name !== undefined) patch.name = name
  if (role !== undefined) patch.role = role

  if (Object.keys(patch).length > 0) {
    const { error: upRow } = await supabase.from('staff').update(patch).eq('id', staffId)
    if (upRow) {
      console.error(upRow)
      return err(
        upRow.code === '23505' ? 'このアカウント名は既に使われています' : '更新に失敗しました',
      )
    }
  }

  revalidateStaffUi()
  return ok(undefined)
}

export async function deleteStaffAccount(staffId: string): Promise<Result<void, string>> {
  const owner = await requireOwner()
  if (!owner.success) return owner

  const idParsed = z.string().uuid().safeParse(staffId)
  if (!idParsed.success) return err('不正なIDです')

  const supabase = await createClient()
  const { data: target, error: fetchErr } = await supabase
    .from('staff')
    .select('id, user_id, role')
    .eq('id', staffId)
    .maybeSingle()

  if (fetchErr || !target) return err('対象スタッフが見つかりません')

  if (target.user_id === owner.data.userId) return err('自分自身は削除できません')

  if (target.role === 'owner') {
    const { data: owners, error: coErr } = await supabase
      .from('staff')
      .select('id')
      .eq('role', 'owner')

    if (coErr || !owners) return err('権限情報の確認に失敗しました')
    if (owners.length <= 1) return err('最後のオーナーは削除できません')
  }

  let admin
  try {
    admin = createAdminClient()
  } catch (e) {
    console.error(e)
    return err('サーバー設定（SUPABASE_SERVICE_ROLE_KEY）を確認してください')
  }

  const { error: delErr } = await admin.auth.admin.deleteUser(target.user_id)

  if (delErr) {
    console.error(delErr)
    return err('ユーザーの削除に失敗しました')
  }

  revalidateStaffUi()
  return ok(undefined)
}

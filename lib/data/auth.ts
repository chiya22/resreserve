import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'
import type { Staff } from '@/types'

/**
 * 現在のログインユーザーのスタッフ行を返す。
 * 未ログインまたは staff にいない場合は null。
 *
 * 同一リクエスト内で複数回呼ばれても Auth / DB への往復は 1 回で済むよう cache() で包む。
 */
export const getCurrentStaff = cache(async (): Promise<Staff | null> => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('staff')
    .select(
      'id, user_id, login_id, name, role, notification_email, created_at',
    )
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('getCurrentStaff: staff の取得に失敗しました', {
      message: error.message,
      code: error.code,
      userId: user.id,
    })
    return null
  }

  return data
})

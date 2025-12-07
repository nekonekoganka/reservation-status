package com.fujiminohikari.reservationstatus

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat

/**
 * 端末起動時にサービスを自動起動するレシーバー
 */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            // SharedPreferencesで自動起動が有効かどうかを確認できる
            // ここでは常に起動する設定
            val serviceIntent = Intent(context, ReservationService::class.java)
            ContextCompat.startForegroundService(context, serviceIntent)
        }
    }
}

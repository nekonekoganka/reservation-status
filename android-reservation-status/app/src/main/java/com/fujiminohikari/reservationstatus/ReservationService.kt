package com.fujiminohikari.reservationstatus

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import androidx.core.graphics.drawable.IconCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * 常駐サービス
 * - ステータスバーに予約状況を表示
 * - 1分ごとにデータを更新
 */
class ReservationService : Service() {

    private val handler = Handler(Looper.getMainLooper())
    private lateinit var updateRunnable: Runnable

    companion object {
        const val CHANNEL_ID_GENERAL = "reservation_general"
        const val CHANNEL_ID_SHIYA = "reservation_shiya"
        const val NOTIFICATION_ID_GENERAL = 1
        const val NOTIFICATION_ID_SHIYA = 2
        const val UPDATE_INTERVAL = 60000L // 1分

        var isRunning = false
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
        isRunning = true
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // 初回通知を表示してフォアグラウンドサービスとして開始
        startForeground(NOTIFICATION_ID_GENERAL, createInitialNotification())

        // 定期更新を開始
        startPeriodicUpdate()

        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacks(updateRunnable)
        isRunning = false
    }

    /**
     * 通知チャンネルを作成
     */
    private fun createNotificationChannels() {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // 一般予約チャンネル
        val generalChannel = NotificationChannel(
            CHANNEL_ID_GENERAL,
            "一般予約状況",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "一般予約の空き状況を表示します"
            setShowBadge(false)
        }

        // 視野予約チャンネル
        val shiyaChannel = NotificationChannel(
            CHANNEL_ID_SHIYA,
            "視野予約状況",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "視野予約の空き状況を表示します"
            setShowBadge(false)
        }

        notificationManager.createNotificationChannel(generalChannel)
        notificationManager.createNotificationChannel(shiyaChannel)
    }

    /**
     * 初期通知を作成
     */
    private fun createInitialNotification(): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID_GENERAL)
            .setSmallIcon(R.drawable.ic_notification_loading)
            .setContentTitle("予約状況")
            .setContentText("データを取得中...")
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    /**
     * 定期更新を開始
     */
    private fun startPeriodicUpdate() {
        updateRunnable = object : Runnable {
            override fun run() {
                updateNotifications()
                handler.postDelayed(this, UPDATE_INTERVAL)
            }
        }
        // 即座に最初の更新を実行
        handler.post(updateRunnable)
    }

    /**
     * 通知を更新
     */
    private fun updateNotifications() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val generalData = DataFetcher.fetchGeneralData()
                val shiyaData = DataFetcher.fetchShiyaData()

                val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

                // 一般予約の通知
                val generalCount = generalData?.slots?.size ?: -1
                val generalNotification = createNotification(
                    channelId = CHANNEL_ID_GENERAL,
                    title = "一般予約",
                    count = generalCount,
                    themeColor = Color.parseColor("#CC6600")
                )
                notificationManager.notify(NOTIFICATION_ID_GENERAL, generalNotification)

                // 視野予約の通知
                val shiyaCount = shiyaData?.slots?.size ?: -1
                val shiyaNotification = createNotification(
                    channelId = CHANNEL_ID_SHIYA,
                    title = "視野予約",
                    count = shiyaCount,
                    themeColor = Color.parseColor("#006633")
                )
                notificationManager.notify(NOTIFICATION_ID_SHIYA, shiyaNotification)

            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    /**
     * 通知を作成
     */
    private fun createNotification(
        channelId: String,
        title: String,
        count: Int,
        themeColor: Int
    ): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val statusText = when {
            count < 0 -> "取得エラー"
            count == 0 -> "満枠"
            else -> "残り ${count} 枠"
        }

        // 数字アイコンを動的に生成
        val iconBitmap = createNumberIcon(count)
        val icon = IconCompat.createWithBitmap(iconBitmap)

        return NotificationCompat.Builder(this, channelId)
            .setSmallIcon(icon)
            .setContentTitle(title)
            .setContentText(statusText)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setColor(themeColor)
            .build()
    }

    /**
     * 数字のアイコンを動的に生成
     */
    private fun createNumberIcon(count: Int): Bitmap {
        val size = 96 // アイコンサイズ
        val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)

        val paint = Paint().apply {
            isAntiAlias = true
            typeface = Typeface.DEFAULT_BOLD
            textAlign = Paint.Align.CENTER
        }

        when {
            count < 0 -> {
                // エラー: 「?」を表示
                paint.color = Color.WHITE
                paint.textSize = size * 0.7f
                canvas.drawText("?", size / 2f, size * 0.75f, paint)
            }
            count == 0 -> {
                // 満枠: 「✕」を表示
                paint.color = Color.WHITE
                paint.strokeWidth = size * 0.12f
                paint.style = Paint.Style.STROKE
                paint.strokeCap = Paint.Cap.ROUND
                canvas.drawLine(size * 0.25f, size * 0.25f, size * 0.75f, size * 0.75f, paint)
                canvas.drawLine(size * 0.75f, size * 0.25f, size * 0.25f, size * 0.75f, paint)
            }
            else -> {
                // 数字を表示
                paint.color = Color.WHITE
                paint.textSize = if (count >= 10) size * 0.6f else size * 0.75f
                canvas.drawText(count.toString(), size / 2f, size * 0.72f, paint)
            }
        }

        return bitmap
    }
}

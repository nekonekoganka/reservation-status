package com.fujiminohikari.reservationstatus

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * メイン画面
 * - サービスの開始/停止
 * - 現在のステータス表示
 */
class MainActivity : AppCompatActivity() {

    private lateinit var statusTextGeneral: TextView
    private lateinit var statusTextShiya: TextView
    private lateinit var updateTimeText: TextView
    private lateinit var startButton: Button
    private lateinit var stopButton: Button

    companion object {
        private const val NOTIFICATION_PERMISSION_REQUEST_CODE = 1001
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // UI要素の取得
        statusTextGeneral = findViewById(R.id.statusTextGeneral)
        statusTextShiya = findViewById(R.id.statusTextShiya)
        updateTimeText = findViewById(R.id.updateTimeText)
        startButton = findViewById(R.id.startButton)
        stopButton = findViewById(R.id.stopButton)

        // 開始ボタン
        startButton.setOnClickListener {
            checkPermissionAndStartService()
        }

        // 停止ボタン
        stopButton.setOnClickListener {
            stopReservationService()
        }

        // 初回データ取得
        refreshStatus()
    }

    /**
     * 通知権限をチェックしてサービスを開始
     */
    private fun checkPermissionAndStartService() {
        // Android 13以降は通知権限が必要
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                    this,
                    arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                    NOTIFICATION_PERMISSION_REQUEST_CODE
                )
                return
            }
        }
        startReservationService()
    }

    /**
     * 権限リクエスト結果
     */
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == NOTIFICATION_PERMISSION_REQUEST_CODE) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                startReservationService()
            } else {
                Toast.makeText(this, "通知権限が必要です", Toast.LENGTH_LONG).show()
            }
        }
    }

    /**
     * サービスを開始
     */
    private fun startReservationService() {
        val intent = Intent(this, ReservationService::class.java)
        ContextCompat.startForegroundService(this, intent)
        Toast.makeText(this, "ステータスバー表示を開始しました", Toast.LENGTH_SHORT).show()
        updateButtonState(true)
    }

    /**
     * サービスを停止
     */
    private fun stopReservationService() {
        val intent = Intent(this, ReservationService::class.java)
        stopService(intent)
        Toast.makeText(this, "ステータスバー表示を停止しました", Toast.LENGTH_SHORT).show()
        updateButtonState(false)
    }

    /**
     * ボタンの状態を更新
     */
    private fun updateButtonState(isRunning: Boolean) {
        startButton.isEnabled = !isRunning
        stopButton.isEnabled = isRunning
    }

    /**
     * ステータスを更新表示
     */
    private fun refreshStatus() {
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val generalData = DataFetcher.fetchGeneralData()
                val shiyaData = DataFetcher.fetchShiyaData()

                withContext(Dispatchers.Main) {
                    // 一般予約
                    if (generalData != null) {
                        val count = generalData.slots.size
                        statusTextGeneral.text = if (count > 0) "残り ${count} 枠" else "満枠"
                    } else {
                        statusTextGeneral.text = "取得エラー"
                    }

                    // 視野予約
                    if (shiyaData != null) {
                        val count = shiyaData.slots.size
                        statusTextShiya.text = if (count > 0) "残り ${count} 枠" else "満枠"
                    } else {
                        statusTextShiya.text = "取得エラー"
                    }

                    // 更新時刻
                    updateTimeText.text = "更新: ${java.text.SimpleDateFormat("HH:mm", java.util.Locale.JAPAN).format(java.util.Date())}"
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    statusTextGeneral.text = "エラー"
                    statusTextShiya.text = "エラー"
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        // サービスが動作中かどうかでボタン状態を更新
        val isRunning = ReservationService.isRunning
        updateButtonState(isRunning)
        refreshStatus()
    }
}

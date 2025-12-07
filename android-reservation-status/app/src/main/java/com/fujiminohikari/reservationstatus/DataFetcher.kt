package com.fujiminohikari.reservationstatus

import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * Cloud StorageからJSONデータを取得するクラス
 */
object DataFetcher {

    private const val GENERAL_URL = "https://storage.googleapis.com/reservation-timeslots-fujiminohikari/timeslots.json"
    private const val SHIYA_URL = "https://storage.googleapis.com/reservation-timeslots-fujiminohikari/timeslots-shiya.json"

    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    /**
     * 予約データを格納するデータクラス
     */
    data class ReservationData(
        val slots: List<String>,
        val status: String,
        val date: Int?,
        val updatedAt: String
    )

    /**
     * 一般予約データを取得
     */
    fun fetchGeneralData(): ReservationData? {
        return fetchData(GENERAL_URL)
    }

    /**
     * 視野予約データを取得
     */
    fun fetchShiyaData(): ReservationData? {
        return fetchData(SHIYA_URL)
    }

    /**
     * JSONデータを取得してパース
     */
    private fun fetchData(url: String): ReservationData? {
        return try {
            // キャッシュ回避のためにタイムスタンプを追加
            val requestUrl = "$url?t=${System.currentTimeMillis()}"

            val request = Request.Builder()
                .url(requestUrl)
                .build()

            val response = client.newCall(request).execute()

            if (!response.isSuccessful) {
                return null
            }

            val jsonString = response.body?.string() ?: return null
            val json = JSONObject(jsonString)

            // slotsを配列として取得
            val slotsArray = json.optJSONArray("slots")
            val slots = mutableListOf<String>()
            if (slotsArray != null) {
                for (i in 0 until slotsArray.length()) {
                    slots.add(slotsArray.getString(i))
                }
            }

            ReservationData(
                slots = slots,
                status = json.optString("status", "unknown"),
                date = if (json.has("date")) json.getInt("date") else null,
                updatedAt = json.optString("updatedAt", "")
            )

        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}

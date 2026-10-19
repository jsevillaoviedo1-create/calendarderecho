package com.calderecho.app.widget

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.lazy.LazyColumn
import androidx.glance.appwidget.lazy.items
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.*
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import com.calderecho.app.MainActivity
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class WidgetItem(
    val id: String,
    val title: String,
    val subtitle: String,
    val time: String,
    val isCompleted: Boolean,
    val dateLabel: String,
    val isToday: Boolean
)

class AgendaGlanceWidget : GlanceAppWidget() {

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val (headerDate, itemsList) = loadWidgetData(context)

        provideContent {
            GlanceThemeWrapper(headerDate, itemsList, context)
        }
    }

    private fun loadWidgetData(context: Context): Pair<String, List<WidgetItem>> {
        // Read data saved by Capacitor Preferences plugin
        // Capacitor Preferences uses "CapacitorStorage" SharedPreferences file
        var prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE)
        var rawData = prefs.getString("widget_data", null)

        if (rawData == null) {
            // Fallback to default SharedPreferences
            prefs = context.getSharedPreferences(context.packageName + "_preferences", Context.MODE_PRIVATE)
            rawData = prefs.getString("widget_data", null)
        }

        val items = mutableListOf<WidgetItem>()
        var headerDate = SimpleDateFormat("EEEE, d 'de' MMMM", Locale("es", "ES")).format(Date())
            .replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale("es", "ES")) else it.toString() }

        if (rawData != null) {
            try {
                val json = JSONObject(rawData)
                if (json.has("todayFormatted")) {
                    headerDate = json.getString("todayFormatted")
                        .replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale("es", "ES")) else it.toString() }
                }

                val todayDate = json.optString("todayDate", "")

                // 1. Load today's tasks
                if (json.has("tasks")) {
                    val tasksArray = json.getJSONArray("tasks")
                    for (i in 0 until tasksArray.length()) {
                        val obj = tasksArray.getJSONObject(i)
                        items.add(
                            WidgetItem(
                                id = obj.optString("id", "$i"),
                                title = obj.optString("title", "Tarea"),
                                subtitle = obj.optString("subject", "Agenda"),
                                time = obj.optString("time", "Hoy"),
                                isCompleted = obj.optBoolean("completed", false),
                                dateLabel = "Hoy",
                                isToday = true
                            )
                        )
                    }
                }

                // 2. Load upcoming days tasks & events for continuous scroll
                if (json.has("followingDays")) {
                    val daysArray = json.getJSONArray("followingDays")
                    for (d in 0 until daysArray.length()) {
                        val dayObj = daysArray.getJSONObject(d)
                        val dayDate = dayObj.optString("date", "")
                        val dayLabel = dayObj.optString("dayLabel", "")
                        val isToday = dayDate == todayDate

                        if (!isToday && dayObj.has("items")) {
                            val dayItemsArray = dayObj.getJSONArray("items")
                            for (j in 0 until dayItemsArray.length()) {
                                val itemObj = dayItemsArray.getJSONObject(j)
                                items.add(
                                    WidgetItem(
                                        id = "${dayDate}_$j",
                                        title = itemObj.optString("title", "Actividad"),
                                        subtitle = itemObj.optString("subtitle", dayLabel),
                                        time = itemObj.optString("time", dayLabel),
                                        isCompleted = itemObj.optBoolean("completed", false),
                                        dateLabel = dayLabel,
                                        isToday = false
                                    )
                                )
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        // If no items yet, show a helpful starter item
        if (items.isEmpty()) {
            items.add(
                WidgetItem(
                    id = "sample_1",
                    title = "Organizar apuntes de Derecho",
                    subtitle = "1er Semestre",
                    time = "10:00",
                    isCompleted = false,
                    dateLabel = "Hoy",
                    isToday = true
                )
            )
            items.add(
                WidgetItem(
                    id = "sample_2",
                    title = "Repasar Derecho Constitucional",
                    subtitle = "Mañana",
                    time = "12:00",
                    isCompleted = false,
                    dateLabel = "Mañana",
                    isToday = false
                )
            )
        }

        return Pair(headerDate, items)
    }

    @Composable
    private fun GlanceThemeWrapper(headerDate: String, items: List<WidgetItem>, context: Context) {
        val launchIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            data = Uri.parse("com.calderecho.app://open?action=widget")
        }

        // Exact visual design requested:
        // Dark background (#121316), header with formatted date,
        // and list of events/tasks in rounded blue blocks (#1D4ED8 / #2563EB).
        Box(
            modifier = GlanceModifier
                .fillMaxSize()
                .background(Color(0xFF121316))
                .cornerRadius(24.dp)
                .padding(12.dp)
                .clickable(actionStartActivity(launchIntent))
        ) {
            Column(
                modifier = GlanceModifier.fillMaxSize()
            ) {
                // Header: Date & Status Badge
                Row(
                    modifier = GlanceModifier.fillMaxWidth().padding(bottom = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = GlanceModifier.defaultWeight()) {
                        Text(
                            text = headerDate,
                            style = TextStyle(
                                color = Color.White,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold
                            ),
                            maxLines = 1
                        )
                        Text(
                            text = "${items.size} actividades programadas",
                            style = TextStyle(
                                color = Color(0xFFFACC15), // Yellow HUD accent
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Medium
                            )
                        )
                    }

                    // App identifier pill
                    Box(
                        modifier = GlanceModifier
                            .background(Color(0x33FACC15))
                            .cornerRadius(8.dp)
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = "DERECHO",
                            style = TextStyle(
                                color = Color(0xFFFACC15),
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold
                            )
                        )
                    }
                }

                // Interactive / Scrollable list of tasks & events in rounded blue blocks
                LazyColumn(
                    modifier = GlanceModifier.fillMaxSize()
                ) {
                    items(items) { item ->
                        WidgetEventBlueBlock(item)
                        Spacer(modifier = GlanceModifier.height(6.dp))
                    }
                }
            }
        }
    }

    @Composable
    private fun WidgetEventBlueBlock(item: WidgetItem) {
        // Rounded blue block matching the requested reference image
        val blockColor = if (item.isCompleted) Color(0xFF1E293B) else Color(0xFF1D4ED8)
        val textDecoration = if (item.isCompleted) Color(0xFF94A3B8) else Color.White

        Box(
            modifier = GlanceModifier
                .fillMaxWidth()
                .background(blockColor)
                .cornerRadius(12.dp)
                .padding(horizontal = 10.dp, vertical = 8.dp)
        ) {
            Row(
                modifier = GlanceModifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Leading time or indicator pill
                Column(
                    modifier = GlanceModifier.padding(end = 8.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = item.time.ifEmpty { if (item.isToday) "Hoy" else item.dateLabel },
                        style = TextStyle(
                            color = Color(0xFF93C5FD), // Light blue
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    )
                }

                // Main Title & Subtitle
                Column(
                    modifier = GlanceModifier.defaultWeight()
                ) {
                    Text(
                        text = item.title,
                        style = TextStyle(
                            color = textDecoration,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        ),
                        maxLines = 1
                    )
                    Text(
                        text = "${item.subtitle} • ${item.dateLabel}",
                        style = TextStyle(
                            color = Color(0xFFE2E8F0),
                            fontSize = 10.sp
                        ),
                        maxLines = 1
                    )
                }

                // Status check indicator
                if (item.isCompleted) {
                    Text(
                        text = "✓",
                        style = TextStyle(
                            color = Color(0xFF4ADE80),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    )
                }
            }
        }
    }
}

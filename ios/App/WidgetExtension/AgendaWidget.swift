import WidgetKit
import SwiftUI

// Data structures decoded from Capacitor Preferences (group.com.calderecho.app)
struct WidgetItemData: Codable, Identifiable {
    let id: String
    let title: String
    let subtitle: String
    let time: String
    let completed: Bool?
    let dateLabel: String?
}

struct WidgetPayloadData: Codable {
    let updatedAt: String?
    let todayDate: String?
    let todayFormatted: String?
    let tasks: [TaskItemData]?
    let events: [EventItemData]?
}

struct TaskItemData: Codable {
    let id: String
    let title: String
    let subject: String?
    let completed: Bool
    let priority: String?
    let time: String?
}

struct EventItemData: Codable {
    let id: String
    let title: String
    let date: String
    let startTime: String
    let location: String?
    let category: String?
    let color: String?
}

struct AgendaWidgetEntry: TimelineEntry {
    let date: Date
    let todayFormatted: String
    let items: [WidgetItemData]
}

struct AgendaTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> AgendaWidgetEntry {
        AgendaWidgetEntry(
            date: Date(),
            todayFormatted: "Hoy",
            items: [
                WidgetItemData(id: "1", title: "Derecho Constitucional", subtitle: "Tema 4 • Aula 110", time: "10:00", completed: false, dateLabel: "Hoy"),
                WidgetItemData(id: "2", title: "Repaso Derecho Romano", subtitle: "Práctica 2", time: "12:30", completed: false, dateLabel: "Mañana")
            ]
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (AgendaWidgetEntry) -> Void) {
        completion(loadData())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<AgendaWidgetEntry>) -> Void) {
        let entry = loadData()
        // Refresh every 30 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date().addingTimeInterval(1800)
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func loadData() -> AgendaWidgetEntry {
        // Shared App Group storage populated by Capacitor Preferences
        let sharedDefaults = UserDefaults(suiteName: "group.com.calderecho.app") ?? UserDefaults.standard

        var todayFormatted = "Hoy"
        var items: [WidgetItemData] = []

        if let rawJson = sharedDefaults.string(forKey: "widget_data"),
           let data = rawJson.data(using: .utf8) {
            if let decoded = try? JSONDecoder().decode(WidgetPayloadData.self, from: data) {
                if let formatted = decoded.todayFormatted {
                    todayFormatted = formatted.capitalized
                }

                // Append tasks
                if let tasks = decoded.tasks {
                    for task in tasks {
                        items.append(
                            WidgetItemData(
                                id: task.id,
                                title: task.title,
                                subtitle: task.subject ?? "Tarea",
                                time: task.time ?? "Hoy",
                                completed: task.completed,
                                dateLabel: "Hoy"
                            )
                        )
                    }
                }

                // Append events
                if let events = decoded.events {
                    for ev in events {
                        items.append(
                            WidgetItemData(
                                id: ev.id,
                                title: ev.title,
                                subtitle: ev.category ?? "Calendario",
                                time: ev.startTime,
                                completed: false,
                                dateLabel: ev.date
                            )
                        )
                    }
                }
            }
        }

        if items.isEmpty {
            items = [
                WidgetItemData(id: "s1", title: "Organizar apuntes de Derecho", subtitle: "1er Semestre", time: "10:00", completed: false, dateLabel: "Hoy"),
                WidgetItemData(id: "s2", title: "Repasar Derecho Constitucional", subtitle: "Mañana", time: "12:00", completed: false, dateLabel: "Mañana")
            ]
        }

        return AgendaWidgetEntry(date: Date(), todayFormatted: todayFormatted, items: items)
    }
}

// Visual widget view matching the exact user specification:
// Dark background (#121316), header with formatted date, and blue rounded blocks (#1D4ED8)
struct AgendaWidgetEntryView: View {
    var entry: AgendaTimelineProvider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        ZStack {
            Color(red: 18/255, green: 19/255, blue: 22/255)
                .ignoresSafeArea()

            VStack(alignment: .leading, spacing: 6) {
                // Header: Top Date & Badge
                HStack {
                    VStack(alignment: .leading, spacing: 1) {
                        Text(entry.todayFormatted)
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)
                            .lineLimit(1)

                        Text("\(entry.items.count) actividades")
                            .font(.system(size: 9, weight: .semibold))
                            .foregroundColor(Color(red: 250/255, green: 204/255, blue: 21/255))
                    }

                    Spacer()

                    Text("DERECHO")
                        .font(.system(size: 8, weight: .heavy))
                        .padding(.horizontal, 5)
                        .padding(.vertical, 2)
                        .background(Color(red: 250/255, green: 204/255, blue: 21/255).opacity(0.2))
                        .foregroundColor(Color(red: 250/255, green: 204/255, blue: 21/255))
                        .cornerRadius(6)
                }
                .padding(.bottom, 2)

                // List of items in rounded blue blocks
                VStack(spacing: 5) {
                    let maxItems = (family == .systemSmall) ? 2 : 4
                    ForEach(Array(entry.items.prefix(maxItems))) { item in
                        HStack(spacing: 6) {
                            Text(item.time)
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(Color(red: 147/255, green: 197/255, blue: 253/255))
                                .frame(width: 32, alignment: .leading)

                            VStack(alignment: .leading, spacing: 1) {
                                Text(item.title)
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(.white)
                                    .lineLimit(1)

                                Text(item.subtitle)
                                    .font(.system(size: 8))
                                    .foregroundColor(Color(red: 226/255, green: 232/255, blue: 240/255))
                                    .lineLimit(1)
                            }

                            Spacer()

                            if item.completed == true {
                                Text("✓")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(Color(red: 74/255, green: 222/255, blue: 128/255))
                            }
                        }
                        .padding(.horizontal, 8)
                        .padding(.vertical, 5)
                        .background(
                            (item.completed == true)
                                ? Color(red: 30/255, green: 41/255, blue: 59/255)
                                : Color(red: 29/255, green: 78/255, blue: 216/255)
                        )
                        .cornerRadius(10)
                    }
                }

                Spacer(minLength: 0)
            }
            .padding(10)
        }
        .widgetURL(URL(string: "com.calderecho.app://open?action=widget"))
    }
}

@main
struct AgendaWidget: Widget {
    let kind: String = "AgendaWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: AgendaTimelineProvider()) { entry in
            AgendaWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Tareas del Día (2x2)")
        .description("Muestra tus tareas y eventos del día en bloques azules redondeados.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

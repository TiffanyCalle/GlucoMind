import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HK, HealthValue } from './healthkit';

// ------------------------------------------------------------------ types
type DayBucket = {
  label: string;   // 'Mon', 'Tue' …
  dateKey: string; // 'YYYY-MM-DD'
  value: number;   // average glucose for the day
  hasData: boolean;
};

// ------------------------------------------------------------------ helpers
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildEmptyWeek(): DayBucket[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      label: DAY_LABELS[d.getDay()],
      dateKey: d.toISOString().split('T')[0],
      value: 0,
      hasData: false,
    };
  });
}

function glucoseColor(value: number) {
  if (value <= 140) return '#34C759';
  if (value <= 180) return '#FF9500';
  return '#FF3B30';
}

function fillBuckets(buckets: DayBucket[], readings: HealthValue[]): DayBucket[] {
  const byDay: Record<string, number[]> = {};
  for (const r of readings) {
    const key = r.startDate.split('T')[0];
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(r.value);
  }
  return buckets.map(b => {
    const vals = byDay[b.dateKey];
    if (!vals) return b;
    const avg = Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
    return { ...b, value: avg, hasData: true };
  });
}

// ------------------------------------------------------------------ BarChart
const CHART_H = 160;
const REF_LINES = [180, 140, 100];

function BarChart({ data }: { data: DayBucket[] }) {
  const filled = data.filter(d => d.hasData).map(d => d.value);
  const maxVal = Math.max(...filled, 200);

  return (
    <View style={styles.chartWrap}>
      {/* reference lines */}
      {REF_LINES.map(ref => (
        <View
          key={ref}
          style={[styles.refLine, { bottom: (ref / maxVal) * CHART_H + 28 }]}
          pointerEvents="none">
          <Text style={styles.refLabel}>{ref}</Text>
          <View style={styles.refDash} />
        </View>
      ))}

      {/* bars */}
      <View style={styles.barsRow}>
        {data.map((day, i) => {
          const barH = day.hasData
            ? Math.max((day.value / maxVal) * CHART_H, 4)
            : 0;
          return (
            <View key={i} style={styles.barCol}>
              <View style={styles.barTrack}>
                {day.hasData && (
                  <View
                    style={[
                      styles.bar,
                      { height: barH, backgroundColor: glucoseColor(day.value) },
                    ]}
                  />
                )}
              </View>
              <Text style={styles.barLabel}>{day.label}</Text>
              {day.hasData && (
                <Text style={[styles.barValue, { color: glucoseColor(day.value) }]}>
                  {day.value}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ------------------------------------------------------------------ PaywallModal
function PaywallModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [plan, setPlan] = useState<'yearly' | 'monthly'>('yearly');

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.paywallIcon}>📊</Text>
          <Text style={styles.paywallTitle}>Unlock 30-Day Trend</Text>
          <Text style={styles.paywallSub}>
            Spot multi-week patterns, track progress after medication changes,
            and share detailed reports with your care team.
          </Text>

          <View style={styles.plans}>
            {/* Yearly */}
            <TouchableOpacity
              style={[styles.planCard, plan === 'yearly' && styles.planCardSelected]}
              onPress={() => setPlan('yearly')}
              activeOpacity={0.8}>
              <View style={styles.bestBadge}>
                <Text style={styles.bestBadgeText}>BEST VALUE</Text>
              </View>
              <Text style={styles.planName}>Yearly</Text>
              <Text style={styles.planPrice}>$29.99 / yr</Text>
              <Text style={styles.planPer}>$2.50 / mo</Text>
            </TouchableOpacity>

            {/* Monthly */}
            <TouchableOpacity
              style={[styles.planCard, plan === 'monthly' && styles.planCardSelected]}
              onPress={() => setPlan('monthly')}
              activeOpacity={0.8}>
              <Text style={styles.planName}>Monthly</Text>
              <Text style={styles.planPrice}>$4.99 / mo</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.ctaBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.ctaBtnText}>Start 7-Day Free Trial</Text>
          </TouchableOpacity>

          <Text style={styles.legal}>Cancel anytime · Billed after trial ends</Text>
        </View>
      </View>
    </Modal>
  );
}

// ------------------------------------------------------------------ screen
export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const [chartData, setChartData] = useState<DayBucket[]>(buildEmptyWeek());
  const [paywallVisible, setPaywallVisible] = useState(false);

  useEffect(() => {
    HK.getBloodGlucoseSamples(
      {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        ascending: true,
        limit: 100,
      },
      (err, results) => {
        if (err || !results?.length) return;
        setChartData(prev => fillBuckets(prev, results));
      },
    );
  }, []);

  return (
    <ScrollView
      contentContainerStyle={[styles.screen, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}>

      {/* ── 7-Day card ─────────────────────────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>7-Day Trend</Text>
        <Text style={styles.cardSub}>Blood Glucose · mg/dL</Text>
        <BarChart data={chartData} />

        <View style={styles.legend}>
          {(
            [
              ['#34C759', '≤ 140', 'Normal'],
              ['#FF9500', '141–180', 'High'],
              ['#FF3B30', '> 180', 'Very High'],
            ] as const
          ).map(([color, range, label]) => (
            <View key={label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={styles.legendText}>
                {range}{'  '}{label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Locked 30-Day card ─────────────────────────────────── */}
      <Pressable
        style={({ pressed }) => [styles.lockedCard, pressed && { opacity: 0.85 }]}
        onPress={() => setPaywallVisible(true)}>

        {/* ghost bar preview */}
        <View style={styles.ghostBars}>
          {[55, 80, 40, 70, 90, 50, 65, 75, 45, 85, 60, 70,
            50, 88, 42, 68, 78, 55, 92, 48, 72, 60, 82, 38,
            65, 75, 52, 88, 44, 70].map((h, i) => (
            <View key={i} style={[styles.ghostBar, { height: h }]} />
          ))}
        </View>

        {/* overlay */}
        <View style={styles.lockedOverlay}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.lockedTitle}>30-Day Trend</Text>
          <Text style={styles.lockedCta}>Upgrade to GlucoMind Pro →</Text>
        </View>
      </Pressable>

      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </ScrollView>
  );
}

// ------------------------------------------------------------------ styles
const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    backgroundColor: '#F0F4F8',
  },

  // cards
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  cardSub: { fontSize: 13, color: '#888', marginTop: 2, marginBottom: 16 },

  // chart
  chartWrap: {
    height: CHART_H + 56,
    position: 'relative',
  },
  refLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  refLabel: { fontSize: 10, color: '#BBB', width: 28 },
  refDash: { flex: 1, height: 1, backgroundColor: '#EBEBEB' },

  barsRow: {
    position: 'absolute',
    bottom: 0,
    left: 28,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_H + 42,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    width: '60%',
    height: CHART_H,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
  },
  barLabel: { fontSize: 11, color: '#888', marginTop: 4 },
  barValue: { fontSize: 10, fontWeight: '600', marginTop: 1 },

  // legend
  legend: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendText: { fontSize: 12, color: '#555' },

  // locked card
  lockedCard: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 180,
    backgroundColor: '#1A1A2E',
    marginBottom: 16,
  },
  ghostBars: {
    position: 'absolute',
    bottom: 32,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    opacity: 0.25,
  },
  ghostBar: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,10,30,0.55)',
  },
  lockIcon: { fontSize: 28, marginBottom: 8 },
  lockedTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  lockedCta: { fontSize: 13, color: '#A0A0C0', marginTop: 6 },

  // paywall modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 4,
  },
  closeBtnText: { fontSize: 18, color: '#888' },
  paywallIcon: { fontSize: 40, textAlign: 'center', marginBottom: 8 },
  paywallTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  paywallSub: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },

  // plan cards
  plans: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  planCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    padding: 14,
    alignItems: 'center',
    position: 'relative',
    paddingTop: 22,
  },
  planCardSelected: { borderColor: '#007AFF', backgroundColor: '#F0F7FF' },
  bestBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bestBadgeText: { fontSize: 9, color: '#FFF', fontWeight: '700', letterSpacing: 0.5 },
  planName: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  planPrice: { fontSize: 18, fontWeight: '700', color: '#007AFF', marginTop: 4 },
  planPer: { fontSize: 12, color: '#888', marginTop: 2 },

  ctaBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  ctaBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  legal: { fontSize: 12, color: '#AAA', textAlign: 'center' },
});

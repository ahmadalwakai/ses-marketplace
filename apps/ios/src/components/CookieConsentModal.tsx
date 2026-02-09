import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from 'react-native';
import { colors, spacing, radii, typography } from '../../theme/tokens';
import { setConsent, ConsentPreferences } from '../../lib/store/consent';

type Props = {
  visible: boolean;
  onDone: () => void;
};

export default function CookieConsentModal({ visible, onDone }: Props) {
  const [showCustomise, setShowCustomise] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const accept = async () => {
    await setConsent({ analytics: true, marketing: true, decided: true });
    onDone();
  };

  const decline = async () => {
    await setConsent({ analytics: false, marketing: false, decided: true });
    onDone();
  };

  const saveCustom = async () => {
    await setConsent({ analytics, marketing, decided: true });
    setShowCustomise(false);
    onDone();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.banner}>
          {showCustomise ? (
            /* --------- Customise panel --------- */
            <View style={{ gap: spacing.sm }}>
              <Text style={styles.title}>تخصيص ملفات تعريف الارتباط</Text>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>التحليلات</Text>
                <Switch
                  value={analytics}
                  onValueChange={setAnalytics}
                  trackColor={{ false: '#555', true: colors.accent }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>التسويق</Text>
                <Switch
                  value={marketing}
                  onValueChange={setMarketing}
                  trackColor={{ false: '#555', true: colors.accent }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.btnSave} onPress={saveCustom}>
                  <Text style={styles.btnSaveText}>حفظ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnCancel}
                  onPress={() => setShowCustomise(false)}
                >
                  <Text style={styles.btnCancelText}>إلغاء</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* --------- Main banner --------- */
            <View style={{ gap: spacing.sm }}>
              <Text style={styles.body}>
                نستخدم ملفات تعريف الارتباط لتحسين تجربتك. يمكنك اختيار تفضيلاتك
                أدناه.
              </Text>

              <TouchableOpacity style={styles.btnAccept} onPress={accept}>
                <Text style={styles.btnAcceptText}>قبول الكل</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.btnDecline} onPress={decline}>
                <Text style={styles.btnDeclineText}>رفض الكل</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnCustomise}
                onPress={() => setShowCustomise(true)}
              >
                <Text style={styles.btnCustomiseText}>تخصيص الخيارات</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: spacing.md,
  },
  banner: {
    backgroundColor: colors.text, // dark bg
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  title: {
    color: '#fff',
    fontSize: typography.subheading,
    fontWeight: '700',
    textAlign: 'right',
  },
  body: {
    color: '#fff',
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: 'right',
  },
  toggleRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  toggleLabel: {
    color: '#fff',
    fontSize: typography.body,
  },
  btnRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  /* Accept */
  btnAccept: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  btnAcceptText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: typography.body,
  },
  /* Decline */
  btnDecline: {
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  btnDeclineText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: typography.body,
  },
  /* Customise */
  btnCustomise: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  btnCustomiseText: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: typography.body,
  },
  /* Save / Cancel in customise panel */
  btnSave: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  btnSaveText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: typography.body,
  },
  btnCancel: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  btnCancelText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: typography.body,
  },
});

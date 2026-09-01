import { Document, Page, View, Text, StyleSheet, Font, renderToBuffer } from '@react-pdf/renderer'
import { formatCentavos } from './format'

// react-pdf's built-in "Helvetica" base font has no glyph for the peso sign (U+20B1) used by
// formatCentavos — it renders as a garbled/overlapping character. Noto Sans is registered
// instead specifically so the currency values on this certificate render correctly.
Font.register({
  family: 'Noto Sans',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/notosans/v42/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyD9A99d.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/notosans/v42/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyAaBN9d.ttf',
      fontWeight: 700,
    },
  ],
})

export interface MembershipCertificateData {
  customerName: string
  tierName: string
  activationFeeCentavos: number
  creditBalanceCentavos: number
  amountPaidCentavos: number
  expiryDateLabel?: string
  paymongoPaymentIntentId?: string | null
}

// Mirrors the brand palette in resend.ts (kept local rather than shared, matching that
// file's own convention of each file keeping its own copy).
const BRAND_DARK = '#4B2E2B'
const BRAND_MID = '#8C5A3C'
const BRAND_LIGHT = '#FDF3E7'
const ACCENT_PRIMARY = '#C08552'
const ACCENT_LIGHT = '#F5E6D3'

const styles = StyleSheet.create({
  page: {
    backgroundColor: BRAND_LIGHT,
    fontFamily: 'Noto Sans',
    fontWeight: 400,
  },
  header: {
    backgroundColor: BRAND_DARK,
    paddingVertical: 32,
    paddingHorizontal: 48,
  },
  headerBrand: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: ACCENT_LIGHT,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 26,
    color: BRAND_LIGHT,
    fontFamily: 'Noto Sans',
    fontWeight: 700,
  },
  body: {
    padding: 48,
  },
  customerName: {
    fontSize: 22,
    color: BRAND_DARK,
    fontFamily: 'Noto Sans',
    fontWeight: 700,
    marginBottom: 4,
  },
  tierName: {
    fontSize: 14,
    color: BRAND_MID,
    marginBottom: 24,
  },
  ledger: {
    borderWidth: 1,
    borderColor: ACCENT_LIGHT,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  ledgerLabel: {
    fontSize: 11,
    color: BRAND_MID,
  },
  ledgerValue: {
    fontSize: 11,
    color: BRAND_DARK,
    fontFamily: 'Noto Sans',
    fontWeight: 700,
  },
  ledgerTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: ACCENT_LIGHT,
  },
  ledgerTotalLabel: {
    fontSize: 11,
    color: BRAND_MID,
  },
  ledgerTotalValue: {
    fontSize: 11,
    color: ACCENT_PRIMARY,
    fontFamily: 'Noto Sans',
    fontWeight: 700,
  },
  expiryLine: {
    fontSize: 11,
    color: BRAND_MID,
    marginBottom: 4,
  },
  referenceLine: {
    fontSize: 9,
    color: BRAND_MID,
    marginBottom: 20,
  },
  approvedLine: {
    fontSize: 11,
    color: BRAND_DARK,
    fontFamily: 'Noto Sans',
    fontWeight: 700,
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 13,
    color: BRAND_DARK,
    fontFamily: 'Noto Sans',
    fontWeight: 700,
    marginBottom: 8,
  },
  perksBox: {
    backgroundColor: ACCENT_LIGHT,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  perkLine: {
    fontSize: 11,
    color: BRAND_DARK,
    marginBottom: 6,
  },
  rulesParagraph: {
    fontSize: 10,
    color: BRAND_MID,
    lineHeight: 1.5,
  },
})

function MembershipCertificateDocument({
  customerName,
  tierName,
  activationFeeCentavos,
  creditBalanceCentavos,
  amountPaidCentavos,
  expiryDateLabel,
  paymongoPaymentIntentId,
}: MembershipCertificateData) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerBrand}>Winston Sip &amp; Serve</Text>
          <Text style={styles.headerTitle}>Membership Certificate</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.customerName}>{customerName}</Text>
          <Text style={styles.tierName}>{tierName} Membership</Text>

          <View style={styles.ledger}>
            <View style={styles.ledgerRow}>
              <Text style={styles.ledgerLabel}>Activation Fee</Text>
              <Text style={styles.ledgerValue}>{formatCentavos(activationFeeCentavos)}</Text>
            </View>
            <View style={styles.ledgerRow}>
              <Text style={styles.ledgerLabel}>F&amp;B Credit</Text>
              <Text style={styles.ledgerValue}>{formatCentavos(creditBalanceCentavos)}</Text>
            </View>
            <View style={styles.ledgerTotalRow}>
              <Text style={styles.ledgerTotalLabel}>Total Paid</Text>
              <Text style={styles.ledgerTotalValue}>{formatCentavos(amountPaidCentavos)}</Text>
            </View>
          </View>

          {expiryDateLabel ? (
            <Text style={styles.expiryLine}>Membership Active Through {expiryDateLabel}</Text>
          ) : null}

          {paymongoPaymentIntentId ? (
            <Text style={styles.referenceLine}>
              PayMongo Payment Reference: {paymongoPaymentIntentId}
            </Text>
          ) : null}

          <Text style={styles.approvedLine}>Approved by Admin</Text>

          <Text style={styles.sectionHeading}>As a Member, You Get:</Text>
          <View style={styles.perksBox}>
            <Text style={styles.perkLine}>✓  Priority booking on courts &amp; simulators</Text>
            <Text style={styles.perkLine}>✓  Member rates on every session</Text>
            <Text style={[styles.perkLine, { marginBottom: 0 }]}>✓  Access to the Speakeasy Lounge</Text>
          </View>

          <Text style={styles.sectionHeading}>Rules &amp; Regulations</Text>
          <Text style={styles.rulesParagraph}>
            Detailed rules and regulations will be provided separately. Please check back soon.
          </Text>
        </View>
      </Page>
    </Document>
  )
}

export async function renderMembershipCertificatePdf(
  data: MembershipCertificateData,
): Promise<Buffer> {
  return renderToBuffer(<MembershipCertificateDocument {...data} />)
}

const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
const fs = require('fs');

const h1 = (text) => new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 150 } });
const p = (text) => new Paragraph({ children: [new TextRun(text)], spacing: { after: 150 } });
const bullet = (text) => new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 80 } });
const bold = (text) => new Paragraph({ children: [new TextRun({ text, bold: true })], spacing: { after: 150 } });

const doc = new Document({
  sections: [
    {
      properties: { page: { size: { width: 12240, height: 15840 } } },
      children: [
        new Paragraph({
          children: [new TextRun({ text: 'Terms of Service', bold: true, size: 44 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [new TextRun({ text: '[App Name] — Template, review with a lawyer before publishing', italics: true, color: '888888' })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [new TextRun({ text: 'Last updated: [DATE]', color: '888888' })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),

        h1('1. Acceptance of Terms'),
        p('By creating an account or using [App Name] (the "App"), you agree to these Terms of Service. If you do not agree, do not use the App.'),

        h1('2. What the App Is — and Is Not'),
        bold('The App is an interface and educational/practice tool. It is not a broker, dealer, custodian, or financial institution.'),
        bullet('The App provides a free demo (paper trading) account for practice, using simulated funds with no real-world value.'),
        bullet('If you choose to trade with real money, you must independently open and fund an account directly with a licensed third-party broker ("Broker"). The App does not open broker accounts on your behalf, does not hold or transmit your funds, and is not a party to your trading agreement with the Broker.'),
        bullet('All deposits, withdrawals, order execution, and custody of funds are handled solely by the Broker, under the Broker\u2019s own terms, fees, and regulatory license.'),
        bullet('We may receive a commission from the Broker for referring you as a client (see Section 6). This does not change the fact that your funds and trading relationship are with the Broker, not with us.'),

        h1('3. Eligibility'),
        p('You must be at least 18 years old (or the age of majority in your jurisdiction) and legally permitted to use trading services in your country to use this App. You are responsible for ensuring your use of the App and any connected Broker complies with the laws of your jurisdiction.'),

        h1('4. Account Registration'),
        bullet('You must provide accurate information when creating an account and keep your login credentials confidential.'),
        bullet('You are responsible for all activity that occurs under your account.'),
        bullet('We may suspend or terminate accounts that violate these Terms or applicable law.'),

        h1('5. Risk Disclosure'),
        bold('Trading forex and other leveraged financial products carries a high level of risk and may not be suitable for all investors.'),
        bullet('You can lose some or all of your invested capital; do not trade with money you cannot afford to lose.'),
        bullet('Past performance, including performance in the demo account, is not indicative of future results.'),
        bullet('Demo account performance may not reflect real-market conditions such as slippage, liquidity constraints, or emotional decision-making under real risk.'),
        bullet('We do not provide investment advice. Nothing in the App constitutes a recommendation to buy, sell, or hold any financial instrument.'),

        h1('6. Referral Commission Disclosure'),
        p('We participate in Introducing Broker / affiliate programs with licensed brokers. If you connect or open an account with a Broker through the App, we may receive a commission based on your trading activity or account opening. This commission is paid to us by the Broker and is not charged to you directly or deducted from your funds.'),

        h1('7. Fees'),
        p('The App itself may charge [subscription / premium feature fees — describe here]. Any fees charged by the Broker for deposits, withdrawals, spreads, or commissions are set solely by the Broker and disclosed in the Broker\u2019s own terms.'),

        h1('8. Intellectual Property'),
        p('The App, including its design, code, and content, is owned by us or our licensors and protected by intellectual property laws. You may not copy, modify, or distribute the App without permission.'),

        h1('9. Disclaimers and Limitation of Liability'),
        bullet('The App is provided "as is" without warranties of any kind.'),
        bullet('We are not liable for any trading losses, Broker actions or inactions, service interruptions, or data inaccuracies (including delayed or incorrect price/calendar data).'),
        bullet('To the maximum extent permitted by law, our total liability to you for any claim arising from use of the App is limited to the amount, if any, you paid us directly for App services in the preceding 12 months.'),

        h1('10. Termination'),
        p('We may suspend or terminate your access to the App at any time, with or without cause. You may stop using the App and delete your account at any time.'),

        h1('11. Changes to These Terms'),
        p('We may update these Terms from time to time. Continued use of the App after changes take effect constitutes acceptance of the revised Terms.'),

        h1('12. Governing Law'),
        p('These Terms are governed by the laws of [jurisdiction], without regard to conflict of law principles. [Add dispute resolution / arbitration clause as advised by counsel.]'),

        h1('13. Contact Us'),
        p('Questions about these Terms can be directed to: [support email / company address]'),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync('/home/claude/forex-app/legal/terms-of-service.docx', buffer);
  console.log('Terms of service written.');
});

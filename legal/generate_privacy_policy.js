const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
const fs = require('fs');

const h1 = (text) => new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 150 } });
const h2 = (text) => new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } });
const p = (text) => new Paragraph({ children: [new TextRun(text)], spacing: { after: 150 } });
const bullet = (text) => new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 80 } });

const doc = new Document({
  sections: [
    {
      properties: { page: { size: { width: 12240, height: 15840 } } },
      children: [
        new Paragraph({
          children: [new TextRun({ text: 'Privacy Policy', bold: true, size: 44 })],
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

        h1('1. Introduction'),
        p('[App Name] ("we", "us", "our") provides a mobile application that lets you practice forex trading in a demo account and, if you choose, connect your own account at a licensed third-party broker to trade with real funds. This Privacy Policy explains what information we collect, how we use it, and your choices.'),
        p('We do not hold, custody, or have direct access to your trading funds at any time. Real-money trading occurs entirely through your connected broker, under that broker\u2019s own terms and privacy practices.'),

        h1('2. Information We Collect'),
        h2('Account information'),
        bullet('Full name, email address, and password (stored as a secure hash — we never store your password in plain text)'),
        h2('Broker connection data'),
        bullet('Whether you have connected a broker account, and a permissioned access token used to display your trading data — we do not receive or store your broker account password'),
        h2('Usage data'),
        bullet('Demo trading activity (positions, orders, balances) used to operate the practice trading feature'),
        bullet('Device push notification token, if you enable notifications, used to send price alerts and trade updates'),
        h2('Automatically collected data'),
        bullet('Device type, operating system, and app usage analytics used to maintain and improve the app'),

        h1('3. How We Use Your Information'),
        bullet('To create and secure your account'),
        bullet('To operate demo trading and, once connected, to display your live broker account data within the app'),
        bullet('To send you push notifications you have opted into (price alerts, trade confirmations)'),
        bullet('To comply with legal obligations and prevent fraud or abuse'),
        bullet('To improve app performance and features'),

        h1('4. Sharing Your Information'),
        p('We share information only in these circumstances:'),
        bullet('With the licensed broker you choose to connect, solely to establish and maintain that connection'),
        bullet('With service providers who help us operate the app (e.g. cloud hosting, push notification delivery), under confidentiality obligations'),
        bullet('When required by law, regulation, or legal process'),
        p('We do not sell your personal information.'),

        h1('5. Data Security'),
        p('We use industry-standard measures, including password hashing and encrypted connections, to protect your information. No system is completely secure, and we cannot guarantee absolute security.'),

        h1('6. Your Rights and Choices'),
        bullet('You may access, update, or delete your account information by contacting us or using in-app settings'),
        bullet('You may disconnect your broker account at any time from within the app'),
        bullet('You may disable push notifications in your device settings'),
        bullet('Depending on your location, you may have additional rights under laws such as GDPR or CCPA, including the right to request a copy of your data or its deletion'),

        h1('7. Data Retention'),
        p('We retain account information for as long as your account is active, or as needed to comply with legal obligations, resolve disputes, and enforce our agreements.'),

        h1('8. Children\u2019s Privacy'),
        p('This app is not intended for individuals under 18. We do not knowingly collect information from minors. If you believe a minor has provided us information, please contact us to have it removed.'),

        h1('9. Changes to This Policy'),
        p('We may update this Privacy Policy from time to time. We will notify you of material changes via the app or by email.'),

        h1('10. Contact Us'),
        p('Questions about this Privacy Policy can be directed to: [support email / company address]'),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync('/home/claude/forex-app/legal/privacy-policy.docx', buffer);
  console.log('Privacy policy written.');
});

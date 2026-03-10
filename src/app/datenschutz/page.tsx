export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#94a3b8] px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-black text-[#f8fafc] mb-8">Datenschutzerklärung</h1>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-[#f8fafc] mb-2">1. Datenschutz auf einen Blick</h2>
          <h3 className="font-semibold text-[#cbd5e1] mt-4 mb-1">Allgemeine Hinweise</h3>
          <p className="text-sm leading-relaxed">
            Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten
            passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie
            persönlich identifiziert werden können.
          </p>
          <h3 className="font-semibold text-[#cbd5e1] mt-4 mb-1">Datenerfassung auf dieser Website</h3>
          <p className="text-sm leading-relaxed">
            Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten
            können Sie dem Impressum dieser Website entnehmen.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-[#f8fafc] mb-2">2. Verantwortlicher</h2>
          <p className="text-sm leading-relaxed">
            Daniel Alisch<br />
            SmartApps UG (in Gründung)<br />
            Zum Weizenring 1, 14469 Potsdam<br />
            E-Mail: <a href="mailto:daniel.alisch@me.com" className="text-teal-400 hover:underline">daniel.alisch@me.com</a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-[#f8fafc] mb-2">3. Welche Daten wir erheben</h2>
          <p className="text-sm leading-relaxed mb-2">Bei der Registrierung und Nutzung von forkly.site verarbeiten wir:</p>
          <ul className="text-sm list-disc list-inside space-y-1">
            <li>E-Mail-Adresse und Name (Registrierung)</li>
            <li>Passwort (verschlüsselt gespeichert, nie im Klartext)</li>
            <li>Mahlzeitenpläne und Rezeptpräferenzen (Kernfunktion)</li>
            <li>Zahlungsdaten (werden ausschließlich von Stripe verarbeitet, nicht bei uns gespeichert)</li>
            <li>Server-Logs (IP-Adresse, Zeitstempel) zur Absicherung des Betriebs</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-[#f8fafc] mb-2">4. Rechtsgrundlage der Verarbeitung</h2>
          <p className="text-sm leading-relaxed">
            Die Verarbeitung Ihrer Daten erfolgt auf Basis von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)
            für die Kernfunktionen der App sowie Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse) für den
            sicheren Betrieb der Infrastruktur.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-[#f8fafc] mb-2">5. Speicherdauer</h2>
          <p className="text-sm leading-relaxed">
            Ihre Daten werden gespeichert, solange Ihr Konto aktiv ist. Nach Löschung des Kontos werden alle
            personenbezogenen Daten innerhalb von 30 Tagen gelöscht, sofern keine gesetzliche Aufbewahrungspflicht
            besteht.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-[#f8fafc] mb-2">6. Drittanbieter</h2>
          <h3 className="font-semibold text-[#cbd5e1] mt-4 mb-1">Stripe (Zahlungsabwicklung)</h3>
          <p className="text-sm leading-relaxed">
            Für die Zahlungsabwicklung nutzen wir Stripe (Stripe, Inc., 354 Oyster Point Blvd, San Francisco, CA).
            Stripe verarbeitet Ihre Zahlungsdaten gemäß der Stripe-Datenschutzrichtlinie
            (<a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">stripe.com/de/privacy</a>).
            Wir selbst speichern keine Kreditkartendaten.
          </p>
          <h3 className="font-semibold text-[#cbd5e1] mt-4 mb-1">Spoonacular (Rezept-API)</h3>
          <p className="text-sm leading-relaxed">
            Rezeptdaten werden von der Spoonacular API bezogen. Dabei werden keine personenbezogenen Daten an
            Spoonacular übermittelt.
          </p>
          <h3 className="font-semibold text-[#cbd5e1] mt-4 mb-1">OpenAI (KI-Bildanalyse)</h3>
          <p className="text-sm leading-relaxed">
            Für die Rezeptkarten-Scan-Funktion nutzen wir die API von OpenAI, Inc. (San Francisco, USA). Wenn Sie
            ein Foto einer Rezeptkarte scannen, wird dieses Bild zur Analyse an OpenAI übertragen. OpenAI verarbeitet
            die Bilddaten gemäß seiner Datenschutzrichtlinie (<a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">openai.com/policies/privacy-policy</a>).
            Die Datenübermittlung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) sowie
            ggf. auf Basis von Standardvertragsklauseln (Art. 46 DSGVO) für die Übermittlung in die USA.
            Die Scan-Funktion ist optional — Sie können Rezepte auch manuell eingeben.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-[#f8fafc] mb-2">7. Ihre Rechte</h2>
          <p className="text-sm leading-relaxed mb-2">Sie haben jederzeit das Recht auf:</p>
          <ul className="text-sm list-disc list-inside space-y-1">
            <li>Auskunft über Ihre gespeicherten Daten (Art. 15 DSGVO)</li>
            <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
            <li>Löschung Ihrer Daten (Art. 17 DSGVO)</li>
            <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
            <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
            <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
          </ul>
          <p className="text-sm leading-relaxed mt-2">
            Zur Datenlöschung (Art. 17 DSGVO) können Sie Ihr Konto direkt in der App unter „Profil → Konto dauerhaft löschen" selbst entfernen. Alle zugehörigen Daten werden sofort gelöscht.
            Für alle anderen Anfragen wenden Sie sich bitte an:{" "}
            <a href="mailto:daniel.alisch@me.com" className="text-teal-400 hover:underline">daniel.alisch@me.com</a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-[#f8fafc] mb-2">8. Beschwerderecht</h2>
          <p className="text-sm leading-relaxed">
            Sie haben das Recht, sich bei der zuständigen Datenschutzaufsichtsbehörde zu beschweren. Die
            zuständige Behörde für Brandenburg ist der Landesbeauftragte für den Datenschutz und für das Recht auf
            Akteneinsicht Brandenburg.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-[#f8fafc] mb-2">9. Cookies</h2>
          <p className="text-sm leading-relaxed">
            Diese Website verwendet ausschließlich technisch notwendige Cookies für die Sitzungsverwaltung
            (Login-Session). Es werden keine Tracking- oder Analyse-Cookies eingesetzt.
          </p>
        </section>

        <p className="text-xs text-[#475569] mt-12">
          Stand: März 2026
        </p>
      </div>
    </div>
  );
}

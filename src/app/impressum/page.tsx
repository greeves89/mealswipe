export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#94a3b8] px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-black text-[#f8fafc] mb-8">Impressum</h1>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-[#f8fafc] mb-2">Angaben gemäß § 5 TMG</h2>
          <p>Daniel Alisch</p>
          <p>SmartApps UG (in Gründung)</p>
          <p>Zum Weizenring 1</p>
          <p>14469 Potsdam</p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-[#f8fafc] mb-2">Kontakt</h2>
          <p>E-Mail: <a href="mailto:daniel.alisch@me.com" className="text-teal-400 hover:underline">daniel.alisch@me.com</a></p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-[#f8fafc] mb-2">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
          <p>Daniel Alisch</p>
          <p>Zum Weizenring 1</p>
          <p>14469 Potsdam</p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-[#f8fafc] mb-2">Haftungsausschluss</h2>
          <h3 className="font-semibold text-[#cbd5e1] mt-4 mb-1">Haftung für Inhalte</h3>
          <p className="text-sm leading-relaxed">
            Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den
            allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht
            verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen
            zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
          </p>
          <h3 className="font-semibold text-[#cbd5e1] mt-4 mb-1">Haftung für Links</h3>
          <p className="text-sm leading-relaxed">
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben.
            Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der
            verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-[#f8fafc] mb-2">Urheberrecht</h2>
          <p className="text-sm leading-relaxed">
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen
            Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
            Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
          </p>
        </section>

        <p className="text-xs text-[#475569] mt-12">
          Stand: März 2026
        </p>
      </div>
    </div>
  );
}

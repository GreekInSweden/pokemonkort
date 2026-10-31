// Regler som visas längst ner på /giveaway. Ändra texten här.
export default function GiveawayRules() {
  return (
    <section className="mt-12 border-t border-line pt-8" aria-labelledby="giveaway-rules">
      <h2 id="giveaway-rules" className="font-display text-xl font-semibold text-paper mb-4">
        Regler för giveaway
      </h2>
      <ul className="space-y-3 text-sm text-paper/90 list-disc pl-5">
        <li>
          <strong>Arrangör:</strong> Giveawayen arrangeras av Atlas Network Structure AB, som driver
          Kortmarknad.
        </li>
        <li>
          <strong>Gratis att delta:</strong> Det kostar ingenting att delta och ingen vara behöver
          köpas. Du behöver bara vara medlem och inloggad. Vissa giveaways kan vara öppna enbart för
          betalande medlemmar; det anges i så fall tydligt på sidan.
        </li>
        <li>
          <strong>En anmälan per medlem:</strong> Varje medlem kan delta en gång per giveaway. Du kan
          dra dig ur fram till att anmälan stänger. Vi förbehåller oss rätten att utesluta konton som
          missbrukar systemet, till exempel flera konton för samma person.
        </li>
        <li>
          <strong>Dragning:</strong> Vinnaren lottas slumpmässigt bland alla anmälda deltagare i
          samband med att anmälan stänger. Dragningen visas live på den här sidan. Vissa giveaways
          öppnar först när ett visst antal medlemmar är nått; det framgår då av sidan.
        </li>
        <li>
          <strong>Vinnaren:</strong> Vinnaren visas på sidan med sitt användarnamn eller
          medlemsnummer, aldrig med sitt riktiga namn. Vi kontaktar vinnaren via meddelande under
          Mitt konto och på annat sätt vid behov. Hör vinnaren inte av sig inom rimlig tid kan vi dra en ny
          vinnare.
        </li>
        <li>
          <strong>Vinsten:</strong> Vinsten anges i respektive giveaway. Den kan inte bytas mot
          pengar. Vi skickar vinsten utan kostnad till vinnaren inom Sverige.
        </li>
        <li>
          <strong>Personuppgifter:</strong> Vi använder dina uppgifter bara för att genomföra
          giveawayen och kontakta vinnaren.
        </li>
        <li>
          <strong>Inget samarbete med Pokémon:</strong> Giveawayen är inte sponsrad, godkänd eller
          på annat sätt kopplad till Nintendo, Creatures, GAME FREAK, The Pokémon Company eller
          andra rättighetshavare. Pokémon och Pokémon-karaktärer är varumärken som tillhör respektive ägare.
        </li>
      </ul>
    </section>
  );
}

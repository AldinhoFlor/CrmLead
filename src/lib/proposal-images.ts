// Curated stock imagery per business segment. Used as visual enhancement;
// each <img> falls back to the brand gradient if it fails to load.
const P = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=80`;

const SETS: { match: RegExp; imgs: string[] }[] = [
  {
    match: /odonto|dent|orto|sorriso/i,
    imgs: [
      "photo-1629909613654-28e377c37b09",
      "photo-1606811841689-23dfddce3e95",
      "photo-1588776814546-1ffcf47267a5",
      "photo-1609840114035-3c981b782dfe",
      "photo-1519494026892-80bbd2d6fd0d",
    ],
  },
  {
    match: /est[eé]tica|pele|dermato|beleza|cosm/i,
    imgs: [
      "photo-1570172619644-dfd03ed5d881",
      "photo-1596178065887-1198b6148b2b",
      "photo-1512290923902-8a9f81dc236c",
      "photo-1487412947147-5cebf100ffc2",
      "photo-1519823551278-64ac92734fb1",
    ],
  },
  {
    match: /cl[ií]nica|m[eé]dic|sa[uú]de|consult[oó]rio|nutri/i,
    imgs: [
      "photo-1519494026892-80bbd2d6fd0d",
      "photo-1576091160399-112ba8d25d1d",
      "photo-1631217868264-e5b90bb7e133",
      "photo-1580281658626-ee379f3cce93",
      "photo-1584982751601-97dcc096659c",
    ],
  },
  {
    match: /restaurant|churrasc|pizzar|lanch|food|bar|caf[eé]|buffet|padaria/i,
    imgs: [
      "photo-1544025162-d76694265947",
      "photo-1600891964092-4316c288032e",
      "photo-1517248135467-4c7edcad34c4",
      "photo-1414235077428-338989a2e8c0",
      "photo-1555396273-367ea4eb4db5",
    ],
  },
  {
    match: /constru|marmor|pedra|reforma|engenh|arquitet|material/i,
    imgs: [
      "photo-1503387762-592deb58ef4e",
      "photo-1600585154340-be6161a56a0c",
      "photo-1581094794329-c8112a89af12",
      "photo-1541888946425-d81bb19240f5",
      "photo-1504307651254-35680f356dfd",
    ],
  },
  {
    match: /academia|fitness|cross|pilates|gym/i,
    imgs: [
      "photo-1534438327276-14e5300c3a48",
      "photo-1571902943202-507ec2618e8f",
      "photo-1517836357463-d25dfeac3438",
      "photo-1550345332-09e3ac987658",
      "photo-1518611012118-696072aa579a",
    ],
  },
  {
    match: /pet|veterin|animal/i,
    imgs: [
      "photo-1601758228041-f3b2795255f1",
      "photo-1516734212186-a967f81ad0d7",
      "photo-1548767797-d8c844163c4c",
      "photo-1583337130417-3346a1be7dee",
      "photo-1518717758536-85ae29035b6d",
    ],
  },
  {
    match: /advoc|jur[ií]dic|contab|escrit[oó]rio/i,
    imgs: [
      "photo-1589829545856-d10d557cf95f",
      "photo-1521791136064-7986c2920216",
      "photo-1450101499163-c8848c66ca85",
      "photo-1454165804606-c3d57bc86b40",
      "photo-1524749292158-7540c2494485",
    ],
  },
];

const GENERIC = [
  "photo-1497366216548-37526070297c",
  "photo-1600880292203-757bb62b4baf",
  "photo-1552664730-d307ca884978",
  "photo-1521737711867-e3b97375f902",
  "photo-1556761175-b413da4baf72",
];

export function imagesForSegment(segment: string | null): string[] {
  if (segment) for (const { match, imgs } of SETS) if (match.test(segment)) return imgs.map(P);
  return GENERIC.map(P);
}

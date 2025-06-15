export const popularMaps = {
  world: "World",
  "diverse-world": "Diverse World",
  "urban-world": "Urban World",
  "famous-places": "Famous Places",

  europe: "Europe",
  africa: "Africa",
  asia: "Asia",
  oceania: "Oceania",
  ukraine: "Ukraine",
  "north-america": "North America",
  "south-america": "South America",
  "european-union": "European Union",

  us: "United States",
  uk: "United Kingdom",
  japan: "Japan",
  sweden: "Sweden",
  france: "France",
  germany: "Germany",
  canada: "Canada",
  australia: "Australia",
  brazil: "Brazil",
  russia: "Russia",
  spain: "Spain",
  italy: "Italy",

  "62a44b22040f04bd36e8a914": "A Community World",
  "5d73f83d82777cb5781464f2": "A Balanced World",
  "616015f16795c20001613e49": "An Educated World",
  "59662b185199be7d6438d132": "A Diverse World",
  "6029991c5048850001d572a9": "A Pinpointable World",
  "5cd30a0d17e6fc441ceda867": "An Extraordinary World",
  "6078c830e945e900015f4a64": "A Learning World",
  "6089bfcff6a0770001f645dd": "An Arbitrary World",
  "5b0a80f8596695b708122809": "An Improved World",
  "59e940ed39d855c868104b32": "GeoBettr World - Replayable",
  "65c86935d327035509fd616f": "A Rainbolt World",
  "5e81b3e32bd8911388d65a4c": "A No Move World",

  "5d0ce72c8b19a91fe05aa7a8": "Flags of the World",
  "61a1846aee665b00016680ce": "Fun with Flags!",
  "60de2a8a81b92c00015f29e1": "The 198 Capitals Of The World",
  "60de2a8a81b92c00010f29e1": "The 198 Capitals Of The World",
  "56e45886dc7cd6a164e861ac": "US Cities",
  "5bbb74ce2c01735208560cf6": "World Cities",
  "5d26eb1741d2a43c1cd4524b": "US State Capitols",
  "56f28536148a781b143b0c3b": "European stadiums",
  "5cfda2c9bc79e16dd866104d": "I Saw The Sign 2.0",
  "5754651a00a27f6f482a2a3d": "Where's that Mcdonald's?",
  "5b5a0286632c4e64ec41dd8c": "Restaurant interiors",
  "5f9b1d4a6a59940001a4f9ae": "Airport Runways",
  "5ed59e1f375e6a6a68a2d227": "All the Wetherspoons",
  "5fa381d0e27b4900014e0732": "Interesting Photospheres in Obscure Countries",
  "5d374dc141d2a43c1cd4527b": "GeoDetective",
  "5dbaf08ed0d2a478444d2e8e": "AI Generated World",
  "6284d140132039d9a7f1e265": "Urban Hell",
  "6737723f1207048de469c169": "A Diverse World",

  "5b0d907bfaa4cf3ce43bc6b1": "500 000 lieux en France métropolitaine !",
  "5eb5ea048734a02c543f2ae1": "La Diversité Française ",

  "57357d9f77abe957e8cfd15f": "Dumb test",
  "57357d9f77abe957e8cfd10f": "Dumb test",
};

export function getMapName(event) {
  if (!event?.liveChallenge?.state?.options) return "Unknown Map";
  const mapSlug = event.liveChallenge.state.options.mapSlug;
  const mapName = event.liveChallenge.state?.mapName;

  let slug;
  if (typeof mapSlug === "string" && mapSlug.trim() !== "") {
    slug = mapSlug;
  } else if (typeof mapName === "string" && mapName.trim() !== "") {
    slug = mapName;
  } else {
    slug = "";
  }

  const displayName = popularMaps[slug];
  if (displayName) {
    return displayName;
  }

  if (typeof slug === "string" && slug.trim() !== "") {
    return slug;
  }

  return "Unknown Map";
}

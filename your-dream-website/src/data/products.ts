import { getProductImageUrl, FALLBACK_IMAGE_PATH } from "@/lib/productImages";

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  gender: "men" | "women" | "mix";
  description?: string;
  sizes?: string[];
  topNotes?: string[];
  middleNotes?: string[];
  baseNotes?: string[];
}

// Helper function to get image by index (fallback when no specific asset)
const getImageByIndex = (_index: number): string =>
  getProductImageUrl(FALLBACK_IMAGE_PATH);

// All women's perfumes from the images
const womensPerfumes = [
  "ACQUA DI GIOIA", "ANGE ÉTRANGE", "ANGEL", "ANGEL ELIXIR", "ALIEN", "ALIEN OUD",
  "ARMANI CODE", "ARMANI CODE CASHMERE", "AZZARO MADEMOISELLE", "BRITNEY SPEARS",
  "BURBERRY", "BURBERRY HER", "BURBERRY GODDESS", "BURBERRY BODY", "BURBERRY ELIXIR",
  "BECAUSE IT'S YOU", "BRIGHT CRYSTAL", "BLACK OPIUM", "BOMB SHELL", "BOMB FLOWER",
  "BVLGARI OMNIA", "BLACK XS", "CHANEL CHANCE", "CHANCE EAU TENDRE", "CHANEL ALLURE",
  "CHANEL NO 5", "CHANEL EAU VIVE", "COCO MADEMOISELLE", "COCO CHANEL NOIR",
  "COOL WATER DAVIDOFF", "CRYSTAL NOIR", "CRAZY IN LOVE", "CAROLINA HERRERA",
  "CREED ROYAL", "CANDY PRADA", "DIOR ADDICT", "DOLCE&GABBANA", "DELINA EXCLUSIF",
  "DEVOTION", "EUPHORIA", "ESCADA TAJ", "ESCADA COLLECTION", "ESCADA MAGNETISM",
  "ESCADA CHERRY", "ESCADA MOON SPARKLE", "ESCADA FLOR DEL SOL", "ELIE SAAB GIRL OF NOW",
  "ELIE SAAB", "ELIE SAAB NOIR", "FAME", "FAR AWAY", "GUCCI BLOOM", "GUCCI GUILTY",
  "GUCCI RUSH", "GUCCI BAMBOO", "GUCCI FLORA GORGEOUS ORCHID", "GUCCI FLORA GORGEOUS MAGNOLIA",
  "GOOD GIRL", "GOOD GIRL BUSH", "GOOD GIRL VERY GLAM", "GIVENCHY IRRESISTIBLE",
  "GEORGINA'S SENSE", "HUGO BOSS", "HYPNOSE", "HYPNOTIC POISON", "HAWAI", "IDÔLE",
  "INSOLENCE", "ICELAND", "ISSEY MIYAKE", "J'ADORE", "JOY", "KENZO FLOWER",
  "KAYALI VANILLA 28", "KAYALI SWEET BANANA", "KAYALI VANILLA OUD", "KAYALI MARSHMALLOW",
  "KAYALI FLOWER MUSC ROSE ROYAL", "KAYALI PISTACHIO", "LIBRE", "LIBRE FLOWERS",
  "LIBRE INTENSE", "L'INSTANT DE GUERLAIN", "LA PETITE ROBE", "LA NUIT TRÉSOR",
  "LIGHT BLUE", "LACOSTE TOUCH OF PINK", "LADY MILLION", "LE BOUQUET ABSOLU",
  "L'INTERDIT GIVENCHY", "L'INTERDIT ROUGE", "LA VIE EST BELLE", "LA BELLE JPG",
  "L'EAU D'ISSEY", "LOVE ME MORE", "LOVER DOSE", "LOVE DELIGHT AMOUAGE",
  "MIDNIGHT FANTASY", "MISS DIOR", "MISS DIOR BLOOMING BOUQUET", "MY WAY",
  "MON PARIS", "MONTALE ROSE MUSK", "MONT BLANC FEMME INDIVIDUELLE",
  "MONT BLANC LADY EMBLEM", "MONT BLANC SIGNATURE", "MANIFESTO", "MON GUERLAIN",
  "NARCISO BLACK", "NARCISO PINK", "NARCISO JASMINE MUSC", "NARCISO FLOWER MUSC",
  "NARCISO ROSE MUSC", "NARCISO MUSC ROSE NOIR", "NARCISO POUDRE", "OLYMPÉA",
  "PURE POISON", "PARIS HILTON", "PURE XS", "POÊME", "PREMIER JOUR", "PRADA PARADOXE",
  "Q D&G", "RICCI RICCI", "ROBERTO CAVALLI", "ROBERTO CAVALLI PARADISE", "RALPH",
  "SAMSARA GUERLAIN", "SUPREME BOUQUET", "SI", "SI INTENSE", "SI PASSIONE",
  "SI PASSIONE INTENSE", "SCANDAL", "SEXY GRAFITTI", "SAHARA NOIR T.F.", "TOSCA",
  "TWILLY D'HERMES", "THE ONE", "TRESOR", "TRESOR MIDNIGHT ROSE", "TODAY",
  "TOM FORD METALLIQUE", "TOM FORD ORCHID SOLEIL", "TOM FORD SOLEIL BRULANT",
  "VALENTINO BORN IN ROMA INTENSE", "VERSACE DYLAN PURPLE", "VERSACE DYLAN BLUE",
  "VERSACE EROS", "VERY SEXY NOW", "VERY IRRESISTIBLE", "WASHWASHA BY LATTAFA",
  "YARA MOI", "YARA PINK", "212", "212 SEXY", "212 VIP", "212 VIP ROSE", "حريم السلطان"
];

// All men's perfumes from the images
const mensPerfumes = [
  "ACQUA DI GIO", "ACQUA DI GIO PROFUMO", "ACQUA DI GIO PROFONDO", "ACQUA DI GIO ABSOLU",
  "ACQUA DI GIO EXTRA", "ACQUA DI SILVA", "ARMANI CODE", "ARMANI CODE ICE",
  "ALLURE CHANEL", "ALLURE SPORT CHANEL", "AMBER PRADA", "AZZARO CHROME",
  "AZZARO WANTED", "AZZARO CHROME UNITED", "ARAMIS 900", "ASAD BOURBON", "ANGEL",
  "BLEU DE CHANEL", "BOSS BOTTLED", "BOSS BOTTLED ELIXIR", "BOSS BOTTLED INTENSE",
  "BOSS BOTTLED OUD", "BOSS BOTTLED ABSOLU", "BOSS THE SCENT", "BOSS THE SCENT ELIXIR",
  "BOSS ORANGE", "BLACK XS", "BLACK XS L'APHRODISIAQUE", "BURBERRY", "BURBERRY HERO",
  "BVLGARI BLUE", "BVLGARI MEN", "BVLGARI MAN IN BLACK", "BVLGARI WOOD ESSENCE",
  "BLUE JEANS", "BLUE LABEL", "CKI", "CK SHOCK", "CREED AVENTUS", "CREED SILVER MOUNTAIN",
  "CAROLINA HERRERA", "CREED AVENTUS ABSOLU", "CAROLINA HERRERA CLASSIC",
  "CAROLINA HERRERA CHIC", "CARLISLE DE MARLY", "CHOPARD OUD MALAKI",
  "CARTIER DECLARATION", "CACHAREL", "DAVIDOFF HOT WATER", "DAVIDOFF COOL WATER",
  "DAVIDOFF ADVENTURE", "DAVIDOFF CHAMPION", "DIOR HOMME", "DIOR HOMME SPORT",
  "DIOR INTENSE", "DIOR HIGHER", "DOLCE&GABBANA", "D&G LIGHT BLUE", "D&G K",
  "DYLAN BLUE", "DRAKKAR NOIR", "DUNHILL ICON", "DUNHILL DARK BLUE", "DUNHILL DESIRE",
  "DUNHILL DESIRE BLUE", "EAU SAUVAGE", "EUPHORIA", "EROS FLAME", "EHSAAS",
  "ENCRE NOIR", "ETERNITY", "EGOISTE PLATINUM", "FAHRENHEIT", "FERRARI RED",
  "GIVENCHY PLAY", "GIVENCHY PLAY SPORT", "GIVENCHY GENTLEMAN", "GIVENCHY PI",
  "GUCCI GUILTY", "HUMMER", "HUGO BOSS", "HABIT ROUGE", "HUGO BOSS ENERGIZE", "H 24",
  "ISSEY MIYAKE", "INVICTUS", "INVICTUS VICTORY", "INVICTUS PLATINUM", "INVICTUS PARFUM",
  "INVICTUS VICTORY ELIXIR", "INSURRECTION", "JOOP", "JAGUAR", "JAVANESE PATCHOULI",
  "KENZO", "KOUROS", "LE MALE", "LE MALE ELIXIR", "LE MALE LE BEAU", "LE MALE LOVER",
  "LE MALE LE PARFUM", "L'IMMENSITÉ LV", "LACOSTE WHITE", "LACOSTE RED",
  "LACOSTE POUR L'HOMME", "LAYTON DE MARLY", "LA NUIT DE L'HOMME", "LEXUS",
  "LANVIN", "LAPIDUS", "LAIL MALAKI", "MONT BLANC LEGEND", "MONT BLANC LEGEND RED",
  "MONT BLANC LEGEND SPIRIT", "MONT BLANC EXPLORER", "MONT BLANC INDIVIDUELLE",
  "MYSELF YSL", "MR BURBERRY", "NAUTICA VOYAGE", "NARCISO BLEU NOIR", "M.J. WEEKEND",
  "OMBRE LEATHER", "OMBRE NOMADE LV", "ONE MILLION", "ONE MILLION OUD",
  "ONE MILLION LUCKY", "ONE MILLION ELIXIR", "POLO RED", "POLO BLACK", "POLO BLUE",
  "PACO RABANNE PHANTOM", "PACO RABANNE MEN", "PRADA L'HOMME", "PARFUMS DE MARLY ALTHAÏR",
  "PASHA DE CARTIER", "PLEASURES", "PURE XS", "ROBERTO CAVALLI", "RED TABACCO MANCERA",
  "ROMA", "RASASI HAWAS", "RASASI AL WISAM", "SAUVAGE", "SAUVAGE ELIXIR",
  "STRONGER WITH YOU", "STRONGER WITH YOU INTENSELY", "SWY ABSOLUTELY", "SWY OUD",
  "SWY PARFUM", "STRONG ME", "SILVER SCENT", "SCANDAL POUR HOMME", "SHADOWS",
  "SEDUCTION BLACK", "SPICE BOMB EXTREME", "SPICE BOMB", "SPICE BOMB INFRARED",
  "SCULPTURE HOMME", "TABAC", "TOBACCO VANILLE", "THE MOST WANTED",
  "TOM FORD NOIR DE NOIR", "TOM FORD OUD WOOD", "TOM FORD NOIR EXTREME", "THE ONE",
  "TERRE D'HERMES", "TUXEDO", "ULTRA MALE", "VÉTIVER DE GUERLAIN", "VERSACE POUR HOMME",
  "VERSACE EAU FRAICHE", "VERSACE EROS", "VALENTINO UOMO", "VALENTINO UOMO NOIR ABSOLU",
  "VALENTINO UOMO BORN N ROME", "VALENTINO UAMO BORN IN ROME INTENSE", "WOOD MYSTIQUE",
  "Y", "Y LE PARFUM", "Y INTENSE", "212 VIP", "212 SEXY", "212 VIP BLACK", "212 MEN", "دارج"
];

// Helper function to get image for women's products (name → matching asset)
const getWomensProductImage = (name: string, index: number): string => {
  const imageMap: Record<string, string> = {
    "ACQUA DI GIOIA": getProductImageUrl("WOMEN/ACQUA DI GIOIA.png"),
    "ALIEN": getProductImageUrl("WOMEN/ALIEN.png"),
    "ALIEN OUD": getProductImageUrl("WOMEN/ALIEN OUD.png"),
    "ANGE ÉTRANGE": getProductImageUrl("WOMEN/ANGE ETRANGE.png"),
    "212": getProductImageUrl("MEN/212 VIP.png"),
    "212 SEXY": getProductImageUrl("MEN/212 SEXY.png"),
    "212 VIP": getProductImageUrl("MEN/212 VIP.png"),
    "212 VIP ROSE": getProductImageUrl("WOMEN/212 VIP ROSE.png"),
    "ARMANI CODE": getProductImageUrl("WOMEN/ARMANI CODE.png"),
    "ARMANI CODE CASHMERE": getProductImageUrl("WOMEN/ARMANI CODE CASHMERE.png"),
    "ANGEL": getProductImageUrl("MEN/ANGEL BOURBON.png"),
    "ANGEL ELIXIR": getProductImageUrl("WOMEN/ANGEL ELIXIR.png"),
    "BLACK XS": getProductImageUrl("MEN/BLACK XS.png"),
    "BLEU DE CHANEL": getProductImageUrl("MEN/BLEU DE CHANEL.png"),
    "BURBERRY": getProductImageUrl("MEN/BURBERRY.png"),
    "BURBERRY HER": getProductImageUrl("WOMEN/BURBERRY HER.png"),
    "BURBERRY GODDESS": getProductImageUrl("WOMEN/BURBERRY GODDESS.png"),
    "BURBERRY BODY": getProductImageUrl("WOMEN/BURBERRY BODY.png"),
    "BURBERRY ELIXIR": getProductImageUrl("WOMEN/BURBERRY ELIXIR.png"),
    "CAROLINA HERRERA": getProductImageUrl("MEN/CAROLINA HERRERA .png"),
    "CAROLINA HERRERA CHIC": getProductImageUrl("MEN/CAROLINA HERRERA CHIC.png"),
    "CAROLINA HERRERA CLASSIC": getProductImageUrl("MEN/CAROLINA HERRERA CLASSIC.png"),
    "CHANEL ALLURE": getProductImageUrl("MEN/ALLURE CHANEL.png"),
    "ALLURE SPORT CHANEL": getProductImageUrl("MEN/ALLURE HOMME SPORT.png"),
    "AZZARO MADEMOISELLE": getProductImageUrl("WOMEN/AZZARO MADEMOISELLE.png"),
    "BECAUSE IT'S YOU": getProductImageUrl("WOMEN/BECAUSE ITS YOU.png"),
    "BLACK OPIUM": getProductImageUrl("WOMEN/BLACK OPIUM.png"),
    "BOMB FLOWER": getProductImageUrl("WOMEN/BOMB FLOWER.png"),
    "BOMB SHELL": getProductImageUrl("WOMEN/BOMB SHELL.png"),
    "BRIGHT CRYSTAL": getProductImageUrl("WOMEN/BRIGHT CRYSTAL.png"),
    "BRITNEY SPEARS": getProductImageUrl("WOMEN/BRITNEY SPEARS.png"),
    "BVLGARI OMNIA": getProductImageUrl("WOMEN/BVLGARI OMNIA.png"),
    "CHANEL CHANCE": getProductImageUrl("WOMEN/CHANEL CHANCE.png"),
    "CHANCE EAU TENDRE": getProductImageUrl("WOMEN/CHANCE EAU TENDRE.png"),
    "CHANEL NO 5": getProductImageUrl("WOMEN/CHANEL N5.png"),
    "CANDY PRADA": getProductImageUrl("WOMEN/CANDY PRADA.png"),
    "COCO CHANEL NOIR": getProductImageUrl("WOMEN/COCO CHANEL NOIR.png"),
    "CRAZY IN LOVE": getProductImageUrl("WOMEN/CRAZY IN LOVE.png"),
    "CREED ROYAL": getProductImageUrl("WOMEN/CREED ROYAL.png"),
    "CRYSTAL NOIR": getProductImageUrl("WOMEN/CRYSTAL NOIR.png"),
    "DELINA EXCLUSIF": getProductImageUrl("WOMEN/DELINA EXCLUSIF.png"),
    "DEVOTION": getProductImageUrl("WOMEN/DEVOTION.png"),
    "DIOR ADDICT": getProductImageUrl("WOMEN/DIOR ADDICT.png"),
    "ELIE SAAB GIRL OF NOW": getProductImageUrl("WOMEN/ELIE SAAB GIRL OF NOW.png"),
    "ELIE SAAB": getProductImageUrl("WOMEN/ELIE SAAB.png"),
    "ELIE SAAB NOIR": getProductImageUrl("WOMEN/ELIE SAAB NOIR.png"),
    "ESCADA CHERRY": getProductImageUrl("WOMEN/ESCADA CHERRY.png"),
    "ESCADA COLLECTION": getProductImageUrl("WOMEN/ESCADA COLLECTION.png"),
    "ESCADA FLOR DEL SOL": getProductImageUrl("WOMEN/ESCADA FLOR DEL SOL.png"),
    "ESCADA MAGNETISM": getProductImageUrl("WOMEN/ESCADA MAGNETISM.png"),
    "ESCADA MOON SPARKLE": getProductImageUrl("WOMEN/ESCADA MOON SPARKLE.png"),
    "ESCADA TAJ": getProductImageUrl("WOMEN/ESCADA TAJ.png"),
    "CHANEL EAU VIVE": getProductImageUrl("WOMEN/CHANEL EAU VIVE.png"),
    "COCO MADEMOISELLE": getProductImageUrl("WOMEN/COCO MADEMOISELLE.png"),
    "FAME": getProductImageUrl("WOMEN/FAME.png"),
    "FAR AWAY": getProductImageUrl("WOMEN/FAR AWAY.png"),
    "GEORGINA'S SENSE": getProductImageUrl("WOMEN/GEORGINA'S SENSE.png"),
    "GIVENCHY IRRESISTIBLE": getProductImageUrl("WOMEN/GIVENCHY IRRESISTIBLE.png"),
    "GOOD GIRL": getProductImageUrl("WOMEN/GOOD GIRL.png"),
    "GOOD GIRL BUSH": getProductImageUrl("WOMEN/GOOD GIRL BUSH.png"),
    "GOOD GIRL VERY GLAM": getProductImageUrl("WOMEN/GOOD GIRL VERY GLAM.png"),
    "GUCCI BAMBOO": getProductImageUrl("WOMEN/GUCCI BAMBOO.png"),
    "GUCCI BLOOM": getProductImageUrl("WOMEN/GUCCI BLOOM.png"),
    "GUCCI FLORA GORGEOUS ORCHID": getProductImageUrl("WOMEN/GUCCI FLORA GORGEOUS ORCHID.png"),
    "GUCCI RUSH": getProductImageUrl("WOMEN/GUCCI RUSH.png"),
    "GUCCI GUILTY": getProductImageUrl("MEN/GUCCI GUILTY.png"),
    "HUGO BOSS": getProductImageUrl("WOMEN/HUGO BOSS.png"),
    "HYPNOSE": getProductImageUrl("WOMEN/HYPNOSE.png"),
    "HYPNOTIC POISON": getProductImageUrl("WOMEN/HYPNOTIC POISON.png"),
    "GUCCI FLORA GORGEOUS MAGNOLIA": getProductImageUrl("WOMEN/GUCCI FLORA GORGEOUS MAGNOLIA.png"),
    "HAWAI": getProductImageUrl("WOMEN/HAWAI.png"),
    "ICELAND": getProductImageUrl("WOMEN/ICELAND.png"),
    "IDÔLE": getProductImageUrl("WOMEN/IDOLE.png"),
    "INSOLENCE": getProductImageUrl("WOMEN/ISOLENCE.png"),
    "J'ADORE": getProductImageUrl("WOMEN/JADORE.png"),
    "JOY": getProductImageUrl("WOMEN/JOY.png"),
    "KAYALI FLOWER MUSC ROSE ROYAL": getProductImageUrl("WOMEN/KAYALI FLOWER MUSC ROSE ROYAL.png"),
    "KAYALI MARSHMALLOW": getProductImageUrl("WOMEN/KAYALI MARSHMALLOW.png"),
    "KAYALI PISTACHIO": getProductImageUrl("WOMEN/KAYALI PISTACHIO.png"),
    "KAYALI SWEET BANANA": getProductImageUrl("WOMEN/KAYALI SWEET BANANA.png"),
    "KAYALI VANILLA 28": getProductImageUrl("WOMEN/KAYALI VANILLA 28.png"),
    "KAYALI VANILLA OUD": getProductImageUrl("WOMEN/KAYALI VANILLA OUD.png"),
    "KENZO FLOWER": getProductImageUrl("WOMEN/KENZO FLOWER.png"),
    "L'INSTANT DE GUERLAIN": getProductImageUrl("WOMEN/L'INSTANT DE GUERLAIN.png"),
    "LA NUIT TRÉSOR": getProductImageUrl("WOMEN/LA NUIT TRÉSOR.png"),
    "LA PETITE ROBE": getProductImageUrl("WOMEN/LA PETITE ROBE.png"),
    "LACOSTE TOUCH OF PINK": getProductImageUrl("WOMEN/LACOSTE TOUCH OF PINK.png"),
    "LIBRE": getProductImageUrl("WOMEN/LIBRE.png"),
    "LIBRE FLOWERS": getProductImageUrl("WOMEN/LIBRE FLOWERS.png"),
    "LIBRE INTENSE": getProductImageUrl("WOMEN/LIBRE INTENSE.png"),
    "LIGHT BLUE": getProductImageUrl("WOMEN/LIGHT BLUE.png"),
    "LA BELLE JPG": getProductImageUrl("WOMEN/LA BELLE JPG.png"),
    "LA VIE EST BELLE": getProductImageUrl("WOMEN/LA VIE EST BELLE.png"),
    "LADY MILLION": getProductImageUrl("WOMEN/LADY MILLION.png"),
    "LE BOUQUET ABSOLU": getProductImageUrl("WOMEN/LE BOUQUET ABSOLU.png"),
    "L'EAU D'ISSEY": getProductImageUrl("WOMEN/L'EAU D'ISSEY.png"),
    "L'INTERDIT GIVENCHY": getProductImageUrl("WOMEN/L'INTERDIT GIVENCHY.png"),
    "L'INTERDIT ROUGE": getProductImageUrl("WOMEN/LE L'INTERDIT ROUGE.png"),
    "LOVE DELIGHT AMOUAGE": getProductImageUrl("WOMEN/LOVE DELIGHT AMOUAGE.png"),
    "LOVE ME MORE": getProductImageUrl("WOMEN/LOVE ME MORE.png"),
    "LOVER DOSE": getProductImageUrl("WOMEN/LOVER DOSE.png"),
    "MANIFESTO": getProductImageUrl("WOMEN/MANIFESTO.png"),
    "MIDNIGHT FANTASY": getProductImageUrl("WOMEN/MIDNIGHT FANTASY.png"),
    "MISS DIOR": getProductImageUrl("WOMEN/MISS DIOR.png"),
    "MISS DIOR BLOOMING BOUQUET": getProductImageUrl("WOMEN/MISS DIOR BLOOMING BOUQUET.png"),
    "MON GUERLAIN": getProductImageUrl("WOMEN/MON GUERLAIN.png"),
    "MON PARIS": getProductImageUrl("WOMEN/MON PARIS.png"),
    "MONT BLANC FEMME INDIVIDUELLE": getProductImageUrl("WOMEN/MONT BLANC FEMME INDIVIDUELLE.png"),
    "MONT BLANC LADY EMBLEM": getProductImageUrl("WOMEN/MONT BLANC LADY EMBLEM.png"),
    "MONT BLANC SIGNATURE": getProductImageUrl("WOMEN/MONT BLANC SIGNATURE.png"),
    "MONTALE ROSE MUSK": getProductImageUrl("WOMEN/MONTALE ROSE MUSK.png"),
    "MY WAY": getProductImageUrl("WOMEN/MY WAY.png"),
    "NARCISO JASMINE MUSC": getProductImageUrl("WOMEN/NARCISO JASMINE MUSC.png"),
    "NARCISO MUSC ROSE NOIR": getProductImageUrl("WOMEN/NARCISO MUSC ROSE NOIR.png"),
    "NARCISO BLACK": getProductImageUrl("WOMEN/NARCISO BLACK.png"),
    "NARCISO FLOWER MUSC": getProductImageUrl("WOMEN/NARCISO FLOWER MUSC.png"),
    "NARCISO PINK": getProductImageUrl("WOMEN/NARCISO PINK.png"),
    "NARCISO POUDRE": getProductImageUrl("WOMEN/NARCISO POUDRE.png"),
    "NARCISO ROSE MUSC": getProductImageUrl("WOMEN/NARCISO ROSE MUSC.png"),
    "OLYMPÉA": getProductImageUrl("WOMEN/OLYMPEA.png"),
    "PARIS HILTON": getProductImageUrl("WOMEN/PARIS HILTON.png"),
    "POÊME": getProductImageUrl("WOMEN/POEME.png"),
    "PRADA PARADOXE": getProductImageUrl("WOMEN/PRADA PARADOXE.png"),
    "PREMIER JOUR": getProductImageUrl("WOMEN/PREMIER JOUR.png"),
    "PURE POISON": getProductImageUrl("WOMEN/PURE POISON.png"),
    "Q D&G": getProductImageUrl("WOMEN/Q D&G.png"),
    "RALPH": getProductImageUrl("WOMEN/RALPH.png"),
    "RICCI RICCI": getProductImageUrl("WOMEN/RICCI RICCI.png"),
    "SAMSARA GUERLAIN": getProductImageUrl("WOMEN/SAMSARA GUERLAIN.png"),
    "SUPREME BOUQUET": getProductImageUrl("WOMEN/SUPREME BOUQUET.png"),
    "SI": getProductImageUrl("WOMEN/SI.png"),
    "SI INTENSE": getProductImageUrl("WOMEN/SI INTENSE.png"),
    "SI PASSIONE": getProductImageUrl("WOMEN/SI PASSIONE.png"),
    "SI PASSIONE INTENSE": getProductImageUrl("WOMEN/SI PASSIONE INTENSE.png"),
    "SCANDAL": getProductImageUrl("WOMEN/SCANDAL.png"),
    "SEXY GRAFITTI": getProductImageUrl("WOMEN/SEXY GRAFITTI.png"),
    "SAHARA NOIR T.F.": getProductImageUrl("WOMEN/SAHARA NOIR T.F..png"),
    "COOL WATER DAVIDOFF": getProductImageUrl("WOMEN/DAVIDOFF COOL WATER.png"),
    "DOLCE&GABBANA": getProductImageUrl("WOMEN/DOLCE & GABBANA.png"),
    "EUPHORIA": getProductImageUrl("WOMEN/EUPHORIA.png"),
    "ISSEY MIYAKE": getProductImageUrl("WOMEN/ISSEY MIYAKE.png"),
    "NARCISO BLEU NOIR": getProductImageUrl("WOMEN/NARCISO BLEU NOIR.png"),
    "PURE XS": getProductImageUrl("MEN/PURE XS.png"),
    "ROBERTO CAVALLI": getProductImageUrl("WOMEN/ROBERTO CAVALLI.png"),
    "ROBERTO CAVALLI PARADISE": getProductImageUrl("WOMEN/ROBERTO CAVALLI PARADISE.png"),
    "THE ONE": getProductImageUrl("WOMEN/THE ONE.png"),
    "TOM FORD METALLIQUE": getProductImageUrl("WOMEN/TOM FORD METALLIQUE.png"),
    "TOM FORD ORCHID SOLEIL": getProductImageUrl("WOMEN/TOM FORD ORCHID SOLEIL.png"),
    "TOM FORD SOLEIL BRULANT": getProductImageUrl("WOMEN/TOM FORD SOLEIL BRULANT.png"),
    "TOSCA": getProductImageUrl("WOMEN/TOSCA.png"),
    "TRESOR": getProductImageUrl("WOMEN/TRESOR.png"),
    "TRESOR MIDNIGHT ROSE": getProductImageUrl("WOMEN/TRESOR MIDNIGHT ROSE.png"),
    "TODAY": getProductImageUrl("WOMEN/TODAY.png"),
    "TWILLY D'HERMES": getProductImageUrl("WOMEN/TWILLY D'HERMES.png"),
    "VALENTINO BORN IN ROMA INTENSE": getProductImageUrl("WOMEN/VALENTINO BORN IN ROMA INTENSE.png"),
    "VERSACE DYLAN PURPLE": getProductImageUrl("WOMEN/VERSACE DYLAN PURPLE.png"),
    "VERSACE DYLAN BLUE": getProductImageUrl("WOMEN/VERSACE DYLAN BLUE.png"),
    "VERSACE EROS": getProductImageUrl("MEN/VERSACE EROS.png"),
    "VERY SEXY NOW": getProductImageUrl("WOMEN/VERY SEXY NOW.png"),
    "VERY IRRESISTIBLE": getProductImageUrl("WOMEN/VERY IRRESISTIBLE.png"),
    "WASHWASHA BY LATTAFA": getProductImageUrl("WOMEN/WASHWASHA BY LATTAFA.png"),
    "YARA MOI": getProductImageUrl("WOMEN/YARA MOI.png"),
    "YARA PINK": getProductImageUrl("WOMEN/YARA PINK.png"),
    "حريم السلطان": getProductImageUrl("WOMEN/حريم السلطان.png"),
  };
  
  return imageMap[name] || getImageByIndex(index);
};

// Generate women's products
const generateWomensProducts = (): Product[] => {
  return womensPerfumes.map((name, index) => {
    const productImage = getWomensProductImage(name, index);
    
    return {
      id: `women-${index + 1}`,
      name,
      price: 6.99, // Base price, will be calculated by size
      image: productImage,
      category: "Women's Fragrance",
      gender: "women" as const,
      sizes: ["50ml", "50ml vip", "100ml", "100ml vip"],
    };
  });
};

// All mix/unisex perfumes from the images
const mixPerfumes = [
  "ANA AL ABYAD", "ANA WEL SHOOQ", "AMORE CAFFE MANCERA", "AMBER SANTAL AJMAL",
  "ARMANI PRIVE ROYAL OUD", "ARMANI PRIVE ROUGE MALACHITE", "ARMANI PRIVE VERT MALACHITE",
  "BACCARAT ROUGE", "BLACK ORCHIDE", "BLACK AFGANO", "BLACK AOUDE MONTALE",
  "BOIS MYSTERIEUX GUERLAIN", "BOIS CORSE", "COCO VANILLE", "CREED ROYAL AOUD",
  "CREED ROYAL WATER", "CARON", "CAFTAN YSL", "CAPRI", "CALIFORNIA DREAM LV",
  "CRYSTAL SAAFFRON MATIERE PREMIERE", "DIOR GRIS", "ERBA PURA", "GUCCI AOUD",
  "GUCCI AOUD INTENSE", "HUDSON VALLEY", "IMPERIAL VALLEY", "JOE MALONE VELVET ROSE AND OUD",
  "LE LION DE CHANEL", "LEATHER MALAKI CHOPARD", "MONTALE ARABIANS TONKA", "MEGAMARE",
  "OUD ISPAHAN", "OUD AND BERGAMOT JO MALONE", "OUD ABYAD", "ROSE VANILLE",
  "SANTAL 33", "SANTAL ROYAL GUERLAIN", "SHAMS EL EMARAT", "S.T. DUPONT OUD AND ROSE",
  "STRONGER WITH YOU", "STRONGER WITH YOU AMBER", "STELLAR TIMES LV", "SMOKING HOT",
  "SWY TOBACCO", "SWY SANDALWOOD", "SWY LEATHER", "TOBACCO OUD", "TERIAQ INTENSE LATTAFA",
  "TOM FORD VANILLA SEX", "TOM FORD NEROLI PORTOFINO", "TOM FORD NOIR DE NOIR",
  "TOM FORD ELECTRIC CHERRY", "TOM FORD LOST CHERRY", "TOM FORD BITTER PEACH",
  "TOM FORD CHERRY SMOKE", "TOM FORD FUCKING FABULOUS", "VELVET DESERT OUD D&G",
  "VELVT DESERT OUD", "WITHE OUD", "WESAL", "XERJOFF ALEXANDRIA", "XERJOFF NAXOS",
  // SUNSET NECTAR omitted here - included once above as detailed product with id "4"
  "XERJOFF DECAS", "غبار الذهب", "سفير العود", "كلمات", "خمرة", "شيخ الشيوخ",
  "شغف", "عود مبخر", "بخور", "عود الذهب", "دهن العود"
];

// Helper function to get image for men's products
const getMensProductImage = (name: string, index: number): string => {
  const imageMap: Record<string, string> = {
    "ACQUA DI GIO": getProductImageUrl("MEN/ACQUA DI GIO.png"),
    "ACQUA DI GIO PROFUMO": getProductImageUrl("MEN/ACQUA DI GIO PROFUMO.png"),
    "ACQUA DI GIO ABSOLU": getProductImageUrl("MEN/ACQUA DI GIO ABSOLU.png"),
    "ACQUA DI GIO PROFONDO": getProductImageUrl("MEN/ACQUA DI GIO PROFONDO.png"),
    "ACQUA DI GIO EXTRA": getProductImageUrl("MEN/ACQUA DI GIO EXTRA.png"),
    "ACQUA DI SILVA": getProductImageUrl("MEN/ACQUA DA SILVA.png"),
    "ALLURE CHANEL": getProductImageUrl("MEN/ALLURE CHANEL.png"),
    "ALLURE SPORT CHANEL": getProductImageUrl("MEN/ALLURE HOMME SPORT.png"),
    "AMBER PRADA": getProductImageUrl("MEN/AMBER PRADA.png"),
    "ARMANI CODE": getProductImageUrl("MEN/ARMANI CODE.png"),
    "ARMANI CODE ICE": getProductImageUrl("MEN/ARMANI CODE ICE.png"),
    "ARAMIS 900": getProductImageUrl("MEN/ARAMIS 900.png"),
    "ASAD BOURBON": getProductImageUrl("MEN/ASAD BURBON.png"),
    "AZZARO WANTED": getProductImageUrl("MEN/AZZARO WANTED.png"),
    "BLEU DE CHANEL": getProductImageUrl("MEN/BLEU DE CHANEL.png"),
    "AZZARO CHROME": getProductImageUrl("MEN/CHROME AZZARO.png"),
    "AZZARO CHROME UNITED": getProductImageUrl("MEN/CHROME AZZARO UNITED.png"),
    "ANGEL": getProductImageUrl("MEN/ANGEL BOURBON.png"),
    "212 MEN": getProductImageUrl("MEN/212 MEN.png"),
    "212 SEXY": getProductImageUrl("MEN/212 SEXY.png"),
    "212 VIP": getProductImageUrl("MEN/212 VIP.png"),
    "BLACK XS": getProductImageUrl("MEN/BLACK XS.png"),
    "BLACK XS L'APHRODISIAQUE": getProductImageUrl("MEN/BLACK XS L'APHRODISIAQUE.png"),
    "BLUE JEANS": getProductImageUrl("MEN/BLUE JEANS.png"),
    "BOSS BOTTLED": getProductImageUrl("MEN/BOSS BOTTLED.png"),
    "BOSS BOTTLED ABSOLU": getProductImageUrl("MEN/BOSS BOTTLED ABSOLU.png"),
    "BOSS BOTTLED ELIXIR": getProductImageUrl("MEN/BOSS BOTTLE ELIXIR.png"),
    "BOSS BOTTLED INTENSE": getProductImageUrl("MEN/BOSS BOTTLED INTENSE.png"),
    "BOSS BOTTLED OUD": getProductImageUrl("MEN/BOSS BOTTLED OUD.png"),
    "BOSS ORANGE": getProductImageUrl("MEN/BOSS ORANGE.png"),
    "BURBERRY": getProductImageUrl("MEN/BURBERRY.png"),
    "BURBERRY HERO": getProductImageUrl("MEN/BURBERRY HERO.png"),
    "BVLGARI BLUE": getProductImageUrl("MEN/BVLGARI BLUE.png"),
    "BVLGARI MEN": getProductImageUrl("MEN/BVLGARI MEN.png"),
    "BVLGARI MAN IN BLACK": getProductImageUrl("MEN/BVLGARI MEN.png"),
    "CAROLINA HERRERA": getProductImageUrl("MEN/CAROLINA HERRERA .png"),
    "CK SHOCK": getProductImageUrl("MEN/CK SHOCK.png"),
    "CKI": getProductImageUrl("MEN/CKI.png"),
    "CREED SILVER MOUNTAIN": getProductImageUrl("MEN/CREED SILVER MOUNTAIN.png"),
    "CREED AVENTUS ABSOLU": getProductImageUrl("MEN/CREED AVENTUS ABSOLU.png"),
    "DIOR HOMME": getProductImageUrl("MEN/DIOR HOMME.png"),
    "DIOR HOMME SPORT": getProductImageUrl("MEN/DIOR HOMME SPORT.png"),
    "DIOR INTENSE": getProductImageUrl("MEN/DIOR INTENSE.png"),
    "DIOR HIGHER": getProductImageUrl("MEN/DIOR HIGHER.png"),
    "DOLCE&GABBANA": getProductImageUrl("MEN/DOLCE & GABBANA.png"),
    "D&G LIGHT BLUE": getProductImageUrl("MEN/D&G LIGHT BLUE.png"),
    "D&G K": getProductImageUrl("MEN/D&G K.png"),
    "DAVIDOFF HOT WATER": getProductImageUrl("MEN/DAVIDOFF HOT WATER.png"),
    "DAVIDOFF COOL WATER": getProductImageUrl("MEN/DAVIDODD COOL WATER.png"),
    "DAVIDOFF ADVENTURE": getProductImageUrl("MEN/DAVIDOFF ADVENTURE.png"),
    "DAVIDOFF CHAMPION": getProductImageUrl("MEN/DAVIDOFF CHAMPION.png"),
    "GIVENCHY PLAY SPORT": getProductImageUrl("MEN/GIVENCHY PLAY SPORT.png"),
    "GIVENCHY GENTLEMAN": getProductImageUrl("MEN/GIVENCHY GENTLEMAN.png"),
    "GIVENCHY PI": getProductImageUrl("MEN/GIVENCHY PI.png"),
    "JAVANESE PATCHOULI": getProductImageUrl("MEN/JAVANESE PATCHOULI.png"),
    "KOUROS": getProductImageUrl("MEN/KOUROS.png"),
    "LA NUIT DE L'HOMME": getProductImageUrl("MEN/LA NUIT DE L'HOMME.png"),
    "LAIL MALAKI": getProductImageUrl("MEN/LAIL MALAKI.png"),
    "LANVIN": getProductImageUrl("MEN/LANVIN.png"),
    "LAPIDUS": getProductImageUrl("MEN/LAPIDUS.png"),
    "M.J. WEEKEND": getProductImageUrl("MEN/M.J. WEEKEND.png"),
    "MONT BLANC LEGEND": getProductImageUrl("MEN/MONT BLANC LEGEND.png"),
    "MONT BLANC LEGEND RED": getProductImageUrl("MEN/MONT BLANC LEGEND RED.png"),
    "MONT BLANC LEGEND SPIRIT": getProductImageUrl("MEN/MONT BLANC LEGEND SPIRIT.png"),
    "MONT BLANC EXPLORER": getProductImageUrl("MEN/MONT BLANC EXPLORER.png"),
    "MONT BLANC INDIVIDUELLE": getProductImageUrl("MEN/MONT BLANC INDIVIDUELLE.png"),
    "MYSELF YSL": getProductImageUrl("MEN/MYSELF YSL.png"),
    "MR BURBERRY": getProductImageUrl("MEN/MR BURBERRY.png"),
    "NARCISO BLEU NOIR": getProductImageUrl("MEN/NARCISO BLUE NOIR.png"),
    "NAUTICA VOYAGE": getProductImageUrl("MEN/NAUTICA VOYAGE.png"),
    "OMBRE NOMADE LV": getProductImageUrl("MEN/OMBRE NOMADE LV.png"),
    "ONE MILLION": getProductImageUrl("MEN/ONE MILLION.png"),
    "ONE MILLION OUD": getProductImageUrl("MEN/ONE MILLION OUD.png"),
    "ONE MILLION LUCKY": getProductImageUrl("MEN/ONE MILLION LUCKY.png"),
    "ONE MILLION ELIXIR": getProductImageUrl("MEN/ONE MILLION ELIXIR.png"),
    "OMBRE LEATHER": getProductImageUrl("MEN/OMBRE LEATHER.png"),
    "POLO RED": getProductImageUrl("MEN/POLO RED.png"),
    "POLO BLACK": getProductImageUrl("MEN/POLO BLACK.png"),
    "POLO BLUE": getProductImageUrl("MEN/POLO BLUE.png"),
    "PACO RABANNE PHANTOM": getProductImageUrl("MEN/PACO RABANNE PHANTOM.png"),
    "PACO RABANNE MEN": getProductImageUrl("MEN/PACO RABANNE MEN.png"),
    "PRADA L'HOMME": getProductImageUrl("MEN/PRADA HOMME.png"),
    "PARFUMS DE MARLY ALTHAÏR": getProductImageUrl("MEN/PARFUM DE MARLY ALTHAIR.png"),
    "PASHA DE CARTIER": getProductImageUrl("MEN/PASHA DE CARTIER.png"),
    "PLEASURES": getProductImageUrl("MEN/PLEASURES.png"),
    "PURE XS": getProductImageUrl("MEN/PURE XS.png"),
    "ROBERTO CAVALLI": getProductImageUrl("MEN/ROBERTO CAVALLI.png"),
    "LACOSTE POUR L'HOMME": getProductImageUrl("MEN/LACOSTE POUR L'HOMME.png"),
    "L'IMMENSITÉ LV": getProductImageUrl("MEN/L'IMMENSITE LV.png"),
    "STRONG ME": getProductImageUrl("MEN/STRONG ME.png"),
    "STRONGER WITH YOU": getProductImageUrl("MEN/STRONGER WITH YOU .png"),
    "STRONGER WITH YOU INTENSELY": getProductImageUrl("MEN/STRONGER WITH YOU INTENSESLY.png"),
    "SWY ABSOLUTELY": getProductImageUrl("MEN/SWY ABSOLUTELY.png"),
    "SWY OUD": getProductImageUrl("MEN/SWY OUD.png"),
    "SWY PARFUM": getProductImageUrl("MEN/SWY PARFUM.png"),
    "SPICE BOMB": getProductImageUrl("MEN/SPICE BOMB.png"),
    "RED TABACCO MANCERA": getProductImageUrl("MEN/RED TABACCO MANCERA.png"),
    "ROMA": getProductImageUrl("MEN/ROMA.png"),
    "SAUVAGE": getProductImageUrl("MEN/SAUVAGE.png"),
    "SAUVAGE ELIXIR": getProductImageUrl("MEN/SAUVAGE ELIXIR.png"),
    "SCANDAL POUR HOMME": getProductImageUrl("MEN/SCANDAL POUR HOMME.png"),
    "SEDUCTION BLACK": getProductImageUrl("MEN/SEDUCTION BLACK.png"),
    "SHADOWS": getProductImageUrl("MEN/SHADOWS.png"),
    "SILVER SCENT": getProductImageUrl("MEN/SILVER SCENT.png"),
    "SPICE BOMB EXTREME": getProductImageUrl("MEN/SPICEBOMB EXTREME.png"),
    "212 VIP BLACK": getProductImageUrl("MEN/212 VIP BLACK.png"),
    "BLUE LABEL": getProductImageUrl("MEN/BLUE LABEL.png"),
    "BOSS THE SCENT": getProductImageUrl("MEN/BOSS THE SCENT.png"),
    "BOSS THE SCENT ELIXIR": getProductImageUrl("MEN/BOSS THE SCENT ELIXIR.png"),
    "BVLGARI WOOD ESSENCE": getProductImageUrl("MEN/BVLGARI WOOD ESSENCE.png"),
    "CREED AVENTUS": getProductImageUrl("MEN/CREED AVENTUS.png"),
    "DUNHILL DESIRE BLUE": getProductImageUrl("MEN/DUNHILL DESIRE BLUE.png"),
    "DUNHILL DARK BLUE": getProductImageUrl("MEN/DUNHILL DARK BLUE.png"),
    "DUNHILL DESIRE": getProductImageUrl("MEN/DUNHILL DESIRE.png"),
    "DUNHILL ICON": getProductImageUrl("MEN/DUNHILL ICON.png"),
    "DRAKKAR NOIR": getProductImageUrl("MEN/DRAKKAR NOIR.png"),
    "DYLAN BLUE": getProductImageUrl("MEN/DYLAN BLUE.png"),
    "EGOISTE PLATINUM": getProductImageUrl("MEN/EGOISTE PLATINUM.png"),
    "EUPHORIA": getProductImageUrl("MEN/EUPHORIA.png"),
    "GIVENCHY PLAY": getProductImageUrl("MEN/GIVENCHY PLAY.png"),
    "RASASI AL WISAM": getProductImageUrl("MEN/RASASI AL WISAM.png"),
    "RASASI HAWAS": getProductImageUrl("MEN/RASASI HAWAS.png"),
    "SCULPTURE HOMME": getProductImageUrl("MEN/SCULPTURE HOMME.png"),
    "TABAC": getProductImageUrl("MEN/TABAC.png"),
    "TOBACCO VANILLE": getProductImageUrl("MEN/TOBACCO VANILLE.png"),
    "EAU SAUVAGE": getProductImageUrl("MEN/EAU SAUVAGE.png"),
    "EHSAAS": getProductImageUrl("MEN/EHSAAS.png"),
    "ENCRE NOIR": getProductImageUrl("MEN/ENCRE NOIR.png"),
    "EROS FLAME": getProductImageUrl("MEN/EROS FLAME.png"),
    "ETERNITY": getProductImageUrl("MEN/ETERNITY.png"),
    "FAHRENHEIT": getProductImageUrl("MEN/FAHRENHEIT.png"),
    "FERRARI RED": getProductImageUrl("MEN/FERARRI RED.png"),
    "GUCCI GUILTY": getProductImageUrl("MEN/GUCCI GUILTY.png"),
    "H 24": getProductImageUrl("MEN/H24.png"),
    "HABIT ROUGE": getProductImageUrl("MEN/HABIT ROUGE.png"),
    "HUGO BOSS": getProductImageUrl("MEN/HUGO BOSS.png"),
    "HUGO BOSS ENERGIZE": getProductImageUrl("MEN/HUGO BOSS ENERGIZED.png"),
    "HUMMER": getProductImageUrl("MEN/HUMMER.png"),
    "INSURRECTION": getProductImageUrl("MEN/INSURRECTION.png"),
    "INVICTUS": getProductImageUrl("MEN/INVICTUS.png"),
    "INVICTUS VICTORY": getProductImageUrl("MEN/INVICTUS VICTORY.png"),
    "INVICTUS PLATINUM": getProductImageUrl("MEN/INVICTUS PLATINUM.png"),
    "INVICTUS PARFUM": getProductImageUrl("MEN/INVICTUS PARFUM.png"),
    "INVICTUS VICTORY ELIXIR": getProductImageUrl("MEN/INVICTUS VICTORY ELIXIR.png"),
    "ISSEY MIYAKE": getProductImageUrl("MEN/ISSEY MIYAKE.png"),
    "JAGUAR": getProductImageUrl("MEN/JAGUAR.png"),
    "JOOP": getProductImageUrl("MEN/JOOP.png"),
    "KENZO": getProductImageUrl("MEN/KENZO.png"),
    "LACOSTE WHITE": getProductImageUrl("MEN/LACOSTE WHITE.png"),
    "LACOSTE RED": getProductImageUrl("MEN/LACOSTE RED.png"),
    "LAYTON DE MARLY": getProductImageUrl("MEN/LAYTON DE MARLY.png"),
    "LE MALE": getProductImageUrl("MEN/LE MALE.png"),
    "LE MALE ELIXIR": getProductImageUrl("MEN/LE MALE ELIXIR.png"),
    "LE MALE LE BEAU": getProductImageUrl("MEN/LE MALE LE BEAU.png"),
    "LE MALE LOVER": getProductImageUrl("MEN/LE MALE LOVER.png"),
    "LE MALE LE PARFUM": getProductImageUrl("MEN/LE MALE LE PARFUM.png"),
    "LEXUS": getProductImageUrl("MEN/LEXUS.png"),
    "THE ONE": getProductImageUrl("MEN/THE ONE.png"),
    "TUXEDO": getProductImageUrl("MEN/TUXEDO.png"),
    "ULTRA MALE": getProductImageUrl("MEN/ULTRA MALE.png"),
    "WOOD MYSTIQUE": getProductImageUrl("MEN/WOOD MYSTIQUE.png"),
    "Y": getProductImageUrl("MEN/Y.png"),
    "Y LE PARFUM": getProductImageUrl("MEN/Y LE PARFUM.png"),
    "Y INTENSE": getProductImageUrl("MEN/Y INTENSE.png"),
    "دارج": getProductImageUrl("MEN/دارج.jpg"),
    "CACHAREL": getProductImageUrl("MEN/CACHAREL.png"),
    "CARLISLE DE MARLY": getProductImageUrl("MEN/CARLISLE  DE MARLY.png"),
    "CAROLINA HERRERA CLASSIC": getProductImageUrl("MEN/CAROLINA HERRERA CLASSIC.png"),
    "CAROLINA HERRERA CHIC": getProductImageUrl("MEN/CAROLINA HERRERA CHIC.png"),
    "CARTIER DECLARATION": getProductImageUrl("MEN/CARTIER DECLARATION.png"),
    "CHOPARD OUD MALAKI": getProductImageUrl("MEN/CHOPARD OUD MALAKI.png"),
    "THE MOST WANTED": getProductImageUrl("MEN/THE MOST WANTED.png"),
    "SPICE BOMB INFRARED": getProductImageUrl("MEN/SPICEBOMB INFRARED.png"),
    "TERRE D'HERMES": getProductImageUrl("MEN/TERRE D'HERMES.png"),
    "TOM FORD NOIR DE NOIR": getProductImageUrl("MEN/TOM FORD NOIR DE NOIR.png"),
    "TOM FORD NOIR EXTREME": getProductImageUrl("MEN/TOM FORD NOIR EXTREME.jpg"),
    "TOM FORD OUD WOOD": getProductImageUrl("MEN/TOM FORD OUD WOOD.png"),
    "VALENTINO UOMO": getProductImageUrl("MEN/VALENTINO UOMO.png"),
    "VALENTINO UOMO NOIR ABSOLU": getProductImageUrl("MEN/VALENTINO UOMO NOIR ABSOLU.png"),
    "VALENTINO UOMO BORN N ROME": getProductImageUrl("MEN/VALENTINO UOMO BORN IN ROMA.png"),
    "VALENTINO UAMO BORN IN ROME INTENSE": getProductImageUrl("MEN/VALENTINO UAMO BORN IN ROME INTENSE.jpg"),
    "VERSACE EAU FRAICHE": getProductImageUrl("MEN/VERSACE EAU FRAICHE.png"),
    "VERSACE EROS": getProductImageUrl("MEN/VERSACE EROS.png"),
    "VERSACE POUR HOMME": getProductImageUrl("MEN/VERSACE POUR HOMME.png"),
    "VÉTIVER DE GUERLAIN": getProductImageUrl("MEN/VETIVER DE GUERLAIN.png"),
  };
  
  return imageMap[name] || getImageByIndex(index);
};

// Generate men's products
const generateMensProducts = (): Product[] => {
  return mensPerfumes.map((name, index) => {
    const productImage = getMensProductImage(name, index);
    
    return {
      id: `men-${index + 1}`,
      name,
      price: 6.99, // Base price, will be calculated by size
      image: productImage,
      category: "Men's Fragrance",
      gender: "men" as const,
      sizes: ["50ml", "50ml vip", "100ml", "100ml vip"],
    };
  });
};

// Helper function to get image for mix/unisex products (name → matching asset)
const getMixProductImage = (name: string, index: number): string => {
  const imageMap: Record<string, string> = {
    "ANA AL ABYAD": getProductImageUrl("UNISEX/ANA AL ABYAD.png"),
    "ANA WEL SHOOQ": getProductImageUrl("UNISEX/ANA WEL SHOOQ.png"),
    "AMBER SANTAL AJMAL": getProductImageUrl("UNISEX/AMBER SANTAL AJMAL.png"),
    "AMORE CAFFE MANCERA": getProductImageUrl("UNISEX/AMORE CAFFE MANCERA.png"),
    "BACCARAT ROUGE": getProductImageUrl("UNISEX/BACCARAT ROUGE.png"),
    "BLACK AFGANO": getProductImageUrl("UNISEX/BLACK AFGANO.png"),
    "BLACK AOUDE MONTALE": getProductImageUrl("UNISEX/BLACK AOUDE MONTALE.png"),
    "BLACK ORCHIDE": getProductImageUrl("UNISEX/BLACK ORCHIDE.png"),
    "BOIS CORSE": getProductImageUrl("UNISEX/BOIS CORSE.png"),
    "BOIS MYSTERIEUX GUERLAIN": getProductImageUrl("UNISEX/BOIS MYSTERIEUX GUERLAIN.png"),
    "CAFTAN YSL": getProductImageUrl("UNISEX/CAFTAN YSL.png"),
    "CREED ROYAL AOUD": getProductImageUrl("UNISEX/CREED ROYAL OUD.png"),
    "CREED ROYAL WATER": getProductImageUrl("UNISEX/CREED ROYAL WATER.png"),
    "CALIFORNIA DREAM LV": getProductImageUrl("UNISEX/CALIFORNIA DREAM LV.png"),
    "CAPRI": getProductImageUrl("UNISEX/CAPRI.png"),
    "CARON": getProductImageUrl("UNISEX/CARON.png"),
    "COCO VANILLE": getProductImageUrl("UNISEX/COCO VANILLE.png"),
    "CRYSTAL SAAFFRON MATIERE PREMIERE": getProductImageUrl("UNISEX/CRYSTAL SAFFRON MATIERE PREMIERE.png"),
    "DIOR GRIS": getProductImageUrl("UNISEX/DIOR GRIS.png"),
    "ERBA PURA": getProductImageUrl("UNISEX/ERBA PURA.png"),
    "HUDSON VALLEY": getProductImageUrl("UNISEX/HUDSON VALLEY.png"),
    "IMPERIAL VALLEY": getProductImageUrl("UNISEX/IMPERIAL VALLEY.png"),
    "JOE MALONE VELVET ROSE AND OUD": getProductImageUrl("UNISEX/JOE MALONE VELVET ROSE AND OUD.png"),
    "LE LION DE CHANEL": getProductImageUrl("UNISEX/LE LION DE CHANNEL.png"),
    "MONTALE ARABIANS TONKA": getProductImageUrl("UNISEX/MONTALE ARABIANS TONKA.png"),
    "MEGAMARE": getProductImageUrl("UNISEX/MEGAMARE.png"),
    "OUD ISPAHAN": getProductImageUrl("UNISEX/OUD ISPAHAN.png"),
    "OUD AND BERGAMOT JO MALONE": getProductImageUrl("UNISEX/OUD AND BERGAMOT JO MALONE.png"),
    "OUD ABYAD": getProductImageUrl("UNISEX/OUD ABYAD.png"),
    "ROSE VANILLE": getProductImageUrl("UNISEX/ROSE VANILLE.png"),
    "SANTAL 33": getProductImageUrl("UNISEX/SANTAL 33.png"),
    "SANTAL ROYAL GUERLAIN": getProductImageUrl("UNISEX/SANTAL ROYAL GUERLAIN AND ROSE.png"),
    "SHAMS AL EMARAT": getProductImageUrl("UNISEX/SHAMS L EMERAT.png"),
    "SHAMS EL EMARAT": getProductImageUrl("UNISEX/SHAMS L EMERAT.png"),
    "SHAMS L EMERAT": getProductImageUrl("UNISEX/SHAMS L EMERAT.png"),
    "SHAMS LEMERAT": getProductImageUrl("UNISEX/SHAMS L EMERAT.png"),
    "S.T. DUPONT OUD AND ROSE": getProductImageUrl("UNISEX/S.T. DUPONT OUD AND ROSE.png"),
    "STRONGER WITH YOU": getProductImageUrl("MEN/STRONGER WITH YOU .png"),
    "STELLAR TIMES LV": getProductImageUrl("UNISEX/STELLAR TIMES LV.png"),
    "SMOKING HOT": getProductImageUrl("UNISEX/SMOKING HOT.png"),
    "TOBACCO OUD": getProductImageUrl("UNISEX/TOBACCO OUD.png"),
    "TERIAQ INTENSE LATTAFA": getProductImageUrl("UNISEX/TERIAQ INTENSE LATTAFA.png"),
    "VELVT DESERT OUD": getProductImageUrl("UNISEX/VELVET DESERT OUD.png"),
    "WESAL": getProductImageUrl("UNISEX/WESAL.png"),
    "WHITE OUD": getProductImageUrl("UNISEX/WITHE OUD.png"),
    "WITHE OUD": getProductImageUrl("UNISEX/WITHE OUD.png"),
    "XERJOFF ALEXANDRIA": getProductImageUrl("UNISEX/XERJOFF ALEXANDRIA.png"),
    "XERJOFF NAXOS": getProductImageUrl("UNISEX/XERJOFF NAXOS.png"),
    "XERJOFF DECAS": getProductImageUrl("UNISEX/XERJOFF DECAS.png"),
    "غبار الذهب": getProductImageUrl("UNISEX/غبار الذهب.png"),
    "سفير العود": getProductImageUrl("UNISEX/سفير العود.png"),
    "كلمات": getProductImageUrl("UNISEX/كلمات.png"),
    "خمرة": getProductImageUrl("UNISEX/خمرة.png"),
    "شيخ الشيوخ": getProductImageUrl("UNISEX/شيخ الشيوخ.png"),
    "شغف": getProductImageUrl("UNISEX/شغف.png"),
    "عود مبخر": getProductImageUrl("UNISEX/عود مبخر.png"),
    "بخور": getProductImageUrl("UNISEX/بخور.png"),
    "عود الذهب": getProductImageUrl("UNISEX/عود الذهب.png"),
    "دهن العود": getProductImageUrl("UNISEX/دهن العود.png"),
    // UNISEX folder images for correct product display
    "ARMANI PRIVE ROYAL OUD": getProductImageUrl("UNISEX/ARMANI PRIVE ROYAL OUD.png"),
    "ARMANI PRIVE ROUGE MALACHITE": getProductImageUrl("UNISEX/ARMANI PRIVE ROUGE MALACHITE.png"),
    "ARMANI PRIVE VERT MALACHITE": getProductImageUrl("UNISEX/ARMANI PRIVE VERT MALACHITE.png"),
    "GUCCI AOUD": getProductImageUrl("UNISEX/GUCCI AOUD.png"),
    "GUCCI AOUD INTENSE": getProductImageUrl("UNISEX/GUCCI AOUD INTENSE.png"),
    "LEATHER MALAKI CHOPARD": getProductImageUrl("UNISEX/LEATHER MALAKI CHOPARD.png"),
    "STRONGER WITH YOU AMBER": getProductImageUrl("UNISEX/STRONGER WITH YOU AMBER.png"),
    "SWY TOBACCO": getProductImageUrl("UNISEX/SWY TOBACCO.png"),
    "SWY SANDALWOOD": getProductImageUrl("UNISEX/SWY SANDALWOOD.png"),
    "SWY LEATHER": getProductImageUrl("UNISEX/SWY LEATHER.png"),
    "TOM FORD VANILLA SEX": getProductImageUrl("UNISEX/TOM FORD VANILLA SEX.png"),
    "TOM FORD NEROLI PORTOFINO": getProductImageUrl("UNISEX/TOM FORD NEROLI PORTOFINO.png"),
    "TOM FORD NOIR DE NOIR": getProductImageUrl("UNISEX/TOM FORD NOIR DE NOIR.png"),
    "TOM FORD ELECTRIC CHERRY": getProductImageUrl("UNISEX/TOM FORD ELECTRIC CHERRY.png"),
    "TOM FORD LOST CHERRY": getProductImageUrl("UNISEX/TOM FORD LOST CHERRY.png"),
    "TOM FORD BITTER PEACH": getProductImageUrl("UNISEX/TOM FORD BITTER PEACH.png"),
    "TOM FORD CHERRY SMOKE": getProductImageUrl("UNISEX/TOM FORD CHERRY SMOKE.png"),
    "TOM FORD FUCKING FABULOUS": getProductImageUrl("UNISEX/TOM FORD FUCKING FABULOUS.png"),
    "VELVET DESERT OUD D&G": getProductImageUrl("UNISEX/VELVET DESERT OUD D&G.png"),
  };
  
  // If product has a mapped image, return it; otherwise use fallback
  if (imageMap[name]) {
    return imageMap[name];
  }
  
  // Fallback for products without specific images
  return getImageByIndex(index);
};

// Generate mix/unisex products
const generateMixProducts = (): Product[] => {
  return mixPerfumes.map((name, index) => ({
    id: `mix-${index + 1}`,
    name,
    price: 6.99, // Base price, will be calculated by size
    image: getMixProductImage(name, index),
    category: "Unisex Fragrance",
    gender: "mix" as const,
    sizes: ["50ml", "50ml vip", "100ml", "100ml vip"],
  }));
};

// Deduplicate by name: keep only the first occurrence of each product name
const deduplicateByName = (items: Product[]): Product[] => {
  const seen = new Set<string>();
  return items.filter((p) => {
    const key = p.name.trim().toUpperCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const allProductsRaw: Product[] = [
  {
    id: "4",
    name: "SUNSET NECTAR",
    price: 199,
    image: getProductImageUrl("UNISEX/SUNSET NECTAR.png"),
    category: "Woody",
    gender: "mix",
    description: "Inspired by golden hour, this warm fragrance blends Mediterranean citrus with cedarwood and white musk. A harmonious composition that captures the magic of sunset, leaving a trail of sophisticated warmth and natural elegance.",
    sizes: ["50ml", "50ml vip", "100ml", "100ml vip"],
    topNotes: ["Bergamot", "Lemon"],
    middleNotes: ["Cedarwood", "Vetiver"],
    baseNotes: ["White Musk", "Amber"],
  },
  ...generateWomensProducts(),
  ...generateMensProducts(),
  ...generateMixProducts(),
];

export const products: Product[] = deduplicateByName(allProductsRaw);

export const getProductById = (id: string): Product | undefined => {
  return products.find((product) => product.id === id);
};

// Get related products (same gender, excluding current product)
export const getRelatedProducts = (currentProductId: string, limit: number = 2): Product[] => {
  const currentProduct = getProductById(currentProductId);
  if (!currentProduct) return [];
  
  return products
    .filter((product) => product.id !== currentProductId && product.gender === currentProduct.gender)
    .slice(0, limit);
};

// Get price based on size
export const getPriceBySize = (size: string): number => {
  const sizeLower = size.toLowerCase();
  // Check for VIP versions first (they contain both size and "vip")
  if (sizeLower.includes("50ml") && sizeLower.includes("vip")) {
    return 8.99;
  } else if (sizeLower.includes("100ml") && sizeLower.includes("vip")) {
    return 14.99;
  } else if (sizeLower.includes("50ml")) {
    return 6.99;
  } else if (sizeLower.includes("100ml")) {
    return 10.99;
  }
  // Default fallback
  return 6.99;
};

// Extract brand from product name
export const getBrandFromName = (productName: string): string => {
  const name = productName.toUpperCase();
  
  // Common brand prefixes (ordered by specificity - longer names first)
  const brandPatterns = [
    "ACQUA DI GIO",
    "TOM FORD",
    "ARMANI CODE",
    "ARMANI PRIVE",
    "BOSS BOTTLED",
    "BOSS THE SCENT",
    "BOSS ORANGE",
    "VERSACE",
    "GUCCI",
    "CHANEL",
    "DIOR",
    "DOLCE&GABBANA",
    "D&G",
    "PRADA",
    "BURBERRY",
    "HERMES",
    "HERMÈS",
    "GIVENCHY",
    "YVES SAINT LAURENT",
    "YSL",
    "VALENTINO",
    "MONT BLANC",
    "MONTALE",
    "CREED",
    "PACO RABANNE",
    "JEAN PAUL GAULTIER",
    "JPG",
    "CAROLINA HERRERA",
    "HUGO BOSS",
    "ISSEY MIYAKE",
    "KENZO",
    "LACOSTE",
    "AZZARO",
    "DAVIDOFF",
    "RALPH LAUREN",
    "RALPH",
    "ROBERTO CAVALLI",
    "NARCISO",
    "ELIE SAAB",
    "KAYALI",
    "BVLGARI",
    "JO MALONE",
    "JOE MALONE",
    "XERJOFF",
    "MANCERA",
    "PARFUMS DE MARLY",
    "CARLISLE DE MARLY",
    "LAYTON DE MARLY",
    "CHOPARD",
    "CARTIER",
    "DUNHILL",
    "NAUTICA",
    "FERRARI",
    "HUMMER",
    "LEXUS",
    "LANVIN",
    "LAPIDUS",
    "JAGUAR",
    "JOOP",
    "CACHAREL",
    "BLUE JEANS",
    "BLUE LABEL",
    "CK",
    "CKI",
    "CK SHOCK",
    "ETERNITY",
    "PLEASURES",
    "OBSESSION",
    "ESCADA",
    "RICCI",
    "RICCI RICCI",
    "Q D&G",
    "212",
    "BLACK XS",
    "PURE XS",
    "ONE MILLION",
    "INVICTUS",
    "LE MALE",
    "ULTRA MALE",
    "SPICE BOMB",
    "SAUVAGE",
    "TERRE D'HERMES",
    "LA NUIT DE L'HOMME",
    "L'HOMME",
    "L'IMMENSITÉ",
    "OMBRE",
    "STRONGER WITH YOU",
    "SWY",
    "THE ONE",
    "THE MOST WANTED",
    "FAHRENHEIT",
    "EAU SAUVAGE",
    "EGOISTE",
    "KOUROS",
    "HABIT ROUGE",
    "VÉTIVER",
    "SAMSARA",
    "MON GUERLAIN",
    "L'INSTANT",
    "SHALIMAR",
    "ANGEL",
    "ALIEN",
    "GOOD GIRL",
    "LIBRE",
    "LA VIE EST BELLE",
    "LA BELLE",
    "IDÔLE",
    "MY WAY",
    "OLYMPÉA",
    "SI",
    "HYPNOSE",
    "HYPNOTIC POISON",
    "PURE POISON",
    "TRESOR",
    "POÊME",
    "INSOLENCE",
    "L'INTERDIT",
    "L'EAU D'ISSEY",
    "TWILLY",
    "BACCARAT ROUGE",
    "SANTAL",
    "OUD",
    "TOBACCO",
    "VELVET",
    "CALIFORNIA DREAM",
    "STELLAR TIMES",
    "LE LION",
    "CAFTAN",
    "ERBA PURA",
    "MEGAMARE",
    "AMORE CAFFE",
    "AMBER SANTAL",
    "ARABIANS TONKA",
    "ROSE VANILLE",
    "COCO VANILLE",
    "BOIS",
    "CRYSTAL",
    "BLACK ORCHIDE",
    "BLACK AFGANO",
    "BLACK AOUDE",
    "WITHE OUD",
    "WESAL",
    "TERIAQ",
    "LATTAFA",
    "RASASI",
    "AJMAL",
    "MATIERE PREMIERE",
    "S.T. DUPONT",
    "PARIS HILTON",
    "BRITNEY SPEARS",
    "MIDNIGHT FANTASY",
    "CRAZY IN LOVE",
    "LOVE ME MORE",
    "LOVER DOSE",
    "VERY SEXY NOW",
    "VERY IRRESISTIBLE",
    "FAME",
    "FAR AWAY",
    "GEORGINA'S SENSE",
    "HAWAI",
    "ICELAND",
    "TODAY",
    "PREMIER JOUR",
    "SUPREME BOUQUET",
    "LE BOUQUET ABSOLU",
    "SCANDAL",
    "SEXY GRAFITTI",
    "SAHARA NOIR",
    "TOSCA",
    "MANIFESTO",
    "MON PARIS",
    "PRADA PARADOXE",
    "MISS DIOR",
    "J'ADORE",
    "JOY",
    "SUNSET NECTAR",
  ];
  
  // Check for exact brand matches first (longer patterns first)
  for (const brand of brandPatterns) {
    if (name.startsWith(brand + " ") || name === brand) {
      return brand;
    }
  }
  
  // Special handling for ACQUA DI GIO variants
  if (name.includes("ACQUA DI GIO")) {
    return "ACQUA DI GIO";
  }
  
  // Return first word as fallback brand
  const firstWord = name.split(" ")[0];
  return firstWord || "OTHER";
};

// Get all unique brands from products
export const getAllBrands = (): string[] => {
  const brands = new Set<string>();
  products.forEach((product) => {
    const brand = getBrandFromName(product.name);
    brands.add(brand);
  });
  return Array.from(brands).sort();
};

// Get featured/popular products for homepage
export const getFeaturedProducts = (limit: number = 8): Product[] => {
  const featuredNames = [
    "SUNSET NECTAR",
    "ACQUA DI GIO",
    "ARMANI CODE",
    "SAUVAGE",
    "CREED AVENTUS",
    "BLEU DE CHANEL",
    "ONE MILLION",
    "VERSACE DYLAN BLUE",
  ];

  const featuredProducts: Product[] = [];
  
  for (const name of featuredNames) {
    const product = products.find((p) => p.name === name);
    if (product) {
      featuredProducts.push(product);
    }
    if (featuredProducts.length >= limit) break;
  }

  // If we don't have enough featured products, fill with first products
  if (featuredProducts.length < limit) {
    const remaining = limit - featuredProducts.length;
    const additional = products
      .filter((p) => !featuredProducts.some((fp) => fp.id === p.id))
      .slice(0, remaining);
    featuredProducts.push(...additional);
  }

  return featuredProducts.slice(0, limit);
};


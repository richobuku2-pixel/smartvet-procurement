/**
 * SmartVet Africa — Purchase Order Generator
 * Full Global Vet (U) Ltd catalogue — sourced from official product catalogue PDF.
 * All 11 sections · 60+ products · Poultry, Canine, Large Animal, Equipment
 */

import * as XLSX from 'xlsx-js-style';

// ─── Colour palette ──────────────────────────────────────────────────────────
const C = {
  red_gv:    '8B0000',
  gold_gv:   'C8973A',
  green_sv:  '2D5A2D',
  dark:      '1A1A1A',
  // Section colours
  navy:      '1F3864',   // Poultry Vaccines
  teal:      '1F5C6B',   // Respiratory
  maroon:    '6B0F1A',   // Coccidiosis
  olive:     '4A5E2A',   // Vitamins & Immunity
  burnt:     '7B3F00',   // Poultry Dewormers
  purple:    '4B2D7F',   // Disinfectants & Wound Care
  indigo:    '283593',   // Canine Vaccines
  brown:     '4E2900',   // Large Animal Drugs
  forest:    '1B4332',   // Large Animal Dewormers & Bolus
  slate:     '2F4F4F',   // Equipment
  // Priority stars
  star_hi:   'FF4444',
  star_mid:  'FF9900',
  star_lo:   '888888',
};

export const SUPPLIER = {
  name:    'Global Vet (U) Ltd',
  address: 'Plot 14/18 Nakivubo Place, Venus Plaza, Shop No.V001, Kampala',
  tel:     '+256-41 4 507055  |  Mob: +256-77 6 421315  |  Fax: +256-41 4 235157',
  email:   'globalvet@infocom.co.ug',
  web:     'www.globalvetug.com',
};

export const BUYER = {
  name:    'SmartVet Africa',
  address: 'Dispatch Warehouse, Plot 75, Jomo Kenyatta Road, Elephante Commons, Gulu City',
  contact: 'Richard Obuku',
  web:     'smartvetafrica.com',
};

// ─── Full catalogue ───────────────────────────────────────────────────────────
export const CATALOGUE = [

  // ══════════════════════════════════════════════════════════════════════
  // SECTION 1: POULTRY VACCINES
  // ══════════════════════════════════════════════════════════════════════
  { section: true, color: C.navy,
    title: 'SECTION 1: VACCINES FOR POULTRY — Routine Vaccination Programme' },

  { id: 'VAC-01',
    name: 'BIO-VAC LA SOTA — Newcastle Disease Live Vaccine',
    spec: '1,000 doses/vial  |  Freeze-dried live attenuated',
    indication: 'Newcastle Disease (NCD) — #1 killer of village & commercial poultry',
    priority: '★★★', color: C.navy,
    note: 'Via drinking water or eye-drop. Store at -15°C to -4°C. Full cold chain required.' },

  { id: 'VAC-02',
    name: 'OL-VAC — Inactivated Newcastle Disease Vaccine',
    spec: '1,000 doses  |  Injectable inactivated',
    indication: 'Newcastle Disease — booster dose or inactivated option for primed flocks',
    priority: '★★★', color: C.navy,
    note: 'IM or SC injection. Use where live vaccine alone is insufficient.' },

  { id: 'VAC-03',
    name: 'BIO-VAC ND-IB — Newcastle Disease + Infectious Bronchitis',
    spec: '1,000 doses/vial  |  Freeze-dried live combination',
    indication: 'Newcastle Disease + Infectious Bronchitis — dual protection, one shot',
    priority: '★★★', color: C.navy,
    note: 'Via drinking water. Recommended for broilers at week 2–3.' },

  { id: 'VAC-04',
    name: 'IBA-VAC ST — Gumboro (IBD) 1st Vaccination',
    spec: '1,000 doses/vial  |  Freeze-dried live',
    indication: 'Gumboro / Infectious Bursal Disease (IBD) — 1st dose. Devastates immune system in young chicks.',
    priority: '★★★', color: C.navy,
    note: 'Via drinking water. Administer at day 10–14.' },

  { id: 'VAC-05',
    name: 'IBA-VAC — Gumboro (IBD) 2nd Vaccination',
    spec: '1,000 doses/vial  |  Freeze-dried live',
    indication: 'Gumboro / Infectious Bursal Disease (IBD) — booster (2nd dose)',
    priority: '★★★', color: C.navy,
    note: 'Via drinking water. Administer at day 21–24.' },

  { id: 'VAC-06',
    name: 'BIO-MAREK HVT — Marek\'s Disease Vaccine',
    spec: '1,000 doses/vial  |  Include diluent when ordering',
    indication: "Marek's Disease — causes tumours, paralysis & high mortality in layers",
    priority: '★★★', color: C.navy,
    note: 'SC injection at hatchery — day-old chicks ONLY. Strict cold chain required.' },

  { id: 'VAC-07',
    name: 'BI-VAC 1° — Infectious Bronchitis 1st Vaccination',
    spec: '1,000 doses/vial  |  Freeze-dried live',
    indication: 'Infectious Bronchitis (IB) — respiratory, reduces egg production & quality',
    priority: '★★', color: C.navy,
    note: 'Via drinking water. Week 1.' },

  { id: 'VAC-08',
    name: 'BI-VAC 2° — Infectious Bronchitis 2nd Vaccination',
    spec: '1,000 doses/vial  |  Freeze-dried live',
    indication: 'Infectious Bronchitis (IB) — booster (2nd dose)',
    priority: '★★', color: C.navy,
    note: 'Via drinking water. Week 4–5.' },

  { id: 'VAC-09',
    name: 'VAIOL-VAC — Fowl Pox Vaccine',
    spec: '1,000 doses/vial  |  Freeze-dried live',
    indication: 'Fowl Pox — common in tropical & humid environments',
    priority: '★★', color: C.navy,
    note: 'Wing-web stab method. Administer at week 6–8.' },

  { id: 'VAC-10',
    name: 'SET-VAC — Fowl Typhoid Vaccine',
    spec: '500 doses or 1,000 doses  |  State size required',
    indication: 'Fowl Typhoid (Salmonella gallinarum) — high mortality in Uganda flocks',
    priority: '★★', color: C.navy,
    note: 'Drinking water or injection. Confirm preferred route with supplier.' },

  // ══════════════════════════════════════════════════════════════════════
  // SECTION 2: RESPIRATORY TREATMENTS
  // ══════════════════════════════════════════════════════════════════════
  { section: true, color: C.teal,
    title: 'SECTION 2: RESPIRATORY DISEASE TREATMENTS — CRD, Mycoplasmosis, IB' },

  { id: 'RES-01',
    name: 'Erythrate 20% — Erythromycin Thiocyanate 20%',
    spec: '100g sachet  |  Water soluble powder',
    indication: 'Chronic Respiratory Disease (CRD) — Mycoplasma gallisepticum; first-line treatment',
    priority: '★★★', color: C.teal,
    note: '30g in 20L water for 5 consecutive days.' },

  { id: 'RES-02',
    name: 'Erythrate 35% — Erythromycin Thiocyanate 35%',
    spec: '100g sachet  |  Higher concentration',
    indication: 'CRD / Mycoplasmosis — higher-concentration option for severe outbreaks',
    priority: '★★★', color: C.teal,
    note: '20g in 20L water for 5 days.' },

  { id: 'RES-03',
    name: 'Doxy Tylovet Plus — Doxycycline 200mg + Tylosin 100mg',
    spec: '1kg bag  |  Water soluble powder',
    indication: 'CRD, Mycoplasma, E.coli, Bordetella, Haemophilus, Salmonella — broad respiratory + GI combination',
    priority: '★★★', color: C.teal,
    note: '1kg per 2,000–4,000L drinking water for 3–5 days.' },

  { id: 'RES-04',
    name: 'Doxyvet 500 — Doxycycline Hyclate 500mg',
    spec: '100g sachet  |  Water soluble',
    indication: 'Mycoplasma gallisepticum & respiratory infections susceptible to Doxycycline',
    priority: '★★', color: C.teal,
    note: '40g in 20L water for 1–7 days.' },

  { id: 'RES-05',
    name: 'Enrocure Solution — Enrofloxacin',
    spec: '100ml / 500ml / 1 Litre  |  Liquid. State size required.',
    indication: 'Respiratory, enteric & urinary tract infections — broad-spectrum fluoroquinolone',
    priority: '★★★', color: C.teal,
    note: '20ml in 20L water for 3–5 days. Repackage 1L into 100ml for paravets.' },

  { id: 'RES-06',
    name: 'Enrotrill Solution — Enrofloxacin 200mg',
    spec: 'Bottle  |  Higher concentration alternative',
    indication: 'Respiratory, enteric & urinary tract infections — Enrofloxacin alternative brand',
    priority: '★★', color: C.teal,
    note: '5ml in 20L water for 3–5 days.' },

  { id: 'RES-07',
    name: 'Gen Tylo — Gentamicin Sulphate + Tylosin Tartrate',
    spec: '100g sachet  |  Water soluble powder',
    indication: 'Wide-range respiratory, enteric & urinary bacterial infections',
    priority: '★★', color: C.teal,
    note: '20g in 20L water for 5 consecutive days.' },

  { id: 'RES-08',
    name: 'Oxytetravet 25% — Oxytetracycline 25%',
    spec: '100g or 500g  |  State size. Water soluble powder.',
    indication: 'Septicaemia, respiratory, urinary, enteric — gram +/−, rickettsia, mycoplasma. Pullorum, Fowl Cholera, E.coli.',
    priority: '★★★', color: C.teal,
    note: '10g in 20L water for 5 days. Order 500g bulk for dark store dispensing.' },

  { id: 'RES-09',
    name: 'Oxytetravet 50% — Oxytetracycline Hydrochloride 50%',
    spec: 'Water soluble powder  |  Higher concentration',
    indication: 'Septicaemia, respiratory & GI bacterial infections in poultry & pigs',
    priority: '★★', color: C.teal,
    note: '10g in 20L water for 5 days. Higher concentration, lower dose volume.' },

  { id: 'RES-10',
    name: 'Oxy Plus — Oxytetracycline + Neomycin + Vitamins A & K',
    spec: '400g pack  |  Water soluble combination',
    indication: 'Respiratory + intestinal + soft tissue. Pullorum, Fowl Cholera, Fowl Typhoid, E.coli, Salmonella.',
    priority: '★★★', color: C.teal,
    note: '400g in 100L water for 5 days.' },

  // ══════════════════════════════════════════════════════════════════════
  // SECTION 3: COCCIDIOSIS
  // ══════════════════════════════════════════════════════════════════════
  { section: true, color: C.maroon,
    title: 'SECTION 3: COCCIDIOSIS — Most Common in Broilers Weeks 2–5' },

  { id: 'COC-01',
    name: 'Amprocidia 60% — Amprolium Hydrochloride 60%',
    spec: '100g sachet  |  Water soluble',
    indication: 'Coccidiosis prevention & treatment — #1 cause of bloody diarrhoea & mortality in broilers',
    priority: '★★★', color: C.maroon,
    note: '10g in 20L water for 5 consecutive days.' },

  { id: 'COC-02',
    name: 'Coccid Soluble Powder — Amprolium Hydrochloride 20%',
    spec: 'Box of 10 sachets × 30g  |  Each 30g = 6g Amprolium HCl USP',
    indication: 'Coccidiosis in poultry, calves, lambs, kids — sachet format for smallholder farms',
    priority: '★★★', color: C.maroon,
    note: 'Severe: 1 tsp per 5L water for 5–7 days. Mild: ½ tsp per 5L. Control: ½ tsp per 10L.' },

  { id: 'COC-03',
    name: 'Anticox — Diclazuril Anticoccidial Solution',
    spec: 'Bottle  |  Liquid solution',
    indication: 'Coccidiosis — Diclazuril mode of action. Rotate with Amprolium to prevent resistance.',
    priority: '★★', color: C.maroon,
    note: '20ml in 20L water for 3 days.' },

  { id: 'COC-04',
    name: 'Primovet — Sulphadiazine-Na + Trimethoprim',
    spec: 'Water soluble powder',
    indication: 'Respiratory & GI diseases — E.coli, Pasteurella, Salmonella, Coccidiosis infections',
    priority: '★★', color: C.maroon,
    note: '10g in 20L water for 5 consecutive days.' },

  { id: 'COC-05',
    name: 'S-Dime Solution — Sodium Sulfadimidine 16% (each ml = 16% w/v)',
    spec: '125ml or 1 Litre  |  Liquid. State size.',
    indication: 'Coccidiosis, Coryza, Fowl Cholera, Fowl Typhoid, Acute Cholera, Pullorum',
    priority: '★★★', color: C.maroon,
    note: '40ml (4 tbsp) in 5L water for 3–5 days.' },

  // ══════════════════════════════════════════════════════════════════════
  // SECTION 4: VITAMINS, ELECTROLYTES & IMMUNE SUPPORT
  // ══════════════════════════════════════════════════════════════════════
  { section: true, color: C.olive,
    title: 'SECTION 4: VITAMINS, ELECTROLYTES & IMMUNE SUPPORT' },

  { id: 'VIT-01',
    name: 'Multi-Aminovet — Water Soluble Multivitamin + Amino Acids',
    spec: '100g sachet  |  Water soluble powder',
    indication: 'Growth boosting, immunity, FCR, egg production, stress relief, vitamin deficiency treatment',
    priority: '★★★', color: C.olive,
    note: '10g (1 tbsp) in 20L water for 3–5 days. Give before/after vaccinations.' },

  { id: 'VIT-02',
    name: 'Aminovet Solution — Liquid Multivitamin + Amino Acids',
    spec: '1 Litre  |  Liquid',
    indication: 'Growth, immunity, FCR, egg production & vitamin deficiency — liquid format',
    priority: '★★★', color: C.olive,
    note: '5ml in 20L water.' },

  { id: 'VIT-03',
    name: 'Cosvita WS — Water Soluble Multivitamin Complex',
    spec: '30g sachet',
    indication: 'Vitamin supplementation, retarded growth, convalescence, feed efficiency improvement',
    priority: '★★', color: C.olive,
    note: '1 sachet (30g / 3 tbsp) in 20L water for 5–7 consecutive days.' },

  { id: 'VIT-04',
    name: 'Poltricin Chick Formula',
    spec: 'Box of 5 × 25g sachets',
    indication: 'Chick starter — enhances growth, prevents CRD, systemic & GI diseases during stress',
    priority: '★★★', color: C.olive,
    note: 'Starting chicks: 1 tbsp in 5L water for 7 days. Stress: 1 tsp in 10L water for 7 days.' },

  { id: 'VIT-05',
    name: 'Poltricin Mayai Formula',
    spec: 'Box of 5 × 25g sachets',
    indication: 'Layer production — peak production, egg quality, FCR, hatching rate & storage',
    priority: '★★', color: C.olive,
    note: 'Young layers: 1 heaped tsp in 10L water at point of lay for 7 days. Healthy: 1 tsp in 50L.' },

  // ══════════════════════════════════════════════════════════════════════
  // SECTION 5: POULTRY DEWORMERS
  // ══════════════════════════════════════════════════════════════════════
  { section: true, color: C.burnt,
    title: 'SECTION 5: DEWORMERS — Poultry' },

  { id: 'DEW-01',
    name: 'Ascarex D Worm Powder — Piperazine Dihydrochloride',
    spec: 'Box of 10 sachets × 30g  |  Water soluble. Instant expulsion.',
    indication: 'Roundworms (Ascaridiasis) — highly prevalent in free-range & semi-intensive flocks',
    priority: '★★★', color: C.burnt,
    note: '30g in 20–30L water per 100 birds (1 tsp in 3–5L per 15 birds). 1-day treatment ONLY.' },

  { id: 'DEW-02',
    name: 'Piperamentic — Piperazine as Citrate',
    spec: '100g or 500g  |  State size. Also for large animals.',
    indication: 'Ascaridiasis & roundworms in poultry & large animals. Bulk pack for dark store.',
    priority: '★★★', color: C.burnt,
    note: 'Poultry: 40g in 20L water for 1 day ONLY. Do not exceed recommended dose.' },

  // ══════════════════════════════════════════════════════════════════════
  // SECTION 6: DISINFECTANTS & WOUND CARE
  // ══════════════════════════════════════════════════════════════════════
  { section: true, color: C.purple,
    title: 'SECTION 6: DISINFECTANTS, WOUND CARE & BIOSECURITY' },

  { id: 'DIS-01',
    name: 'Oytetravet Aerosol — Oxytetracycline + Purple Dye Spray',
    spec: 'Aerosol can',
    indication: 'Wound treatment & fly repellent — debeaking wounds, cannibalism injuries, scaly leg, cuts',
    priority: '★★', color: C.purple,
    note: 'Spray directly on wound. Purple dye marks treated area and helps monitor healing progress.' },

  { id: 'DIS-02',
    name: 'Disinfectant — Advise equivalent to Norocleanse',
    spec: '1 Litre / 5 Litre  |  Please advise available brands & dilution rates',
    indication: 'Poultry house disinfection, water system flushing, equipment cleaning, biosecurity between flocks',
    priority: '★★★', color: C.purple,
    note: 'Please confirm preferred product name, dilution rate and cost per litre.' },

  // ══════════════════════════════════════════════════════════════════════
  // SECTION 7: CANINE VACCINES
  // ══════════════════════════════════════════════════════════════════════
  { section: true, color: C.indigo,
    title: 'SECTION 7: CANINE VACCINES — Dogs' },

  { id: 'CAN-01',
    name: 'CANVAC R — Rabies Vaccine',
    spec: 'Single dose vials  |  State quantity required',
    indication: 'Rabies prevention in dogs — zoonotic disease, mandatory vaccination',
    priority: '★★★', color: C.indigo,
    note: 'Annual booster required. Critical for paravet dog vaccination outreach programmes.' },

  { id: 'CAN-02',
    name: 'CANVAC P — Parvovirosis Vaccine',
    spec: 'Single dose vials  |  State quantity required',
    indication: 'Canine Parvovirus — highly contagious, often fatal in unvaccinated dogs',
    priority: '★★', color: C.indigo,
    note: 'Puppy series: 6 weeks, 9 weeks, 12 weeks. Annual booster.' },

  { id: 'CAN-03',
    name: 'CANVAC 8 DHPPiL — 8-in-1 Vaccine',
    spec: 'Vials  |  State quantity required',
    indication: '8 killer diseases of canines — Distemper, Hepatitis, Parvovirus, Parainfluenza, Leptospirosis + more',
    priority: '★★', color: C.indigo,
    note: 'Comprehensive protection in one vaccine. Annual vaccination.' },

  // ══════════════════════════════════════════════════════════════════════
  // SECTION 8: LARGE ANIMAL DRUGS — INJECTABLES
  // ══════════════════════════════════════════════════════════════════════
  { section: true, color: C.brown,
    title: 'SECTION 8: LARGE ANIMAL DRUGS — Injectable (Cattle, Goats, Sheep)' },

  { id: 'LAD-01',
    name: 'Oxytetravet 10% Inj — Oxytetracycline HCl 10%',
    spec: 'Vial  |  Injectable solution',
    indication: 'Bacterial infections in horses, cattle, goats, sheep & pigs sensitive to Oxytetracycline',
    priority: '★★★', color: C.brown,
    note: '1ml per 10kg body weight.' },

  { id: 'LAD-02',
    name: 'Oxytetravet 20% LA Inj — Long-Acting Oxytetracycline',
    spec: 'Vial  |  Long-acting injectable',
    indication: 'Wide range bacterial diseases in cattle, sheep & goats — respiratory, navel/joint ill, mastitis, septicaemia',
    priority: '★★★', color: C.brown,
    note: 'Long-acting formulation. IM injection only.' },

  { id: 'LAD-03',
    name: 'Oxytetravet 30% Inj LA — Oxytetracycline Dihydrate',
    spec: 'Vial  |  Prolonged sustained-action injectable',
    indication: 'Pasteurellosis, pneumonia, atrophic rhinitis, pink eye, navel ill, mastitis, enzootic abortion in sheep',
    priority: '★★', color: C.brown,
    note: 'Prolonged and sustained activity. State dose rate required.' },

  { id: 'LAD-04',
    name: 'Gentavet Inj — Gentamicin Sulphate 50mg',
    spec: 'Vial  |  Injectable solution',
    indication: 'Urinary, respiratory & reproductive tract infections; skin & soft tissue infections',
    priority: '★★', color: C.brown,
    note: '1ml per 10kg twice daily for 1 day, then once daily for 3–4 days.' },

  { id: 'LAD-05',
    name: 'GENTAVET 10% — Gentamicin Sulphate 100mg',
    spec: '100ml  |  Injectable solution',
    indication: 'GI & lung nematodes, liver flukes, warbles, eye worms, mites & lice in beef cattle & shoats',
    priority: '★★', color: C.brown,
    note: '1ml per 50kg body weight (cattle & sheep).' },

  { id: 'LAD-06',
    name: 'Tylorate Inj — Tylosin Tartrate 200mg',
    spec: 'Vial  |  Injectable solution',
    indication: 'Respiratory conditions including CBPP/CCPP caused by Mycoplasma spp. in cattle',
    priority: '★★', color: C.brown,
    note: 'Confirm dose rate with supplier. Indicated specifically for contagious bovine pleuropneumonia.' },

  { id: 'LAD-07',
    name: 'Multivitamin Inj — Injectable Multivitamin Solution',
    spec: 'Vial  |  Injectable solution',
    indication: 'Vitamin deficiencies in animals — boosts FCR, metabolism, growth rate & fertility',
    priority: '★★', color: C.brown,
    note: 'State dose rate required.' },

  { id: 'LAD-08',
    name: 'Butex Inj — Buparvaquone Injectable',
    spec: 'Vial  |  Injectable solution',
    indication: 'Theileriosis (East Coast Fever, Corridor Disease, Tropical Theileriosis) in cattle',
    priority: '★★★', color: C.brown,
    note: '1ml per 20kg body weight. Critical for cattle-keeping communities in Northern Uganda.' },

  { id: 'LAD-09',
    name: 'Hexavet LA — Anti-inflammatory + Antibiotic Injectable',
    spec: 'Vial  |  Long-acting injectable',
    indication: 'Bacterial pneumonia and infectious diseases requiring anti-inflammatory & antipyretic effects',
    priority: '★★', color: C.brown,
    note: 'IM injection only at 1ml per 10kg body weight.' },

  { id: 'LAD-10',
    name: 'Dexaroide — Dexamethasone Na-Phosphate',
    spec: 'Vial  |  Injectable solution',
    indication: 'Ketosis & acetonaemia, shock conditions, allergies, wide range of inflammatory conditions',
    priority: '★★', color: C.brown,
    note: '1ml per 25kg body weight. Contraindicated in pregnant animals.' },

  { id: 'LAD-11',
    name: 'Imicarb — Imicarb Dipropionate',
    spec: 'Vial  |  Injectable solution',
    indication: 'Babesiosis in cattle, horses & dogs; Anaplasmosis in cattle; Canine Ehrlichiosis',
    priority: '★★', color: C.brown,
    note: 'Confirm dose rate with supplier.' },

  { id: 'LAD-12',
    name: 'VITBLOCK — Mineral Lick Block',
    spec: 'Block  |  State quantity',
    indication: 'Mineral & vitamin deficiency prevention. Fattening and immune boosting in domestic animals.',
    priority: '★', color: C.brown,
    note: 'Highly nutritious lick enriched with minerals & vitamins. Free-access mineral supplementation.' },

  // ══════════════════════════════════════════════════════════════════════
  // SECTION 9: LARGE ANIMAL DEWORMERS
  // ══════════════════════════════════════════════════════════════════════
  { section: true, color: C.forest,
    title: 'SECTION 9: LARGE ANIMAL DEWORMERS & ANTHELMINTICS' },

  { id: 'DEL-01',
    name: 'ALBEVET 10% — Albendazole 10% Oral Suspension',
    spec: 'Bottle  |  Oral suspension',
    indication: 'Broad-spectrum dewormer against nematodes, flukes & tapeworms in domestic animals',
    priority: '★★★', color: C.forest,
    note: 'State dose rate and species.' },

  { id: 'DEL-02',
    name: 'ALBEMEC — Albendazole 50mg + Ivermectin 10mg per ml',
    spec: 'Bottle  |  Oral suspension',
    indication: 'Flukes, roundworms, tapeworms & ectoparasites in cattle, sheep & goats',
    priority: '★★★', color: C.forest,
    note: 'Combined antiparasitic — broadest spectrum coverage.' },

  { id: 'DEL-03',
    name: 'TECTIN — Ivermectin 1% Injectable Solution',
    spec: '50ml or 100ml  |  State size',
    indication: 'Helminthosis, mange & ectoparasite infestations in cattle & shoats',
    priority: '★★★', color: C.forest,
    note: '1ml per 50kg body weight. SC injection.' },

  { id: 'DEL-04',
    name: 'TECTIN SUPER — Ivermectin + Clorsulon',
    spec: '50ml or 100ml  |  State size',
    indication: 'GI & lung nematodes, liver flukes, warbles, eye worms, mites & lice in beef cattle',
    priority: '★★', color: C.forest,
    note: '1ml per 50kg body weight. Broader coverage than TECTIN alone — adds Clorsulon for flukes.' },

  { id: 'DEL-05',
    name: 'IVOSAN — Ivermectin + Closantel',
    spec: 'Bottle  |  Injectable or oral. State route.',
    indication: 'Roundworm & fluke infestation in cattle & shoats',
    priority: '★★', color: C.forest,
    note: '1ml per 25kg live body weight.' },

  { id: 'DEL-06',
    name: 'Wormicid 1g — Levamisole HCl 1g Bolus',
    spec: 'Box of 30 boluses',
    indication: 'Intestinal strongyles, Ascarides & lungworms in cattle. Safe in pregnant & sick animals.',
    priority: '★★', color: C.forest,
    note: 'Dose by body weight: up to 100kg = ¾ bolus; 200–300kg = 1½–2½ bolus; 300kg+ = 2½ bolus.' },

  { id: 'DEL-07',
    name: 'Wormicid 150 — Levamisole HCl 150mg Tablet',
    spec: 'Box of 100 tablets',
    indication: 'Broad-spectrum GI & lungworms in sheep, goats & pigs. Rapid action within hours.',
    priority: '★★', color: C.forest,
    note: 'Sheep/goats up to 20kg = 1 tab; 21–40kg = 2 tabs; pigs 41–60kg = 3 tabs.' },

  { id: 'DEL-08',
    name: 'Wormicid Liquid — Levamisole HCl 1.5% w/v',
    spec: '125ml or 1 Litre  |  State size',
    indication: 'Stomach & intestinal strongyles, Ascarides, roundworms, lungworms & eye worms in cattle/sheep/goats/pigs',
    priority: '★★', color: C.forest,
    note: '1ml per 2kg body weight oral drench. Do not dilute.' },

  { id: 'DEL-09',
    name: 'WORMICID PLUS-O — Levamisole + Oxyclozanide + Cobalt',
    spec: '125ml or 1 Litre  |  State size',
    indication: 'Liver flukes, lungworms, stomach & intestinal worms, rumen flukes in sheep, cattle & goats',
    priority: '★★★', color: C.forest,
    note: '1ml per 2kg body weight oral drench. Broadest coverage anthelmintic in the range.' },

  { id: 'DEL-10',
    name: 'Wormita Suspension — Albendazole 2.5% w/v',
    spec: '125ml  |  Oral suspension drench',
    indication: 'Roundworms, lungworms, tapeworms & liverflukes in cattle, sheep & goats',
    priority: '★★', color: C.forest,
    note: 'Oral drench. Do not exceed recommended dose.' },

  { id: 'DEL-11',
    name: 'S-Dime Bolus — Sulfadimidine 5g Bolus',
    spec: 'Box of 10 boluses',
    indication: 'Enteritis, pneumonia, metritis, hepatitis, navel ill, foot rot, actinobacillosis & coccidiosis',
    priority: '★★', color: C.forest,
    note: '1 bolus per 25kg body weight. Oral, bolus gun, or dissolved in water.' },

  { id: 'DEL-12',
    name: 'Diseptoprim Bolus — Trimethoprim 200mg + Sulfadiazine 1g',
    spec: 'Box of 40 boluses',
    indication: 'Bacterial scours in calves/sheep/goats, salmonellosis, bacterial pneumonia, post-parturient metritis',
    priority: '★★', color: C.forest,
    note: '1 bolus per 40kg body weight twice daily. Also for intra-uterine use (cows/mares: 2–4 boluses).' },

  { id: 'DEL-13',
    name: 'Wormicid 1g — Levamisole HCl 1g Bolus (Cattle)',
    spec: 'Box of 30 boluses',
    indication: 'Intestinal strongyles, Ascarides & lungworms in cattle. Safe in pregnant animals.',
    priority: '★★', color: C.forest,
    note: 'Calves up to 100kg = ¾ bolus; 200–300kg = 1½–2½ bolus; 300kg+ = 2½ bolus.' },

  // ══════════════════════════════════════════════════════════════════════
  // SECTION 10: PET / COMPANION ANIMAL
  // ══════════════════════════════════════════════════════════════════════
  { section: true, color: C.indigo,
    title: 'SECTION 10: PET & COMPANION ANIMAL PRODUCTS — Dogs & Cats' },

  { id: 'PET-01',
    name: 'Petdog Ascaten-P — Mebendazole 110mg + Piperazine 275mg + Praziquantel 25mg',
    spec: 'Box of 10 × 6 tablets',
    indication: 'Broad-spectrum dewormer for dogs & cats — roundworms, tapeworms, hookworms',
    priority: '★★', color: C.indigo,
    note: '1 tablet per 5kg body weight. Give by mouth directly or crush in food. Not for unweaned puppies.' },

  // ══════════════════════════════════════════════════════════════════════
  // SECTION 11: EQUIPMENT & ADMINISTRATION
  // ══════════════════════════════════════════════════════════════════════
  { section: true, color: C.slate,
    title: 'SECTION 11: EQUIPMENT & ADMINISTRATION SUPPLIES' },

  { id: 'EQP-01',
    name: 'HSW ECO-MATIC Automatic Syringe',
    spec: '0.3ml / 1ml / 2ml / 5ml  |  State sizes required',
    indication: 'Vaccine & drug administration — injectable products (Marek\'s, OL-VAC, large animal injections)',
    priority: '★★★', color: C.slate,
    note: 'State sizes required. One per paravet field kit minimum. Order adequate stock.' },

  { id: 'EQP-02',
    name: 'HSW ROUX-REVOLVER Automatic Syringe',
    spec: '10ml / 30ml / 50ml  |  State sizes required',
    indication: 'Large-volume drug & vaccine administration in livestock',
    priority: '★★', color: C.slate,
    note: 'For bulk antibiotic injection in larger farms. State sizes required.' },

  { id: 'EQP-03',
    name: 'HSW MULTI-MATIC Automatic Syringe',
    spec: '25ml or 50ml  |  State size',
    indication: 'Multi-dose automatic syringe for high-volume vaccination campaigns',
    priority: '★★', color: C.slate,
    note: 'State size required.' },

  { id: 'EQP-04',
    name: 'HSW ECO-MATIC Automatic Drencher',
    spec: '30ml',
    indication: 'Oral deworming / drenching — poultry & small animals. Accurate dose delivery.',
    priority: '★★', color: C.slate,
    note: 'Accurate dosing for deworming rounds in small livestock & poultry.' },

  { id: 'EQP-05',
    name: 'EUROPLEX Automatic Drencher',
    spec: '30ml',
    indication: 'Oral deworming / drenching alternative brand',
    priority: '★★', color: C.slate,
    note: 'Alternative to HSW ECO-MATIC. Confirm availability.' },

  { id: 'EQP-06',
    name: 'Leur Lock Hard Plastic Syringes',
    spec: 'Assorted sizes — state volumes required',
    indication: 'General vaccine & drug administration. Single-use disposable syringes.',
    priority: '★★★', color: C.slate,
    note: 'Order adequate supply per visit cycle. State sizes: 1ml, 2ml, 5ml, 10ml, 20ml.' },

  { id: 'EQP-07',
    name: 'Ear Tags & Applicator',
    spec: 'State colour, numbering & quantity',
    indication: 'Livestock identification — cattle, goats, sheep. Traceability & herd management.',
    priority: '★', color: C.slate,
    note: 'Specify colour, sequential numbering range, and applicator if needed.' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const CATALOGUE_PRODUCTS = CATALOGUE.filter(e => !e.section);
export const CATALOGUE_SECTIONS = CATALOGUE.filter(e =>  e.section);

// ─── Style helpers ────────────────────────────────────────────────────────────
function fill(rgb) { return { patternType: 'solid', fgColor: { rgb } }; }
function font(bold = false, rgb = '000000', sz = 10, italic = false) {
  return { bold, color: { rgb }, sz, italic, name: 'Arial' };
}
function align(horizontal = 'left', vertical = 'center', wrapText = true) {
  return { horizontal, vertical, wrapText };
}
function border(sides = 'all', rgb = 'CCCCCC') {
  const s = { style: 'thin', color: { rgb } };
  if (sides === 'all') return { top: s, bottom: s, left: s, right: s };
  return {};
}
function colLetter(n) {
  let s = ''; n += 1;
  while (n > 0) { s = String.fromCharCode(65 + ((n - 1) % 26)) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

// ─── Main generator ───────────────────────────────────────────────────────────
export function generatePurchaseOrder({
  orderNo = 'SV-GV-001',
  orderDate = null,
  paymentTerms = '30 days net',
  quantities = {},
} = {}) {
  const today = new Date();
  const dateStr = orderDate || today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const ws = {};
  const merges = [];
  const rowHeights = {};
  let maxRow = 0;

  function setCell(col, row, cellObj) {
    ws[colLetter(col) + row] = cellObj;
    if (row > maxRow) maxRow = row;
  }
  function mergeRange(sc, sr, ec, er) {
    merges.push({ s: { c: sc, r: sr - 1 }, e: { c: ec, r: er - 1 } });
  }
  function mergedCell(sc, sr, ec, er, cellObj) {
    mergeRange(sc, sr, ec, er);
    setCell(sc, sr, cellObj);
    for (let c = sc; c <= ec; c++)
      for (let r = sr; r <= er; r++)
        if (!(c === sc && r === sr)) ws[colLetter(c) + r] = { t: 's', v: '', s: cellObj.s };
  }

  // ── Header block ─────────────────────────────────────────────────────
  rowHeights[1] = 8;
  mergedCell(0, 1, 8, 1, { t: 's', v: '', s: { fill: fill(C.red_gv) } });

  rowHeights[2] = 40;
  mergedCell(0, 2, 4, 2, { t: 's', v: 'PURCHASE ORDER', s: { fill: fill(C.red_gv), font: font(true, 'FFFFFF', 20), alignment: align('left', 'center', false) } });
  mergedCell(5, 2, 8, 2, { t: 's', v: 'Global Vet (U) Ltd  ·  Veterinary Pharmaceuticals', s: { fill: fill(C.red_gv), font: font(true, C.gold_gv, 11), alignment: align('right', 'center', false) } });

  rowHeights[3] = 6;
  mergedCell(0, 3, 8, 3, { t: 's', v: '', s: { fill: fill(C.gold_gv) } });

  const infoRows = [
    [4, `SUPPLIER: ${SUPPLIER.name}  |  ${SUPPLIER.address}`, 'ORDER NO:', orderNo],
    [5, `Tel: ${SUPPLIER.tel}  |  Email: ${SUPPLIER.email}`, 'ORDER DATE:', dateStr],
    [6, `SHIP TO: ${BUYER.name}  |  ${BUYER.address}`, 'REQUIRED BY:', 'To be confirmed'],
    [7, `Contact: ${BUYER.contact}  |  ${BUYER.web}`, 'PAYMENT TERMS:', paymentTerms],
  ];
  for (const [r, left, key, val] of infoRows) {
    rowHeights[r] = 16;
    mergedCell(0, r, 4, r, { t: 's', v: left, s: { font: font(false, C.dark, 9), alignment: align('left', 'center') } });
    mergedCell(5, r, 6, r, { t: 's', v: key,  s: { font: font(true,  C.dark, 9), alignment: align('right', 'center') } });
    mergedCell(7, r, 8, r, { t: 's', v: val,  s: { font: font(true,  '0000FF', 9), alignment: align('left', 'center') } });
  }

  rowHeights[8] = 6;
  mergedCell(0, 8, 8, 8, { t: 's', v: '', s: { fill: fill('DDDDDD') } });

  rowHeights[9] = 13;
  mergedCell(0, 9, 8, 9, { t: 's', v: '  ★★★ = High demand / critical    ★★ = Important    ★ = Useful    Yellow cells = SmartVet fills Qty    Red-tint cells = Global Vet fills Unit Price    Amount = auto-calculated', s: { fill: fill('333333'), font: font(false, 'FFFFFF', 8), alignment: align('left', 'center', false) } });

  // ── Column headers ────────────────────────────────────────────────────
  rowHeights[10] = 28;
  const headers = ['Code', 'Product Name', 'Pack Size / Specification', 'Disease / Indication', 'Priority', 'Qty', 'Unit Price\n(UGX)', 'Amount\n(UGX)', 'Notes / Dosage'];
  headers.forEach((h, i) => {
    setCell(i, 10, { t: 's', v: h, s: { fill: fill(C.dark), font: font(true, 'FFFFFF', 10), alignment: align('center', 'center', true), border: border('all') } });
  });

  // ── Products ──────────────────────────────────────────────────────────
  let row = 11;
  const itemRows = [];

  for (const entry of CATALOGUE) {
    if (entry.section) {
      rowHeights[row] = 18;
      mergedCell(0, row, 8, row, { t: 's', v: `  ${entry.title}`, s: { fill: fill(entry.color), font: font(true, 'FFFFFF', 10), alignment: align('left', 'center', false), border: border('all') } });
    } else {
      rowHeights[row] = 40;
      itemRows.push(row);
      const isEven = itemRows.length % 2 === 0;
      const bg = isEven ? 'F8F5F0' : 'FFFFFF';
      const starColor = entry.priority.includes('★★★') ? C.star_hi : entry.priority.includes('★★') ? C.star_mid : C.star_lo;
      const qtyVal = quantities[entry.id] != null ? quantities[entry.id] : null;

      setCell(0, row, { t: 's', v: entry.id || '', s: { fill: fill(bg), font: font(false, '999999', 8), alignment: align('center', 'center'), border: border('all') } });
      setCell(1, row, { t: 's', v: entry.name, s: { fill: fill(bg), font: font(true, C.dark, 9), alignment: align('left', 'center', true), border: border('all') } });
      setCell(2, row, { t: 's', v: entry.spec, s: { fill: fill(bg), font: font(false, '555555', 8), alignment: align('left', 'center', true), border: border('all') } });
      setCell(3, row, { t: 's', v: entry.indication, s: { fill: fill(bg), font: font(false, '1A1A6B', 8), alignment: align('left', 'center', true), border: border('all') } });
      setCell(4, row, { t: 's', v: entry.priority, s: { fill: fill(bg), font: font(true, starColor, 9), alignment: align('center', 'center'), border: border('all') } });

      if (qtyVal != null) {
        setCell(5, row, { t: 'n', v: qtyVal, s: { fill: fill('FFFDE7'), font: font(true, '0000FF', 11), alignment: align('center', 'center'), border: border('all') } });
      } else {
        setCell(5, row, { t: 's', v: '', s: { fill: fill('FFFDE7'), font: font(true, '0000FF', 11), alignment: align('center', 'center'), border: border('all') } });
      }

      setCell(6, row, { t: 's', v: '', s: { fill: fill('FFF0F0'), font: font(true, 'AA0000', 10), alignment: align('right', 'center'), border: border('all') } });
      setCell(7, row, { t: 'n', f: `IF(AND(ISNUMBER(F${row}),ISNUMBER(G${row})),F${row}*G${row},"")`, s: { fill: fill(bg), font: font(true, C.dark, 10), alignment: align('right', 'center'), border: border('all') } });
      setCell(8, row, { t: 's', v: entry.note, s: { fill: fill(bg), font: font(false, '666666', 8), alignment: align('left', 'center', true), border: border('all') } });
    }
    row++;
  }

  // ── Totals ─────────────────────────────────────────────────────────────
  row++;
  rowHeights[row] = 6;
  mergedCell(0, row, 8, row, { t: 's', v: '', s: {} });
  row++;

  const subRow = row;
  const fSum = itemRows.length > 0 ? `SUM(H${itemRows[0]}:H${itemRows[itemRows.length - 1]})` : '0';

  rowHeights[row] = 22;
  mergedCell(0, row, 6, row, { t: 's', v: 'SUBTOTAL (UGX)', s: { fill: fill('E8F0E8'), font: font(true, C.green_sv, 10), alignment: align('right', 'center'), border: border('all') } });
  setCell(7, row, { t: 'n', f: fSum, s: { fill: fill('E8F0E8'), font: font(false, C.green_sv, 10), alignment: align('right', 'center'), border: border('all') } });
  setCell(8, row, { t: 's', v: '', s: { fill: fill('E8F0E8'), border: border('all') } });
  row++;

  const vatRow = row;
  rowHeights[row] = 22;
  mergedCell(0, row, 6, row, { t: 's', v: 'VAT / TAX — Global Vet to confirm applicable rate', s: { fill: fill('FFF0F0'), font: font(true, 'AA0000', 10), alignment: align('right', 'center'), border: border('all') } });
  setCell(7, row, { t: 's', v: '', s: { fill: fill('FFF0F0'), font: font(true, 'AA0000', 10), alignment: align('right', 'center'), border: border('all') } });
  setCell(8, row, { t: 's', v: '', s: { fill: fill('FFF0F0'), border: border('all') } });
  row++;

  rowHeights[row] = 30;
  mergedCell(0, row, 6, row, { t: 's', v: 'GRAND TOTAL (UGX)', s: { fill: fill(C.dark), font: font(true, 'FFFFFF', 12), alignment: align('right', 'center'), border: border('all') } });
  setCell(7, row, { t: 'n', f: `H${subRow}+IF(ISNUMBER(H${vatRow}),H${vatRow},0)`, s: { fill: fill(C.dark), font: font(true, C.gold_gv, 13), alignment: align('right', 'center'), border: border('all') } });
  setCell(8, row, { t: 's', v: '', s: { fill: fill(C.dark), border: border('all') } });
  row++;

  // ── Footer ──────────────────────────────────────────────────────────────
  row++;
  rowHeights[row] = 16;
  mergedCell(0, row, 8, row, { t: 's', v: '  COMPLETION:  Yellow (Qty) → SmartVet fills before sending  |  Red tint (Unit Price) → Global Vet fills and returns  |  Amount column auto-calculates', s: { fill: fill('333333'), font: font(false, 'FFFFFF', 8), alignment: align('left', 'center', false) } });
  row++;

  rowHeights[row] = 20;
  mergedCell(0, row, 8, row, { t: 's', v: '  NOTES TO GLOBAL VET: Please confirm stock availability, note any substitutions or out-of-stock items, and advise on cold chain handling for vaccines on delivery to Gulu City, Uganda.', s: { fill: fill('F5F5F5'), font: font(false, '444444', 8), alignment: align('left', 'center', true) } });
  row++;

  rowHeights[row] = 13;
  mergedCell(0, row, 8, row, { t: 's', v: `  ${BUYER.name}  ·  Prepared ${dateStr}  ·  ${BUYER.address}  ·  ${BUYER.web}  |  Supplier: ${SUPPLIER.name}  ·  ${SUPPLIER.web}`, s: { font: font(false, '999999', 8), alignment: align('center', 'center', false) } });

  // ── Sheet metadata ─────────────────────────────────────────────────────
  ws['!ref'] = `A1:I${maxRow}`;
  ws['!merges'] = merges;
  ws['!cols'] = [
    { wch: 9 }, { wch: 34 }, { wch: 26 }, { wch: 28 },
    { wch: 10 }, { wch: 9 }, { wch: 17 }, { wch: 17 }, { wch: 26 },
  ];
  ws['!rows'] = Array.from({ length: maxRow }, (_, i) => ({ hpt: rowHeights[i + 1] || 14 }));
  ws['!freeze'] = { xSplit: 0, ySplit: 10, topLeftCell: 'A11', activePane: 'bottomLeft' };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Purchase Order');

  const yyyymmdd = today.toISOString().split('T')[0].replace(/-/g, '');
  const filename = `SmartVet_PO_${orderNo}_${yyyymmdd}.xlsx`;
  XLSX.writeFile(wb, filename, { cellStyles: true, bookType: 'xlsx', compression: true });
  return filename;
}

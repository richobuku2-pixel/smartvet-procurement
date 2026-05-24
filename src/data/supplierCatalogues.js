/**
 * Seed catalogue for Global Vet (U) Ltd — sourced from official product catalogue PDF.
 * Each item will be stored per-supplier in AppContext under supplierCatalogues[supplierName].
 */

const C = {
  navy:   '1F3864', teal:   '1F5C6B', maroon: '6B0F1A',
  olive:  '4A5E2A', burnt:  '7B3F00', purple: '4B2D7F',
  indigo: '283593', brown:  '4E2900', forest: '1B4332',
  slate:  '2F4F4F',
};

// ═══════════════════════════════════════════════════════════════════════════════
// ERAM UGANDA LIMITED — NDA Drug Register (Feb 2024)
// Source: Uganda National Drug Authority — National Drug Register of Uganda,
//         Veterinary Medicines, February 2024.
//         All products listed under Marketing Authorization Holder: Eram Uganda Ltd.
// Plot 3 Hoima Road (ERAM House), Bakuli, Kampala. Est. 1996.
// Major principals: Laboratorios HIPRA (Spain), Intervet/MSD (Netherlands),
//                   VMD NV (Belgium), Cosmos Ltd (Kenya), Alivira (India).
// ═══════════════════════════════════════════════════════════════════════════════
const CE = {
  navy:   '1F3864', indigo: '283593', teal:   '005F73',
  maroon: '6B0F1A', forest: '1B4332', brown:  '4E2900',
  olive:  '4A5E2A', purple: '4B2D7F', slate:  '2F4F4F',
  red:    '7B0D1E',
};

export const ERAM_CATALOGUE = [

  // ── SECTION 1: POULTRY VACCINES — HIPRA ──────────────────────────────────
  { id:'ER-HV01', section:'Poultry Vaccines — HIPRA', sectionColor:CE.navy, priority:'★★★',
    name:'HIPRAVIAR S — Newcastle Disease Vaccine (Lasota)',
    spec:'Live attenuated Newcastle Lasota strain  |  Lyophilised',
    indication:'Newcastle Disease (NCD) — primary vaccination, broilers & layers',
    unit:'vials', note:'Via drinking water, eye-drop or spray. Store at 2–8°C. Hipra, Spain.' },

  { id:'ER-HV02', section:'Poultry Vaccines — HIPRA', sectionColor:CE.navy, priority:'★★★',
    name:'HIPRAVIAR CLON — Newcastle Disease Vaccine (CL/79)',
    spec:'Attenuated live Newcastle CL/79 clone  |  Oral liquid  |  10⁶·⁵–10⁷·⁷ EID₅₀/dose',
    indication:'Newcastle Disease — mild velogenic/mesogenic strains',
    unit:'vials', note:'Via eye-drop (0.03 ml/bird). Hipra, Spain.' },

  { id:'ER-HV03', section:'Poultry Vaccines — HIPRA', sectionColor:CE.navy, priority:'★★★',
    name:'HIPRAVIAR B1/H120 — Newcastle + IB Combo',
    spec:'Live Newcastle B1 strain + Live IB Mass H120  |  Parenteral/oral',
    indication:'Newcastle Disease + Infectious Bronchitis — dual protection',
    unit:'vials', note:'Administer at 1–3 days & 14–21 days. Hipra, Spain.' },

  { id:'ER-HV04', section:'Poultry Vaccines — HIPRA', sectionColor:CE.navy, priority:'★★★',
    name:'HIPRAVIAR CLON/H120 — Newcastle + IB Combo',
    spec:'Live Newcastle CL/79 ≥10⁶·⁵ EID₅₀ + Live IB Mass H120 ≥10³ EID₅₀  |  Oral liquid',
    indication:'Newcastle Disease + Infectious Bronchitis — combined live vaccine',
    unit:'vials', note:'Drinking water or spray. Hipra, Spain.' },

  { id:'ER-HV05', section:'Poultry Vaccines — HIPRA', sectionColor:CE.navy, priority:'★★★',
    name:'HIPRAGUMBORO CH/80 — Gumboro (IBD) Vaccine',
    spec:'Cloned live IBD virus CH/80  |  10³·⁵ TCID₅₀/dose  |  Lyophilised',
    indication:'Infectious Bursal Disease (Gumboro) — intermediate plus strain',
    unit:'vials', note:'Via drinking water. Intermediate immunity in high-challenge farms. Hipra, Spain.' },

  { id:'ER-HV06', section:'Poultry Vaccines — HIPRA', sectionColor:CE.navy, priority:'★★★',
    name:'HIPRAGUMBORO GM97 — Gumboro (IBD) Vaccine',
    spec:'Live IBD virus strain GM97  |  10²–10³ EID₅₀/dose  |  Oral solid',
    indication:'Infectious Bursal Disease — mild/intermediate strain',
    unit:'vials', note:'Via drinking water. Day 14–21. Hipra, Spain.' },

  { id:'ER-HV07', section:'Poultry Vaccines — HIPRA', sectionColor:CE.navy, priority:'★★★',
    name:'GUMBOHATCH — Gumboro In-Ovo / Hatchery Vaccine',
    spec:'Live attenuated IBD strain 1052  |  Parenteral / in-ovo',
    indication:'Infectious Bursal Disease — in-ovo or day-of-hatch administration',
    unit:'vials', note:'In-ovo at day 18 of incubation or SC at hatch. Hipra, Spain.' },

  { id:'ER-HV08', section:'Poultry Vaccines — HIPRA', sectionColor:CE.navy, priority:'★★',
    name:'HIPRAVIAR TRT — Turkey Rhinotracheitis Vaccine',
    spec:'Inactivated Turkey Rhinotracheitis Virus (TRTV) strain 1062  |  ELISA ≥196 units  |  Parenteral',
    indication:'Turkey/swollen head syndrome — respiratory rhinotracheitis in turkeys',
    unit:'vials', note:'IM or SC injection. Hipra, Spain.' },

  { id:'ER-HV09', section:'Poultry Vaccines — HIPRA', sectionColor:CE.navy, priority:'★★★',
    name:'HIPRAVIAR IB+ND+EDS — Triple Inactivated Vaccine',
    spec:'Inactivated IB H52 + ND Lasota + EDS-76  |  26–28 HAI¹, 24–26 HAI², 27–29 HAI¹  |  Parenteral',
    indication:'Infectious Bronchitis + Newcastle Disease + Egg Drop Syndrome — layer booster',
    unit:'vials', note:'IM injection into breast muscle or neck. Hipra, Spain.' },

  { id:'ER-HV10', section:'Poultry Vaccines — HIPRA', sectionColor:CE.navy, priority:'★★',
    name:'AVISAN SECURE — Salmonella Enteritidis Vaccine',
    spec:'Inactivated Salmonella Enteritidis PT-4 fagotype MAT  |  Oil emulsion',
    indication:'Salmonella Enteritidis prevention — layer flocks (zoonotic control)',
    unit:'vials', note:'IM injection. 2 doses before point of lay. Hipra, Spain.' },

  { id:'ER-HV11', section:'Poultry Vaccines — HIPRA', sectionColor:CE.navy, priority:'★★',
    name:'EVALON — Coccidiosis Vaccine (Live)',
    spec:'Eimeria acervulina + E. brunetti + E. maxima + E. necatrix + E. tenella  |  Oral',
    indication:'Coccidiosis prevention — broilers (5 Eimeria strains, live controlled)',
    unit:'vials', note:'Spray or drinking water at day 1. Used instead of coccidiostats. Hipra, Spain.' },

  // ── SECTION 2: POULTRY VACCINES — NOBILIS / MSD ──────────────────────────
  { id:'ER-NV01', section:'Poultry Vaccines — Nobilis/MSD', sectionColor:CE.indigo, priority:'★★★',
    name:"NOBILIS® RISMAVAC+CA126 — Marek's Disease Vaccine",
    spec:"Live CVI-988 (Serotype 1) + Live Turkey Herpesvirus FC-126 (Serotype 3)  |  Parenteral",
    indication:"Marek's Disease — day-old chick vaccination (bivalent protection)",
    unit:'vials', note:'SC injection at hatch. Requires liquid nitrogen storage. MSD/Intervet, Netherlands.' },

  { id:'ER-NV02', section:'Poultry Vaccines — Nobilis/MSD', sectionColor:CE.indigo, priority:'★★★',
    name:'NOBILIS® GUMBORO D78 — Gumboro Vaccine',
    spec:'Live attenuated IBD virus strain D78  |  ≥4.0 Log₁₀ TCID₅₀  |  Oral liquid',
    indication:'Infectious Bursal Disease (Gumboro) — mild/intermediate strain D78',
    unit:'vials', note:'Via drinking water. Day 14–18. MSD/Intervet, Netherlands.' },

  { id:'ER-NV03', section:'Poultry Vaccines — Nobilis/MSD', sectionColor:CE.indigo, priority:'★★★',
    name:'NOBILIS GUMBORO 228E — Gumboro Vaccine',
    spec:'Live IBD virus strain 228E  |  ≥2.0 Log₁₀ EID₅₀/dose  |  Oral liquid',
    indication:'Infectious Bursal Disease — intermediate plus strain 228E (high MDA challenge)',
    unit:'vials', note:'Via drinking water or ocular. MSD/Intervet, Netherlands.' },

  { id:'ER-NV04', section:'Poultry Vaccines — Nobilis/MSD', sectionColor:CE.indigo, priority:'★★★',
    name:'NOBILIS® IB MA5 — Infectious Bronchitis Vaccine',
    spec:'Live IB virus strain MA5 (Massachusetts serotype)  |  ≥10³·⁰ EID₅₀  |  Oral/spray',
    indication:'Infectious Bronchitis — primary Massachusetts vaccination',
    unit:'vials', note:'Via drinking water, spray or eye-drop. MSD/Intervet, Netherlands.' },

  { id:'ER-NV05', section:'Poultry Vaccines — Nobilis/MSD', sectionColor:CE.indigo, priority:'★★',
    name:'NOBILIS® IB 4-91 — Infectious Bronchitis Vaccine',
    spec:'Live attenuated IB virus strain 4-91  |  ≥Log₁₀ 3.6 EID₅₀/dose  |  Oral liquid',
    indication:'Infectious Bronchitis — 4-91 (variant/793B) serotype protection',
    unit:'vials', note:'Via drinking water or spray. Booster at 4–6 weeks. MSD/Intervet, Netherlands.' },

  { id:'ER-NV06', section:'Poultry Vaccines — Nobilis/MSD', sectionColor:CE.indigo, priority:'★★★',
    name:'NOBILIS MA5+CLONE 30 — IB + Newcastle Combo',
    spec:'Live IB MA5 ≥3.0 Log₁₀ EID₅₀ + Live Newcastle Clone 30 ≥6.0 Log₁₀ EID₅₀  |  Oral',
    indication:'Infectious Bronchitis + Newcastle Disease — dual live vaccine',
    unit:'vials', note:'Via drinking water or spray. Day 1 chicks. MSD/Intervet, Netherlands.' },

  { id:'ER-NV07', section:'Poultry Vaccines — Nobilis/MSD', sectionColor:CE.indigo, priority:'★★',
    name:'NOBILIS SG 9R — Fowl Typhoid Vaccine',
    spec:'Live Salmonella Gallinarum strain 9R  |  2×10⁷–2×10⁸ CFU/dose  |  Parenteral',
    indication:"Fowl Typhoid (Salmonella Gallinarum) — layers & breeders",
    unit:'vials', note:'SC injection. 2 doses. MSD/Intervet, Netherlands.' },

  // ── SECTION 3: LIVESTOCK VACCINES & ECF ──────────────────────────────────
  { id:'ER-LV01', section:'Livestock Vaccines & ECF Treatment', sectionColor:CE.teal, priority:'★★★',
    name:'BUTALEX — Buparvaquone 5% (ECF Treatment)',
    spec:'Buparvaquone 50mg/ml  |  Injectable',
    indication:'East Coast Fever (Theileria parva), Tropical Theileriosis — cattle',
    unit:'vials', note:'IM injection at 2.5 mg/kg. Norbrook Kenya. Use early in ECF.' },

  { id:'ER-LV02', section:'Livestock Vaccines & ECF Treatment', sectionColor:CE.teal, priority:'★★★',
    name:'PARVAQUONE + FRUSEMIDE Injection',
    spec:'Parvaquone 150mg + Frusemide 55mg/ml  |  Injectable',
    indication:'East Coast Fever + pulmonary oedema management — cattle',
    unit:'vials', note:'IM injection. Frusemide reduces lung fluid in severe ECF. Combine with antibiotic.' },

  { id:'ER-LV03', section:'Livestock Vaccines & ECF Treatment', sectionColor:CE.teal, priority:'★★★',
    name:'STARTVAC — Mastitis Vaccine (E. coli + Staph aureus)',
    spec:'Inactivated E. coli J5 + S. aureus CP8 SP140  |  50RED60+50RED80/dose  |  Oil emulsion',
    indication:'Coliform mastitis + Staphylococcal mastitis prevention — dairy cattle',
    unit:'vials', note:'SC injection. Hipra, Spain. Primary: 3 doses; then annual booster.' },

  { id:'ER-LV04', section:'Livestock Vaccines & ECF Treatment', sectionColor:CE.teal, priority:'★★',
    name:'ESTRUMATE — Cloprostenol Sodium (Prostaglandin)',
    spec:'Cloprostenol sodium 0.263mg/ml  |  Injectable',
    indication:'Oestrus synchronisation, luteolysis, retained foetal membranes, pyometra — cattle',
    unit:'vials', note:'IM injection. 2ml/dose. VetPharma, Germany. Use under veterinary supervision.' },

  // ── SECTION 4: ANTIBIOTICS & ANTIMICROBIALS ───────────────────────────────
  { id:'ER-AB01', section:'Antibiotics & Antimicrobials', sectionColor:CE.maroon, priority:'★★★',
    name:'ENROFLOXACIN 200mg/ml — Injectable',
    spec:'Enrofloxacin 200mg/ml  |  Injectable oral liquid',
    indication:'CRD, E. coli, Salmonella, respiratory infections — poultry, cattle, pigs',
    unit:'bottles', note:'IM injection or oral. VMD NV, Belgium. Restricted in laying hens.' },

  { id:'ER-AB02', section:'Antibiotics & Antimicrobials', sectionColor:CE.maroon, priority:'★★★',
    name:'SEQUENRO ORAL — Enrofloxacin 10%',
    spec:'Enrofloxacin 100mg/ml  |  Oral solution',
    indication:'Respiratory & enteric infections — poultry, cattle, pigs',
    unit:'bottles', note:'Mix in drinking water. Alivira Animal Health, India.' },

  { id:'ER-AB03', section:'Antibiotics & Antimicrobials', sectionColor:CE.maroon, priority:'★★★',
    name:'OXYTET-20% — Oxytetracycline LA',
    spec:'Oxytetracycline HCl 200mg/ml  |  Long-acting injectable',
    indication:'Respiratory infections, pneumonia, foot rot, CBPP — cattle, sheep, goats, poultry',
    unit:'bottles', note:'IM injection. 72h action. Hebei Yuanzheng, China.' },

  { id:'ER-AB04', section:'Antibiotics & Antimicrobials', sectionColor:CE.maroon, priority:'★★',
    name:'OXYTET-10% — Oxytetracycline',
    spec:'Oxytetracycline HCl 100mg/ml  |  Injectable',
    indication:'Bacterial infections — poultry, cattle, pigs',
    unit:'bottles', note:'IM injection. Standard strength. Hebei Yuanzheng, China.' },

  { id:'ER-AB05', section:'Antibiotics & Antimicrobials', sectionColor:CE.maroon, priority:'★★',
    name:'OXYTET-30% — Oxytetracycline (High Strength)',
    spec:'Oxytetracycline HCl 300mg/ml  |  Injectable',
    indication:'Bacterial infections — large animals (reduced injection volume)',
    unit:'bottles', note:'IM injection. High concentration — smaller injection volume. Hebei Yuanzheng, China.' },

  { id:'ER-AB06', section:'Antibiotics & Antimicrobials', sectionColor:CE.maroon, priority:'★★★',
    name:'DOXYVETO-CITRIX 500mg/g — Doxycycline',
    spec:'Doxycycline hyclate 500mg/g  |  Soluble powder',
    indication:'Respiratory & enteric infections, Mycoplasmosis, CRD — poultry & cattle',
    unit:'sachets', note:'Mix in drinking water. Biové, France / VMD Belgium.' },

  { id:'ER-AB07', section:'Antibiotics & Antimicrobials', sectionColor:CE.maroon, priority:'★★',
    name:'DOXYVET-50S — Doxycycline 500mg/g',
    spec:'Doxycycline HCl 500mg/g  |  Oral soluble powder',
    indication:'Respiratory infections — poultry & cattle',
    unit:'sachets', note:'Oral via drinking water. VMD NV, Belgium.' },

  { id:'ER-AB08', section:'Antibiotics & Antimicrobials', sectionColor:CE.maroon, priority:'★★★',
    name:'SELECTAN — Florfenicol 300mg/ml',
    spec:'Florfenicol 300mg/ml  |  Injectable solution',
    indication:'Bovine respiratory disease (BRD), pneumonia — cattle & pigs',
    unit:'vials', note:'IM injection. Hipra, Spain. Single-dose long-acting formulation.' },

  { id:'ER-AB09', section:'Antibiotics & Antimicrobials', sectionColor:CE.maroon, priority:'★★',
    name:'EFICUR — Ceftiofur 50mg/ml',
    spec:'Ceftiofur HCl 50mg/ml  |  Injectable suspension',
    indication:'BRD, foot rot, metritis — cattle & pigs. 3rd-gen cephalosporin.',
    unit:'vials', note:'SC injection. Hipra, Spain. No withdrawal for milk.' },

  { id:'ER-AB10', section:'Antibiotics & Antimicrobials', sectionColor:CE.maroon, priority:'★★',
    name:'GENTAMOX — Amoxycillin + Gentamicin',
    spec:'Amoxycillin + Gentamicin  |  Injectable',
    indication:'Septicaemia, respiratory & urinary tract infections — cattle, pigs, dogs',
    unit:'vials', note:'IM or SC injection. Hipra, Spain.' },

  { id:'ER-AB11', section:'Antibiotics & Antimicrobials', sectionColor:CE.maroon, priority:'★★',
    name:'LEVOFLOXACIN 10% — Oral Solution',
    spec:'Levofloxacin 100mg/ml  |  Oral liquid',
    indication:'Respiratory & enteric infections — poultry (fluoroquinolone)',
    unit:'bottles', note:'Mix in drinking water. Alivira Animal Health, India.' },

  { id:'ER-AB12', section:'Antibiotics & Antimicrobials', sectionColor:CE.maroon, priority:'★★★',
    name:'COLIVETO-4800 — Colistin Sulphate',
    spec:'Colistin sulphate 4.8 million IU/g  |  Oral powder/liquid',
    indication:'Gram-negative enteric infections, E. coli diarrhoea — poultry & pigs',
    unit:'containers', note:'Mix in feed or water. VMD NV, Belgium. Prescription only.' },

  { id:'ER-AB13', section:'Antibiotics & Antimicrobials', sectionColor:CE.maroon, priority:'★★',
    name:'DIAZIPRIM 48% — Sulphadiazine + Trimethoprim',
    spec:'Sulphadiazine 400mg + Trimethoprim 80mg  |  Oral/injectable',
    indication:'Coccidiosis, enteric infections, respiratory infections — all species',
    unit:'bottles', note:'Potentiated sulphonamide. Broad-spectrum bacteriostatic.' },

  { id:'ER-AB14', section:'Antibiotics & Antimicrobials', sectionColor:CE.maroon, priority:'★★',
    name:'DISEPTOPRIM BOLUS — Trimethoprim + Sulphadiazine',
    spec:'Multi-ingredient bolus  |  Oral bolus',
    indication:'Enteric infections, pneumonia, metritis — cattle & sheep',
    unit:'boxes', note:'1 bolus per 40kg twice daily. Cosmos Ltd, Kenya.' },

  { id:'ER-AB15', section:'Antibiotics & Antimicrobials', sectionColor:CE.maroon, priority:'★★',
    name:'S-DIME 5G BOLUS — Sulfadimidine',
    spec:'Sulfadimidine 5g  |  Oral bolus',
    indication:'Enteritis, pneumonia, metritis, foot rot, coccidiosis — cattle',
    unit:'boxes', note:'1 bolus per 25kg body weight. Norbrook.' },

  // ── SECTION 5: DEWORMERS & ANTHELMINTICS ─────────────────────────────────
  { id:'ER-DW01', section:'Dewormers & Anthelmintics', sectionColor:CE.forest, priority:'★★★',
    name:'WORMICID 1G BOLUS — Levamisole',
    spec:'Levamisole HCl 1g  |  Oral bolus',
    indication:'Intestinal strongyles, Ascarids, lungworms — cattle (up to 300kg+)',
    unit:'boxes', note:'Up to 100kg = ¾ bolus; 300kg+ = 2½ bolus. Cosmos Ltd, Kenya.' },

  { id:'ER-DW02', section:'Dewormers & Anthelmintics', sectionColor:CE.forest, priority:'★★★',
    name:'WORMICID 150 TABLETS — Levamisole',
    spec:'Levamisole HCl 150mg  |  Tablets',
    indication:'GI and lungworms — sheep, goats, pigs',
    unit:'boxes', note:'Up to 20kg = 1 tab; 21–40kg = 2 tabs. Cosmos Ltd, Kenya.' },

  { id:'ER-DW03', section:'Dewormers & Anthelmintics', sectionColor:CE.forest, priority:'★★★',
    name:'WORMICID LIQUID — Levamisole 1.5%',
    spec:'Levamisole HCl 1.5% w/v  |  Oral liquid',
    indication:'Stomach strongyles, roundworms, lungworms, eyeworms — all livestock',
    unit:'bottles', note:'1ml per 2kg oral drench. Available 125ml or 1 litre. Cosmos Ltd, Kenya.' },

  { id:'ER-DW04', section:'Dewormers & Anthelmintics', sectionColor:CE.forest, priority:'★★★',
    name:'WORMICID PLUS-O — Levamisole + Oxyclozanide',
    spec:'Levamisole HCl 1.5% + Oxyclozanide 3%  |  Oral drench + Cobalt 0.382%',
    indication:'Liver flukes, lungworms, stomach & intestinal worms, rumen flukes — cattle & sheep',
    unit:'bottles', note:'1ml per 2kg. Available 125ml or 1 litre. Combo broadspectrum. Medisel Kenya.' },

  { id:'ER-DW05', section:'Dewormers & Anthelmintics', sectionColor:CE.forest, priority:'★★★',
    name:'WORMICID PLUS-O BOLUS — Levamisole Combo',
    spec:'Multi-ingredient bolus (Levamisole + Oxyclozanide + Cobalt)  |  Oral bolus',
    indication:'Broad-spectrum worms + flukes — cattle (single-dose convenience)',
    unit:'boxes', note:'Oral bolus form of Wormicid Plus-O. Cosmos Ltd, Kenya.' },

  { id:'ER-DW06', section:'Dewormers & Anthelmintics', sectionColor:CE.forest, priority:'★★★',
    name:'WORMITA SUSPENSION — Albendazole',
    spec:'Albendazole 2.5%  |  Oral suspension',
    indication:'Roundworms, tapeworms, liver flukes — cattle, sheep, goats',
    unit:'bottles', note:'Oral drench. Do not use during first trimester of pregnancy.' },

  { id:'ER-DW07', section:'Dewormers & Anthelmintics', sectionColor:CE.forest, priority:'★★',
    name:'ASCATEN-P — Praziquantel + Pyrantel + Fenbendazole',
    spec:'Praziquantel + Pyrantel Pamoate + Fenbendazole  |  Tablet',
    indication:'Tapeworms, roundworms, hookworms — dogs & cats (broad-spectrum)',
    unit:'boxes', note:'1 tablet per 5kg. Not for unweaned animals. Cosmos Ltd, Kenya.' },

  { id:'ER-DW08', section:'Dewormers & Anthelmintics', sectionColor:CE.forest, priority:'★★',
    name:'ASCAREX WORM POWDER',
    spec:'Oral powder',
    indication:'Internal parasites — poultry & livestock',
    unit:'sachets', note:'Mix in feed or water per label dosing.' },

  // ── SECTION 6: ANTIPROTOZOALS & TRYPANOCIDES ─────────────────────────────
  { id:'ER-AP01', section:'Antiprotozoals & Trypanocides', sectionColor:CE.brown, priority:'★★★',
    name:'SEMIDIUM — Isometamidium',
    spec:'Isometamidium chloride 1000mg  |  Injectable',
    indication:'Trypanosomiasis (Nagana) — cattle. Prophylactic and curative.',
    unit:'vials', note:'IM injection. Also provides 2–3 months prophylaxis. Alivira, India.' },

  { id:'ER-AP02', section:'Antiprotozoals & Trypanocides', sectionColor:CE.brown, priority:'★★★',
    name:'SEQUZENE — Diminazene Diacetarate',
    spec:'Diminazene diacetarate  |  Injectable powder for reconstitution',
    indication:'Trypanosomiasis, Babesiosis, Anaplasmosis — cattle',
    unit:'vials', note:'IM injection. Reconstitute before use. Sequent Scientific, India.' },

  { id:'ER-AP03', section:'Antiprotozoals & Trypanocides', sectionColor:CE.brown, priority:'★★★',
    name:'SEQUZENE PLUS — Diminazene + Vitamin B12',
    spec:'Diminazene diacetarate 0.5g + Cyanocobalamin (B12) 0.01g  |  Injectable',
    indication:'Trypanosomiasis + Babesiosis with B12 support — cattle',
    unit:'vials', note:'IM injection. B12 supports recovery post-trypanosomiasis. Alivira, India.' },

  { id:'ER-AP04', section:'Antiprotozoals & Trypanocides', sectionColor:CE.brown, priority:'★★',
    name:'IMIDOCARB — Imidocarb Dipropionate 12%',
    spec:'Imidocarb dipropionate 12% w/v  |  Parenteral injection',
    indication:'Babesiosis (Redwater), Anaplasmosis — cattle & dogs',
    unit:'vials', note:'SC injection. Slow absorption. Atropine antidote if toxicity occurs.' },

  // ── SECTION 7: ACARICIDES & EXTERNAL PARASITES ───────────────────────────
  { id:'ER-AC01', section:'Acaricides & External Parasites', sectionColor:CE.olive, priority:'★★★',
    name:'TAKTIC — Amitraz 12.5%',
    spec:'Amitraz 125g/L  |  Liquid concentrate for dipping/spraying',
    indication:'Ticks (all species), mange mites, lice — cattle, sheep, goats',
    unit:'bottles', note:'Dilute before dipping or spraying. Avoid contact with eyes. Elanco.' },

  { id:'ER-AC02', section:'Acaricides & External Parasites', sectionColor:CE.olive, priority:'★★',
    name:'SUPONA EXTRA — Chlorphenvinphos',
    spec:'Chlorphenvinphos 1000g/L  |  EC formulation',
    indication:'Ticks, blowflies, lice, mange — cattle',
    unit:'bottles', note:'Organophosphate — dilute carefully. Withdrawal period applies.' },

  { id:'ER-AC03', section:'Acaricides & External Parasites', sectionColor:CE.olive, priority:'★★★',
    name:'IVERVETO-1 — Ivermectin 1% Injectable',
    spec:'Ivermectin 10mg/ml  |  SC injectable',
    indication:'Nematodes, lungworms, mange, lice, ticks — cattle, sheep, goats, pigs',
    unit:'vials', note:'SC injection. 1ml per 50kg body weight. VMD NV, Belgium.' },

  // ── SECTION 8: COCCIDIOSTATS ──────────────────────────────────────────────
  { id:'ER-CO01', section:'Coccidiostats', sectionColor:CE.purple, priority:'★★★',
    name:'COCCID GRANULES — Amprolium 20%',
    spec:'Amprolium hydrochloride 20% w/w  |  Oral granules',
    indication:'Coccidiosis prevention & treatment — poultry, cattle calves, rabbits',
    unit:'sachets', note:'Mix in drinking water. Treatment: 5–6 days. Medisel Kenya.' },

  { id:'ER-CO02', section:'Coccidiostats', sectionColor:CE.purple, priority:'★★★',
    name:'AMPROLIUM-20S — Amprolium 20%',
    spec:'Amprolium hydrochloride 200mg/g  |  Soluble powder',
    indication:'Coccidiosis — poultry & cattle calves',
    unit:'sachets', note:'Mix in drinking water. Prevention & therapeutic dosing per label.' },

  // ── SECTION 9: VITAMINS, SUPPLEMENTS & RECOVERY ──────────────────────────
  { id:'ER-VS01', section:'Vitamins, Supplements & Recovery', sectionColor:CE.teal, priority:'★★★',
    name:'POLTRICIN CHICK FORMULA',
    spec:'Multi-vitamin + electrolyte + amino acid complex  |  Oral powder sachets (25g)',
    indication:'Chick health, vaccination support, stress recovery — broilers & layers (0–6 weeks)',
    unit:'sachets', note:'Mix in drinking water. Cosmos Ltd, Kenya. Use during vaccination and stress periods.' },

  { id:'ER-VS02', section:'Vitamins, Supplements & Recovery', sectionColor:CE.teal, priority:'★★★',
    name:'POLTRICIN MAYAI FORMULA',
    spec:'Multi-vitamin + mineral + amino acid complex  |  Oral powder sachets (25g)',
    indication:'Egg production support, peak lay performance — layer hens',
    unit:'sachets', note:'Mix in drinking water. Cosmos Ltd, Kenya. Use during production cycle.' },

  { id:'ER-VS03', section:'Vitamins, Supplements & Recovery', sectionColor:CE.teal, priority:'★★',
    name:'COSVITA — Multivitamin Injection',
    spec:'Multivitamin complex (A, D, E, B-complex + Oxytetracycline support)  |  Parenteral',
    indication:'Vitamin deficiency, post-disease recovery, stress — all livestock & poultry',
    unit:'vials', note:'IM or SC injection. Combined vitamin + supportive antibiotic action.' },

];

export function makeEramSupplier() {
  return {
    name: 'Eram Uganda Ltd',
    contactEmail: 'orders@eram.ug',
    contactPerson: 'Sales Team',
    phone: '+256-414-235628',
    mobilePhone: '+256 701 234567',
    location: 'Kampala, Uganda',
    address: 'ERAM House, Plot 3 Hoima Road, Bakuli, P.O. Box 11304, Kampala',
    web: 'erampharmacueticals.com',
    paymentTerms: 'Net 30',
    minimumOrderQuantity: 3,
    leadTimeDays: 5,
    notes: "Uganda's #1 animal health provider. Est. 1996. NDA-licensed distributor. Principal brands: HIPRA (Spain), Nobilis/MSD (Netherlands), VMD (Belgium), Cosmos (Kenya). Also handles crop protection chemicals.",
    catalogue: ERAM_CATALOGUE,
  };
}

export const GLOBAL_VET_CATALOGUE = [
  // ── SECTION 1: VACCINES ──
  { id:'VAC-01', section:'Poultry Vaccines', sectionColor:C.navy, priority:'★★★',
    name:'BIO-VAC LA SOTA — Newcastle Disease Live Vaccine',
    spec:'1,000 doses/vial  |  Freeze-dried live attenuated',
    indication:'Newcastle Disease (NCD) — #1 killer of village & commercial poultry',
    unit:'vials', note:'Via drinking water or eye-drop. Store -15°C to -4°C.' },

  { id:'VAC-02', section:'Poultry Vaccines', sectionColor:C.navy, priority:'★★★',
    name:'OL-VAC — Inactivated Newcastle Disease Vaccine',
    spec:'1,000 doses  |  Injectable inactivated',
    indication:'Newcastle Disease — booster or inactivated option',
    unit:'vials', note:'IM or SC injection.' },

  { id:'VAC-03', section:'Poultry Vaccines', sectionColor:C.navy, priority:'★★★',
    name:'BIO-VAC ND-IB — Newcastle Disease + Infectious Bronchitis',
    spec:'1,000 doses/vial  |  Freeze-dried live combination',
    indication:'Newcastle Disease + Infectious Bronchitis',
    unit:'vials', note:'Via drinking water. Broilers week 2–3.' },

  { id:'VAC-04', section:'Poultry Vaccines', sectionColor:C.navy, priority:'★★★',
    name:'IBA-VAC ST — Gumboro (IBD) 1st Vaccination',
    spec:'1,000 doses/vial  |  Freeze-dried live',
    indication:'Gumboro / Infectious Bursal Disease — 1st dose',
    unit:'vials', note:'Via drinking water. Day 10–14.' },

  { id:'VAC-05', section:'Poultry Vaccines', sectionColor:C.navy, priority:'★★★',
    name:'IBA-VAC — Gumboro (IBD) 2nd Vaccination',
    spec:'1,000 doses/vial  |  Freeze-dried live',
    indication:'Gumboro / Infectious Bursal Disease — booster',
    unit:'vials', note:'Via drinking water. Day 21–24.' },

  { id:'VAC-06', section:'Poultry Vaccines', sectionColor:C.navy, priority:'★★★',
    name:"BIO-MAREK HVT — Marek's Disease Vaccine",
    spec:"1,000 doses/vial  |  Include diluent when ordering",
    indication:"Marek's Disease — tumours, paralysis, high mortality in layers",
    unit:'vials', note:'SC injection, day-old chicks only. Full cold chain.' },

  { id:'VAC-07', section:'Poultry Vaccines', sectionColor:C.navy, priority:'★★',
    name:'BI-VAC 1° — Infectious Bronchitis 1st Vaccination',
    spec:'1,000 doses/vial  |  Freeze-dried live',
    indication:'Infectious Bronchitis (IB) — week 1',
    unit:'vials', note:'Via drinking water.' },

  { id:'VAC-08', section:'Poultry Vaccines', sectionColor:C.navy, priority:'★★',
    name:'BI-VAC 2° — Infectious Bronchitis 2nd Vaccination',
    spec:'1,000 doses/vial  |  Freeze-dried live',
    indication:'Infectious Bronchitis (IB) — booster week 4–5',
    unit:'vials', note:'Via drinking water.' },

  { id:'VAC-09', section:'Poultry Vaccines', sectionColor:C.navy, priority:'★★',
    name:'VAIOL-VAC — Fowl Pox Vaccine',
    spec:'1,000 doses/vial  |  Freeze-dried live',
    indication:'Fowl Pox — tropical & humid environments',
    unit:'vials', note:'Wing-web stab. Week 6–8.' },

  { id:'VAC-10', section:'Poultry Vaccines', sectionColor:C.navy, priority:'★★',
    name:'SET-VAC — Fowl Typhoid Vaccine',
    spec:'500 or 1,000 doses  |  State size',
    indication:'Fowl Typhoid (Salmonella gallinarum)',
    unit:'vials', note:'Drinking water or injection.' },

  // ── SECTION 2: RESPIRATORY ──
  { id:'RES-01', section:'Respiratory Treatments', sectionColor:C.teal, priority:'★★★',
    name:'Erythrate 20% — Erythromycin Thiocyanate 20%',
    spec:'100g sachet  |  Water soluble powder',
    indication:'Chronic Respiratory Disease (CRD) — Mycoplasma gallisepticum',
    unit:'sachets', note:'30g in 20L water for 5 days.' },

  { id:'RES-02', section:'Respiratory Treatments', sectionColor:C.teal, priority:'★★★',
    name:'Erythrate 35% — Erythromycin Thiocyanate 35%',
    spec:'100g sachet  |  Higher concentration',
    indication:'CRD / Mycoplasmosis — severe outbreaks',
    unit:'sachets', note:'20g in 20L water for 5 days.' },

  { id:'RES-03', section:'Respiratory Treatments', sectionColor:C.teal, priority:'★★★',
    name:'Doxy Tylovet Plus — Doxycycline 200mg + Tylosin 100mg',
    spec:'1kg bag  |  Water soluble powder',
    indication:'CRD, Mycoplasma, E.coli, Bordetella, Haemophilus, Salmonella',
    unit:'kg bags', note:'1kg per 2,000–4,000L water for 3–5 days.' },

  { id:'RES-04', section:'Respiratory Treatments', sectionColor:C.teal, priority:'★★',
    name:'Doxyvet 500 — Doxycycline Hyclate 500mg',
    spec:'100g sachet  |  Water soluble',
    indication:'Mycoplasma gallisepticum / Respiratory infections',
    unit:'sachets', note:'40g in 20L water for 1–7 days.' },

  { id:'RES-05', section:'Respiratory Treatments', sectionColor:C.teal, priority:'★★★',
    name:'Enrocure Solution — Enrofloxacin',
    spec:'100ml / 500ml / 1 Litre  |  State size',
    indication:'Respiratory, enteric & urinary — broad-spectrum fluoroquinolone',
    unit:'bottles', note:'20ml in 20L water for 3–5 days.' },

  { id:'RES-06', section:'Respiratory Treatments', sectionColor:C.teal, priority:'★★',
    name:'Enrotrill Solution — Enrofloxacin 200mg',
    spec:'Bottle  |  Higher concentration',
    indication:'Respiratory, enteric & urinary',
    unit:'bottles', note:'5ml in 20L water for 3–5 days.' },

  { id:'RES-07', section:'Respiratory Treatments', sectionColor:C.teal, priority:'★★',
    name:'Gen Tylo — Gentamicin Sulphate + Tylosin Tartrate',
    spec:'100g sachet  |  Water soluble powder',
    indication:'Respiratory, enteric & urinary bacterial infections',
    unit:'sachets', note:'20g in 20L water for 5 days.' },

  { id:'RES-08', section:'Respiratory Treatments', sectionColor:C.teal, priority:'★★★',
    name:'Oxytetravet 25% — Oxytetracycline 25%',
    spec:'100g or 500g  |  State size',
    indication:'Septicaemia, respiratory, urinary, enteric. Pullorum, Fowl Cholera, E.coli.',
    unit:'packs', note:'10g in 20L water for 5 days.' },

  { id:'RES-09', section:'Respiratory Treatments', sectionColor:C.teal, priority:'★★',
    name:'Oxytetravet 50% — Oxytetracycline Hydrochloride 50%',
    spec:'Water soluble powder',
    indication:'Septicaemia, respiratory & GI bacterial infections',
    unit:'packs', note:'10g in 20L water for 5 days.' },

  { id:'RES-10', section:'Respiratory Treatments', sectionColor:C.teal, priority:'★★★',
    name:'Oxy Plus — Oxytetracycline + Neomycin + Vitamins A & K',
    spec:'400g pack  |  Water soluble combination',
    indication:'Respiratory + intestinal. Pullorum, Fowl Cholera, Typhoid, E.coli, Salmonella.',
    unit:'packs', note:'400g in 100L water for 5 days.' },

  // ── SECTION 3: COCCIDIOSIS ──
  { id:'COC-01', section:'Coccidiosis', sectionColor:C.maroon, priority:'★★★',
    name:'Amprocidia 60% — Amprolium Hydrochloride 60%',
    spec:'100g sachet  |  Water soluble',
    indication:'Coccidiosis prevention & treatment — broilers weeks 2–5',
    unit:'sachets', note:'10g in 20L water for 5 consecutive days.' },

  { id:'COC-02', section:'Coccidiosis', sectionColor:C.maroon, priority:'★★★',
    name:'Coccid Soluble Powder — Amprolium Hydrochloride 20%',
    spec:'Box of 10 sachets × 30g',
    indication:'Coccidiosis in poultry, calves, lambs, kids',
    unit:'boxes', note:'Severe: 1 tsp per 5L for 5–7 days.' },

  { id:'COC-03', section:'Coccidiosis', sectionColor:C.maroon, priority:'★★',
    name:'Anticox — Diclazuril Anticoccidial Solution',
    spec:'Bottle  |  Liquid',
    indication:'Coccidiosis — Diclazuril. Rotate with Amprolium.',
    unit:'bottles', note:'20ml in 20L water for 3 days.' },

  { id:'COC-04', section:'Coccidiosis', sectionColor:C.maroon, priority:'★★',
    name:'Primovet — Sulphadiazine-Na + Trimethoprim',
    spec:'Water soluble powder',
    indication:'Respiratory & GI diseases — E.coli, Pasteurella, Salmonella, Coccidiosis',
    unit:'sachets', note:'10g in 20L water for 5 days.' },

  { id:'COC-05', section:'Coccidiosis', sectionColor:C.maroon, priority:'★★★',
    name:'S-Dime Solution — Sodium Sulfadimidine 16%',
    spec:'125ml or 1 Litre  |  State size',
    indication:'Coccidiosis, Coryza, Fowl Cholera, Fowl Typhoid, Pullorum',
    unit:'bottles', note:'40ml in 5L water for 3–5 days.' },

  // ── SECTION 4: VITAMINS ──
  { id:'VIT-01', section:'Vitamins & Immunity', sectionColor:C.olive, priority:'★★★',
    name:'Multi-Aminovet — Water Soluble Multivitamin + Amino Acids',
    spec:'100g sachet  |  Water soluble powder',
    indication:'Growth, immunity, FCR, egg production, stress relief',
    unit:'sachets', note:'10g (1 tbsp) in 20L water for 3–5 days.' },

  { id:'VIT-02', section:'Vitamins & Immunity', sectionColor:C.olive, priority:'★★★',
    name:'Aminovet Solution — Liquid Multivitamin',
    spec:'1 Litre  |  Liquid',
    indication:'Growth, immunity, FCR & egg production',
    unit:'litres', note:'5ml in 20L water.' },

  { id:'VIT-03', section:'Vitamins & Immunity', sectionColor:C.olive, priority:'★★',
    name:'Cosvita WS — Water Soluble Multivitamin Complex',
    spec:'30g sachet',
    indication:'Vitamin supplementation, retarded growth, convalescence',
    unit:'sachets', note:'1 sachet (30g) in 20L water for 5–7 days.' },

  { id:'VIT-04', section:'Vitamins & Immunity', sectionColor:C.olive, priority:'★★★',
    name:'Poltricin Chick Formula',
    spec:'Box of 5 × 25g sachets',
    indication:'Chick starter — growth, CRD prevention, GI disease, stress',
    unit:'boxes', note:'1 tbsp in 5L water for 7 days.' },

  { id:'VIT-05', section:'Vitamins & Immunity', sectionColor:C.olive, priority:'★★',
    name:'Poltricin Mayai Formula',
    spec:'Box of 5 × 25g sachets',
    indication:'Layer production — peak production, egg quality, FCR',
    unit:'boxes', note:'1 heaped tsp in 10L water at point of lay for 7 days.' },

  // ── SECTION 5: DEWORMERS ──
  { id:'DEW-01', section:'Poultry Dewormers', sectionColor:C.burnt, priority:'★★★',
    name:'Ascarex D Worm Powder — Piperazine Dihydrochloride',
    spec:'Box of 10 sachets × 30g  |  Water soluble',
    indication:'Roundworms (Ascaridiasis) in free-range & semi-intensive flocks',
    unit:'boxes', note:'30g in 20–30L per 100 birds. 1-day treatment only.' },

  { id:'DEW-02', section:'Poultry Dewormers', sectionColor:C.burnt, priority:'★★★',
    name:'Piperamentic — Piperazine as Citrate',
    spec:'100g or 500g  |  State size',
    indication:'Ascaridiasis & roundworms in poultry & large animals',
    unit:'packs', note:'Poultry: 40g in 20L for 1 day ONLY.' },

  // ── SECTION 6: DISINFECTANTS ──
  { id:'DIS-01', section:'Disinfectants & Wound Care', sectionColor:C.purple, priority:'★★',
    name:'Oytetravet Aerosol — Oxytetracycline + Purple Dye Spray',
    spec:'Aerosol can',
    indication:'Wound treatment & fly repellent — debeaking, cannibalism wounds',
    unit:'cans', note:'Spray directly on wound.' },

  { id:'DIS-02', section:'Disinfectants & Wound Care', sectionColor:C.purple, priority:'★★★',
    name:'Disinfectant — Advise equivalent to Norocleanse',
    spec:'1 Litre / 5 Litre  |  State brand & size',
    indication:'Poultry house disinfection, biosecurity between flocks',
    unit:'litres', note:'Confirm preferred product, dilution rate & cost.' },

  // ── SECTION 7: CANINE VACCINES ──
  { id:'CAN-01', section:'Canine Vaccines', sectionColor:C.indigo, priority:'★★★',
    name:'CANVAC R — Rabies Vaccine',
    spec:'Single dose vials',
    indication:'Rabies prevention in dogs — zoonotic, mandatory',
    unit:'vials', note:'Annual booster required.' },

  { id:'CAN-02', section:'Canine Vaccines', sectionColor:C.indigo, priority:'★★',
    name:'CANVAC P — Parvovirosis Vaccine',
    spec:'Single dose vials',
    indication:'Canine Parvovirus — highly contagious, often fatal',
    unit:'vials', note:'Puppy series: 6, 9, 12 weeks. Annual booster.' },

  { id:'CAN-03', section:'Canine Vaccines', sectionColor:C.indigo, priority:'★★',
    name:'CANVAC 8 DHPPiL — 8-in-1 Vaccine',
    spec:'Vials',
    indication:'8 killer diseases of canines — Distemper, Hepatitis, Parvovirus, etc.',
    unit:'vials', note:'Annual vaccination.' },

  // ── SECTION 8: LARGE ANIMAL INJECTABLES ──
  { id:'LAD-01', section:'Large Animal Injectables', sectionColor:C.brown, priority:'★★★',
    name:'Oxytetravet 10% Inj — Oxytetracycline HCl',
    spec:'Vial  |  Injectable',
    indication:'Bacterial infections in horses, cattle, goats, sheep & pigs',
    unit:'vials', note:'1ml per 10kg body weight.' },

  { id:'LAD-02', section:'Large Animal Injectables', sectionColor:C.brown, priority:'★★★',
    name:'Oxytetravet 20% LA Inj — Long-Acting Oxytetracycline',
    spec:'Vial  |  Long-acting injectable',
    indication:'Respiratory, navel/joint ill, mastitis, septicaemia in cattle/sheep/goats',
    unit:'vials', note:'IM injection only.' },

  { id:'LAD-03', section:'Large Animal Injectables', sectionColor:C.brown, priority:'★★',
    name:'Oxytetravet 30% Inj LA — Oxytetracycline Dihydrate',
    spec:'Vial  |  Prolonged action',
    indication:'Pasteurellosis, pneumonia, pink eye, mastitis, enzootic abortion',
    unit:'vials', note:'Prolonged sustained activity.' },

  { id:'LAD-04', section:'Large Animal Injectables', sectionColor:C.brown, priority:'★★',
    name:'Gentavet Inj — Gentamicin Sulphate 50mg',
    spec:'Vial  |  Injectable',
    indication:'Urinary, respiratory & reproductive tract infections',
    unit:'vials', note:'1ml per 10kg twice daily day 1, then once daily 3–4 days.' },

  { id:'LAD-05', section:'Large Animal Injectables', sectionColor:C.brown, priority:'★★',
    name:'GENTAVET 10% — Gentamicin Sulphate 100mg',
    spec:'100ml  |  Injectable',
    indication:'GI nematodes, liver flukes, warbles, mites & lice in beef cattle',
    unit:'bottles', note:'1ml per 50kg body weight.' },

  { id:'LAD-06', section:'Large Animal Injectables', sectionColor:C.brown, priority:'★★',
    name:'Tylorate Inj — Tylosin Tartrate 200mg',
    spec:'Vial  |  Injectable',
    indication:'Respiratory — CBPP/CCPP caused by Mycoplasma in cattle',
    unit:'vials', note:'Confirm dose rate with supplier.' },

  { id:'LAD-07', section:'Large Animal Injectables', sectionColor:C.brown, priority:'★★',
    name:'Multivitamin Inj — Injectable Multivitamin',
    spec:'Vial  |  Injectable',
    indication:'Vitamin deficiencies — FCR, metabolism, growth, fertility',
    unit:'vials', note:'State dose rate.' },

  { id:'LAD-08', section:'Large Animal Injectables', sectionColor:C.brown, priority:'★★★',
    name:'Butex Inj — Buparvaquone Injectable',
    spec:'Vial  |  Injectable',
    indication:'Theileriosis (East Coast Fever, Corridor Disease) in cattle',
    unit:'vials', note:'1ml per 20kg. Critical for Northern Uganda cattle.' },

  { id:'LAD-09', section:'Large Animal Injectables', sectionColor:C.brown, priority:'★★',
    name:'Hexavet LA — Anti-inflammatory + Antibiotic Injectable',
    spec:'Vial  |  Long-acting',
    indication:'Bacterial pneumonia requiring anti-inflammatory effects',
    unit:'vials', note:'IM only at 1ml per 10kg.' },

  { id:'LAD-10', section:'Large Animal Injectables', sectionColor:C.brown, priority:'★★',
    name:'Dexaroide — Dexamethasone Na-Phosphate',
    spec:'Vial  |  Injectable',
    indication:'Ketosis, shock, allergies, inflammatory conditions',
    unit:'vials', note:'1ml per 25kg. Contraindicated in pregnant animals.' },

  { id:'LAD-11', section:'Large Animal Injectables', sectionColor:C.brown, priority:'★★',
    name:'Imicarb — Imicarb Dipropionate',
    spec:'Vial  |  Injectable',
    indication:'Babesiosis (cattle, horses, dogs), Anaplasmosis, Canine Ehrlichiosis',
    unit:'vials', note:'Confirm dose rate.' },

  { id:'LAD-12', section:'Large Animal Injectables', sectionColor:C.brown, priority:'★',
    name:'VITBLOCK — Mineral Lick Block',
    spec:'Block',
    indication:'Mineral & vitamin deficiency in domestic animals',
    unit:'blocks', note:'Free-access supplementation.' },

  // ── SECTION 9: LARGE ANIMAL DEWORMERS ──
  { id:'DEL-01', section:'Large Animal Dewormers', sectionColor:C.forest, priority:'★★★',
    name:'ALBEVET 10% — Albendazole 10% Oral Suspension',
    spec:'Bottle  |  Oral suspension',
    indication:'Nematodes, flukes & tapeworms in domestic animals',
    unit:'bottles', note:'State dose rate and species.' },

  { id:'DEL-02', section:'Large Animal Dewormers', sectionColor:C.forest, priority:'★★★',
    name:'ALBEMEC — Albendazole 50mg + Ivermectin 10mg/ml',
    spec:'Bottle  |  Oral suspension',
    indication:'Flukes, roundworms, tapeworms & ectoparasites — cattle, sheep, goats',
    unit:'bottles', note:'Broadest spectrum combined antiparasitic.' },

  { id:'DEL-03', section:'Large Animal Dewormers', sectionColor:C.forest, priority:'★★★',
    name:'TECTIN — Ivermectin 1% Injectable',
    spec:'50ml or 100ml  |  State size',
    indication:'Helminthosis, mange & ectoparasites in cattle & shoats',
    unit:'bottles', note:'1ml per 50kg SC.' },

  { id:'DEL-04', section:'Large Animal Dewormers', sectionColor:C.forest, priority:'★★',
    name:'TECTIN SUPER — Ivermectin + Clorsulon',
    spec:'50ml or 100ml  |  State size',
    indication:'GI nematodes, liver flukes, warbles, mites & lice',
    unit:'bottles', note:'1ml per 50kg. Broader than TECTIN.' },

  { id:'DEL-05', section:'Large Animal Dewormers', sectionColor:C.forest, priority:'★★',
    name:'IVOSAN — Ivermectin + Closantel',
    spec:'Bottle  |  Injectable or oral',
    indication:'Roundworm & fluke infestation in cattle & shoats',
    unit:'bottles', note:'1ml per 25kg.' },

  { id:'DEL-06', section:'Large Animal Dewormers', sectionColor:C.forest, priority:'★★',
    name:'Wormicid 1g — Levamisole HCl 1g Bolus',
    spec:'Box of 30 boluses',
    indication:'Intestinal strongyles, Ascarides & lungworms in cattle',
    unit:'boxes', note:'Up to 100kg = ¾ bolus; 300kg+ = 2½ bolus.' },

  { id:'DEL-07', section:'Large Animal Dewormers', sectionColor:C.forest, priority:'★★',
    name:'Wormicid 150 — Levamisole HCl 150mg Tablet',
    spec:'Box of 100 tablets',
    indication:'GI & lungworms in sheep, goats & pigs',
    unit:'boxes', note:'Up to 20kg = 1 tab; 21–40kg = 2 tabs.' },

  { id:'DEL-08', section:'Large Animal Dewormers', sectionColor:C.forest, priority:'★★',
    name:'Wormicid Liquid — Levamisole HCl 1.5% w/v',
    spec:'125ml or 1 Litre  |  State size',
    indication:'Stomach strongyles, roundworms, lungworms, eye worms',
    unit:'bottles', note:'1ml per 2kg oral drench.' },

  { id:'DEL-09', section:'Large Animal Dewormers', sectionColor:C.forest, priority:'★★★',
    name:'WORMICID PLUS-O — Levamisole + Oxyclozanide + Cobalt',
    spec:'125ml or 1 Litre  |  State size',
    indication:'Liver flukes, lungworms, stomach & intestinal worms, rumen flukes',
    unit:'bottles', note:'1ml per 2kg oral drench.' },

  { id:'DEL-10', section:'Large Animal Dewormers', sectionColor:C.forest, priority:'★★',
    name:'Wormita Suspension — Albendazole 2.5%',
    spec:'125ml  |  Oral suspension',
    indication:'Roundworms, tapeworms & liverflukes in cattle/sheep/goats',
    unit:'bottles', note:'Oral drench.' },

  { id:'DEL-11', section:'Large Animal Dewormers', sectionColor:C.forest, priority:'★★',
    name:'S-Dime Bolus — Sulfadimidine 5g',
    spec:'Box of 10 boluses',
    indication:'Enteritis, pneumonia, metritis, foot rot, coccidiosis',
    unit:'boxes', note:'1 bolus per 25kg.' },

  { id:'DEL-12', section:'Large Animal Dewormers', sectionColor:C.forest, priority:'★★',
    name:'Diseptoprim Bolus — Trimethoprim 200mg + Sulfadiazine 1g',
    spec:'Box of 40 boluses',
    indication:'Bacterial scours, salmonellosis, pneumonia, post-parturient metritis',
    unit:'boxes', note:'1 bolus per 40kg twice daily.' },

  // ── SECTION 10: PET ──
  { id:'PET-01', section:'Pet & Companion Animal', sectionColor:C.indigo, priority:'★★',
    name:'Petdog Ascaten-P — Mebendazole + Piperazine + Praziquantel',
    spec:'Box of 10 × 6 tablets',
    indication:'Broad-spectrum dewormer for dogs & cats',
    unit:'boxes', note:'1 tablet per 5kg. Not for unweaned puppies.' },

  // ── SECTION 11: EQUIPMENT ──
  { id:'EQP-01', section:'Equipment & Supplies', sectionColor:C.slate, priority:'★★★',
    name:'HSW ECO-MATIC Automatic Syringe',
    spec:'0.3ml / 1ml / 2ml / 5ml  |  State sizes',
    indication:'Vaccine & drug injection — Marek\'s, OL-VAC, large animal',
    unit:'units', note:'State sizes. One per paravet kit.' },

  { id:'EQP-02', section:'Equipment & Supplies', sectionColor:C.slate, priority:'★★',
    name:'HSW ROUX-REVOLVER Automatic Syringe',
    spec:'10ml / 30ml / 50ml  |  State sizes',
    indication:'Large-volume drug & vaccine administration',
    unit:'units', note:'State sizes.' },

  { id:'EQP-03', section:'Equipment & Supplies', sectionColor:C.slate, priority:'★★',
    name:'HSW MULTI-MATIC Automatic Syringe',
    spec:'25ml or 50ml  |  State size',
    indication:'High-volume vaccination campaigns',
    unit:'units', note:'State size.' },

  { id:'EQP-04', section:'Equipment & Supplies', sectionColor:C.slate, priority:'★★',
    name:'HSW ECO-MATIC Automatic Drencher',
    spec:'30ml',
    indication:'Oral deworming/drenching — poultry & small animals',
    unit:'units', note:'Accurate dosing.' },

  { id:'EQP-05', section:'Equipment & Supplies', sectionColor:C.slate, priority:'★★',
    name:'EUROPLEX Automatic Drencher',
    spec:'30ml',
    indication:'Oral deworming alternative',
    unit:'units', note:'Confirm availability.' },

  { id:'EQP-06', section:'Equipment & Supplies', sectionColor:C.slate, priority:'★★★',
    name:'Leur Lock Hard Plastic Syringes',
    spec:'Assorted sizes — state volumes',
    indication:'General vaccine & drug administration',
    unit:'boxes', note:'State sizes: 1ml, 2ml, 5ml, 10ml, 20ml.' },

  { id:'EQP-07', section:'Equipment & Supplies', sectionColor:C.slate, priority:'★',
    name:'Ear Tags & Applicator',
    spec:'State colour, numbering & quantity',
    indication:'Livestock identification — cattle, goats, sheep',
    unit:'sets', note:'Specify colour, numbering range & applicator.' },
];

/** Returns a fresh default supplier record for Global Vet with catalogue attached */
export function makeGlobalVetSupplier() {
  return {
    name: 'Global Vet (U) Ltd',
    contactEmail: 'globalvet@infocom.co.ug',
    contactPerson: '',
    phone: '+256-41 4 507055',
    mobilePhone: '+256-77 6 421315',
    fax: '+256-41 4 235157',
    address: 'Plot 14/18 Nakivubo Place, Venus Plaza, Shop No.V001, P.O Box 4860 Kampala',
    web: 'www.globalvetug.com',
    paymentTerms: 'Net 30',
    minimumOrderQuantity: 1,
    leadTimeDays: 3,
    notes: 'Dealers in Veterinary Pharmaceuticals, Animal Feeds Supplements & Equipment',
    catalogue: GLOBAL_VET_CATALOGUE,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUKOOLA VET — Bukoola Chemical Industries Ltd, Kampala
// Source: bukoolavet.com (scraped May 2026). Update via Import Catalogue button.
// ═══════════════════════════════════════════════════════════════════════════════
const C2 = { teal:'1F5C6B', olive:'3B5323', maroon:'6B0F1A', brown:'4E2900', slate:'2F4F4F', indigo:'283593' };

export const BUKOOLA_VET_CATALOGUE = [
  // Antibiotics & Injectables
  { id:'BKL-AB01', section:'Antibiotics & Injectables', sectionColor:C2.maroon, priority:'★★★',
    name:'Pen-Strep Injection', spec:'Penicillin G + Streptomycin  |  Injectable suspension',
    indication:'Bacterial infections — livestock & poultry', unit:'vials', note:'IM/SC injection. Shake well before use.' },
  { id:'BKL-AB02', section:'Antibiotics & Injectables', sectionColor:C2.maroon, priority:'★★★',
    name:'Oxytetracycline 20% LA Injection', spec:'Oxytetracycline 200 mg/ml  |  Long-acting injectable',
    indication:'Respiratory infections, pneumonia, foot rot — cattle & poultry', unit:'bottles', note:'IM injection only. 48-72h withdrawal.' },
  { id:'BKL-AB03', section:'Antibiotics & Injectables', sectionColor:C2.maroon, priority:'★★',
    name:'Enrofloxacin 10% Injection', spec:'Enrofloxacin 100 mg/ml  |  Injectable',
    indication:'CRD, E. coli, Salmonella — poultry & cattle', unit:'bottles', note:'IM or SC. Not for laying hens.' },
  { id:'BKL-AB04', section:'Antibiotics & Injectables', sectionColor:C2.maroon, priority:'★★',
    name:'Tylosin 20% Injection', spec:'Tylosin tartrate 200 mg/ml  |  Injectable',
    indication:'Mycoplasma, CRD, respiratory infections — poultry', unit:'vials', note:'IM injection.' },

  // Dewormers & Anthelmintics
  { id:'BKL-DW01', section:'Dewormers & Anthelmintics', sectionColor:C2.olive, priority:'★★★',
    name:'Alben-100', spec:'Albendazole 100 mg/ml  |  Oral suspension',
    indication:'Roundworms, tapeworms, liver flukes — cattle, sheep, goats', unit:'bottles', note:'Oral drench. Do not use in first trimester of pregnancy.' },
  { id:'BKL-DW02', section:'Dewormers & Anthelmintics', sectionColor:C2.olive, priority:'★★★',
    name:'Alben 25', spec:'Albendazole 25 mg/ml  |  2.5% oral drench',
    indication:'Internal parasites — poultry & small animals', unit:'bottles', note:'Oral administration.' },
  { id:'BKL-DW03', section:'Dewormers & Anthelmintics', sectionColor:C2.olive, priority:'★★★',
    name:'Alben & Iver', spec:'Albendazole + Ivermectin  |  Combination oral/injectable',
    indication:'Broad-spectrum — roundworms, flukes, mange, lice', unit:'bottles', note:'Follow dosing chart on label.' },
  { id:'BKL-DW04', section:'Dewormers & Anthelmintics', sectionColor:C2.olive, priority:'★★★',
    name:'Ivermectin Injection 1%', spec:'Ivermectin 10 mg/ml  |  Injectable',
    indication:'Nematodes, mange, lice, ticks — cattle, goats, pigs', unit:'vials', note:'SC injection. 500 mcg/kg body weight.' },
  { id:'BKL-DW05', section:'Dewormers & Anthelmintics', sectionColor:C2.olive, priority:'★★',
    name:'Levamisole 7.5% Oral', spec:'Levamisole HCl 7.5%  |  Oral solution',
    indication:'Roundworms, lungworms — cattle, sheep, poultry', unit:'bottles', note:'Oral drench.' },

  // Vitamins & Supplements
  { id:'BKL-VIT01', section:'Vitamins & Supplements', sectionColor:C2.teal, priority:'★★★',
    name:'Aminovit', spec:'Amino acids + Vitamins A, D3, E, B-complex  |  Oral solution',
    indication:'Growth promotion, stress recovery, egg production — poultry', unit:'bottles', note:'Mix in drinking water.' },
  { id:'BKL-VIT02', section:'Vitamins & Supplements', sectionColor:C2.teal, priority:'★★★',
    name:'B. Complex C', spec:'Vitamins B1, B2, B6, B12, C  |  Injectable/oral',
    indication:'Vitamin deficiency, anorexia, poor growth — all species', unit:'bottles', note:'IM injection or oral.' },
  { id:'BKL-VIT03', section:'Vitamins & Supplements', sectionColor:C2.teal, priority:'★★',
    name:'Canxi-Magne', spec:'Calcium + Magnesium  |  Injectable',
    indication:'Milk fever, grass tetany, hypocalcaemia — dairy cattle', unit:'bottles', note:'Slow IV infusion.' },
  { id:'BKL-VIT04', section:'Vitamins & Supplements', sectionColor:C2.teal, priority:'★★',
    name:'Anti Flu (Vitamin C + Electrolytes)', spec:'Ascorbic acid + Electrolyte complex  |  Powder',
    indication:'Immune support, heat stress, disease recovery — poultry', unit:'sachets', note:'Mix in drinking water.' },

  // Acaricides & Antiprotozoals
  { id:'BKL-AC01', section:'Acaricides & Antiprotozoals', sectionColor:C2.brown, priority:'★★★',
    name:'Pavex (Parvaquone) Injection', spec:'Parvaquone 150 mg/ml  |  Injectable',
    indication:'East Coast Fever (ECF), Theileriosis — cattle', unit:'vials', note:'SC injection. Requires cold chain.' },
  { id:'BKL-AC02', section:'Acaricides & Antiprotozoals', sectionColor:C2.brown, priority:'★★',
    name:'Anti Gum Topical', spec:'Aluminium sulfate / antiseptic  |  Topical liquid',
    indication:'Wound care, footrot, screw-worm — livestock', unit:'bottles', note:'Apply directly to wound.' },

  // Feed Additives
  { id:'BKL-FA01', section:'Feed Additives & Nutrition', sectionColor:C2.indigo, priority:'★★',
    name:'Wellfed Layer Concentrate', spec:'Protein + vitamins + minerals  |  Feed concentrate',
    indication:'Egg production support — layer hens', unit:'bags', note:'Mix with maize + bran per instructions.' },

  // Equipment & Supplies (18% VAT)
  { id:'BKL-EQ01', section:'Equipment & Supplies', sectionColor:C2.slate, priority:'★★',
    name:'Copper-tip Plastic Steel Injectors', spec:'Assorted sizes: 2ml, 5ml, 10ml, 20ml',
    indication:'Drug & vaccine administration — all species', unit:'units', note:'State sizes when ordering.' },
  { id:'BKL-EQ02', section:'Equipment & Supplies', sectionColor:C2.slate, priority:'★★',
    name:'Cattle Blank Ear Tag', spec:'Plastic / self-locking  |  State colour & numbering',
    indication:'Livestock identification', unit:'packs', note:'Specify colour, number range.' },
  { id:'BKL-EQ03', section:'Equipment & Supplies', sectionColor:C2.slate, priority:'★',
    name:'Ear Tag Applicator', spec:'Standard plier-type applicator',
    indication:'For use with standard plastic ear tags', unit:'units', note:'Compatible with most plastic tags.' },
  { id:'BKL-EQ04', section:'Equipment & Supplies', sectionColor:C2.slate, priority:'★',
    name:'Anti Suck Nose Clip — Cattle', spec:'Plastic spike-type nose ring',
    indication:'Prevent calf suckling — cattle management', unit:'units', note:'Humane weaning device.' },
];

export function makeBukoolaVetSupplier() {
  return {
    name: 'Bukoola Vet',
    contactEmail: 'info@bukoolavet.com',
    contactPerson: '',
    phone: '+256 312 260 200',
    location: 'Kampala, Uganda',
    address: 'Bukoola House, Plot 10 Nakivubo Road, Kampala',
    web: 'bukoolavet.com',
    paymentTerms: 'Net 30',
    minimumOrderQuantity: 1,
    leadTimeDays: 3,
    notes: 'Vertically integrated veterinary pharmaceutical manufacturer & distributor. Est. 2017.',
    catalogue: BUKOOLA_VET_CATALOGUE,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ULTRAVETIS — Ultravetis Uganda Ltd, Kampala
// Source: ultravetis.com / kihysoco.com distributor (scraped May 2026).
// ═══════════════════════════════════════════════════════════════════════════════
const C3 = { green:'1B5E20', teal:'004D40', blue:'1A237E', brown:'4E342E', purple:'4A148C', slate:'37474F' };

export const ULTRAVETIS_CATALOGUE = [
  // Acaricides & Tick Control
  { id:'UV-AC01', section:'Acaricides & Tick Control', sectionColor:C3.brown, priority:'★★★',
    name:'Ectomin 100 EC', spec:'Cypermethrin 100 g/L  |  EC formulation',
    indication:'Ticks, lice, mites — cattle, sheep, goats', unit:'bottles', note:'Dilute before dipping or spraying.' },
  { id:'UV-AC02', section:'Acaricides & Tick Control', sectionColor:C3.brown, priority:'★★★',
    name:'Ectopor 020 SA', spec:'Cypermethrin 2%  |  Pour-on / spray',
    indication:'Ticks, flies, lice — cattle', unit:'bottles', note:'Pour-on application along backline.' },
  { id:'UV-AC03', section:'Acaricides & Tick Control', sectionColor:C3.brown, priority:'★★',
    name:'Steladone 300 EC', spec:'Deltamethrin 300 g/L  |  EC formulation',
    indication:'Ticks, stable flies — cattle & premises', unit:'bottles', note:'High-efficacy pyrethroid.' },
  { id:'UV-AC04', section:'Acaricides & Tick Control', sectionColor:C3.brown, priority:'★★',
    name:'Tixfix', spec:'Amitraz-based acaricide  |  Dip / spray',
    indication:'Tick & mange control — cattle', unit:'bottles', note:'Follow dilution chart.' },

  // Dewormers & Anthelmintics
  { id:'UV-DW01', section:'Dewormers & Anthelmintics', sectionColor:C3.green, priority:'★★★',
    name:'Valbazen 10% Drench', spec:'Albendazole 100 mg/ml  |  Oral suspension',
    indication:'Roundworms, tapeworms, flukes — cattle, sheep, goats', unit:'bottles', note:'Do not use first 45 days of pregnancy.' },
  { id:'UV-DW02', section:'Dewormers & Anthelmintics', sectionColor:C3.green, priority:'★★★',
    name:'Valbazen 2.5% Drench', spec:'Albendazole 25 mg/ml  |  Oral suspension',
    indication:'Internal parasites — sheep, goats, poultry', unit:'bottles', note:'Oral drench. Accurate dosing required.' },
  { id:'UV-DW03', section:'Dewormers & Anthelmintics', sectionColor:C3.green, priority:'★★★',
    name:'Endolete 19.5%', spec:'Levamisole 195 mg/ml  |  Injectable / oral',
    indication:'Roundworms, lungworms — cattle, sheep, goats', unit:'bottles', note:'Narrow safety margin — dose carefully.' },
  { id:'UV-DW04', section:'Dewormers & Anthelmintics', sectionColor:C3.green, priority:'★★',
    name:'Endozole 10% Drench', spec:'Albendazole 100 mg/ml  |  Oral drench',
    indication:'Broad-spectrum internal parasites — ruminants', unit:'bottles', note:'Withhold 14 days before slaughter.' },
  { id:'UV-DW05', section:'Dewormers & Anthelmintics', sectionColor:C3.green, priority:'★★',
    name:'Endozole 2.5% Drench', spec:'Albendazole 25 mg/ml  |  Oral drench',
    indication:'Internal parasites — small ruminants & poultry', unit:'bottles', note:'Oral administration.' },
  { id:'UV-DW06', section:'Dewormers & Anthelmintics', sectionColor:C3.green, priority:'★★',
    name:'Prazipet Plus Tablets', spec:'Praziquantel + Pyrantel  |  Tablets (20-pack)',
    indication:'Tapeworms, roundworms — dogs & cats', unit:'packs', note:'20-tablet pack. Dose by body weight.' },

  // Vitamins & Nutritional Supplements
  { id:'UV-VIT01', section:'Vitamins & Nutritional Supplements', sectionColor:C3.teal, priority:'★★★',
    name:'Amilyte', spec:'Vitamins A, D3, E + electrolytes  |  Oral solution / powder',
    indication:'Stress, post-disease recovery, heat stress — poultry & cattle', unit:'bottles', note:'Mix in drinking water.' },
  { id:'UV-VIT02', section:'Vitamins & Nutritional Supplements', sectionColor:C3.teal, priority:'★★★',
    name:'Amin Total', spec:'Amino acid complex + vitamins  |  Oral solution',
    indication:'Growth promotion, productivity — all species', unit:'bottles', note:'Mix in water or feed.' },
  { id:'UV-VIT03', section:'Vitamins & Nutritional Supplements', sectionColor:C3.teal, priority:'★★',
    name:'Chick Pro', spec:'Vitamin + mineral premix  |  Powder 100g',
    indication:'Chick health, early growth — broilers & layers', unit:'sachets', note:'Mix in feed or water for first 2 weeks.' },
  { id:'UV-VIT04', section:'Vitamins & Nutritional Supplements', sectionColor:C3.teal, priority:'★★',
    name:'LitterPro', spec:'Probiotic + organic acids  |  Powder',
    indication:'Litter management, reduce ammonia, gut health — poultry', unit:'kg', note:'Mix in feed.' },
  { id:'UV-VIT05', section:'Vitamins & Nutritional Supplements', sectionColor:C3.teal, priority:'★★',
    name:'Zeggbooster', spec:'Vitamins + Ca + P  |  Powder/Liquid',
    indication:'Egg production, shell quality — layers', unit:'bottles', note:'Mix in drinking water.' },
  { id:'UV-VIT06', section:'Vitamins & Nutritional Supplements', sectionColor:C3.teal, priority:'★',
    name:'Hepaturyl', spec:'Liver support — sorbitol + methionine  |  Oral solution',
    indication:'Liver function support — poultry & cattle', unit:'bottles', note:'Oral administration.' },

  // Minerals & Trace Elements
  { id:'UV-MIN01', section:'Minerals & Trace Elements', sectionColor:C3.blue, priority:'★★★',
    name:'Ultramix Maziwa', spec:'Ca, P, Mg, trace minerals  |  Powder',
    indication:'Milk production support — dairy cattle', unit:'kg', note:'Mix in feed daily.' },
  { id:'UV-MIN02', section:'Minerals & Trace Elements', sectionColor:C3.blue, priority:'★★',
    name:'Ultramix Nyama', spec:'Minerals + growth vitamins  |  Powder',
    indication:'Weight gain, beef production — cattle', unit:'kg', note:'Mix in feed.' },
  { id:'UV-MIN03', section:'Minerals & Trace Elements', sectionColor:C3.blue, priority:'★★',
    name:'Ultramix Joto', spec:'Electrolytes + minerals  |  Powder',
    indication:'Heat stress, electrolyte balance — cattle & poultry', unit:'kg', note:'Mix in drinking water.' },
  { id:'UV-MIN04', section:'Minerals & Trace Elements', sectionColor:C3.blue, priority:'★★',
    name:'Ultraphos DCP 18%', spec:'Dicalcium phosphate 18%  |  Powder 25kg',
    indication:'Bone development, Ca:P ratio — all livestock', unit:'bags', note:'25kg bags. Mix in feed.' },
  { id:'UV-MIN05', section:'Minerals & Trace Elements', sectionColor:C3.blue, priority:'★',
    name:'Lysine (Feed Grade)', spec:'L-Lysine 98%  |  Powder 25kg',
    indication:'Essential amino acid supplementation — poultry & pig feeds', unit:'bags', note:'25kg. Add to compound feed.' },
  { id:'UV-MIN06', section:'Minerals & Trace Elements', sectionColor:C3.blue, priority:'★',
    name:'Methionine (DL-Methionine)', spec:'DL-Methionine 99%  |  Powder 25kg',
    indication:'Feather development, growth, liver health — poultry', unit:'bags', note:'25kg. Measure accurately.' },

  // Probiotics & Gut Health
  { id:'UV-PRO01', section:'Probiotics & Gut Health', sectionColor:C3.purple, priority:'★★',
    name:'Enerzyme Plus', spec:'Digestive enzymes + probiotics  |  Powder',
    indication:'Feed conversion, gut health — poultry & pigs', unit:'kg', note:'Mix in feed.' },
  { id:'UV-PRO02', section:'Probiotics & Gut Health', sectionColor:C3.purple, priority:'★★',
    name:'Gut Bio', spec:'Multi-strain probiotic  |  Powder 100g',
    indication:'Microbiome balance, diarrhoea control — all species', unit:'sachets', note:'100g sachets. Mix in water.' },

  // Disinfectants & Antiseptics
  { id:'UV-DIS01', section:'Disinfectants & Biosecurity', sectionColor:C3.slate, priority:'★★★',
    name:'Ultraxide', spec:'Glutaraldehyde + QAC  |  Liquid concentrate',
    indication:'Farm disinfection, biosecurity — poultry houses, equipment', unit:'bottles', note:'Broad-spectrum. Follow dilution chart.' },
];

export function makeUltravetisSupplier() {
  return {
    name: 'Ultravetis Uganda',
    contactEmail: 'uganda@ultravetis.com',
    contactPerson: '',
    phone: '+256 312 000 000',
    location: 'Nakawa, Kampala',
    address: 'Plot 28, Jinja Road, Nakawa, Kampala',
    web: 'ultravetis.com',
    paymentTerms: 'Net 30',
    minimumOrderQuantity: 1,
    leadTimeDays: 5,
    notes: 'Kenyan-founded company supplying veterinary health, hygiene products, seeds & agrochemicals across East Africa.',
    catalogue: ULTRAVETIS_CATALOGUE,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// NORBROOK — Norbrook Uganda Ltd (Norbrook Laboratories, N. Ireland / Kenya)
// Source: norbrook.com/ea/ (scraped May 2026).
// ═══════════════════════════════════════════════════════════════════════════════
const C4 = { blue:'0D47A1', green:'1B5E20', teal:'004D40', brown:'4E342E', red:'B71C1C', slate:'37474F' };

export const NORBROOK_CATALOGUE = [
  // Dewormers & Anthelmintics
  { id:'NB-DW01', section:'Dewormers & Anthelmintics', sectionColor:C4.green, priority:'★★★',
    name:'Albafas 10% Drench', spec:'Albendazole 100 mg/ml  |  Oral suspension',
    indication:'Roundworms, tapeworms, liver flukes — cattle, sheep, goats', unit:'bottles', note:'Do not use during early pregnancy.' },
  { id:'NB-DW02', section:'Dewormers & Anthelmintics', sectionColor:C4.green, priority:'★★★',
    name:'Albafas 2.5% Drench', spec:'Albendazole 25 mg/ml  |  Oral suspension',
    indication:'Internal parasites — small ruminants & poultry', unit:'bottles', note:'Oral drench.' },
  { id:'NB-DW03', section:'Dewormers & Anthelmintics', sectionColor:C4.green, priority:'★★',
    name:'Albafas Bolus 2500mg', spec:'Albendazole 2500mg  |  Oral bolus',
    indication:'Single-dose deworming — cattle', unit:'boxes', note:'Administer using a bolus gun.' },
  { id:'NB-DW04', section:'Dewormers & Anthelmintics', sectionColor:C4.green, priority:'★★',
    name:'Albafas Bolus 600mg', spec:'Albendazole 600mg  |  Oral bolus',
    indication:'Single-dose deworming — sheep & goats', unit:'boxes', note:'Use bolus gun.' },
  { id:'NB-DW05', section:'Dewormers & Anthelmintics', sectionColor:C4.green, priority:'★★★',
    name:'Levacide Drench', spec:'Levamisole HCl  |  Oral drench',
    indication:'Roundworms, lungworms — cattle, sheep, goats', unit:'bottles', note:'Narrow margin — dose accurately.' },
  { id:'NB-DW06', section:'Dewormers & Anthelmintics', sectionColor:C4.green, priority:'★★★',
    name:'Levacide Poultry', spec:'Levamisole  |  Oral solution',
    indication:'Internal parasites — broilers & layers', unit:'bottles', note:'Mix in drinking water.' },
  { id:'NB-DW07', section:'Dewormers & Anthelmintics', sectionColor:C4.green, priority:'★★★',
    name:'Levafas Diamond', spec:'Levamisole + Closantel  |  Oral drench',
    indication:'Roundworms, flukes, liver fluke — cattle & sheep', unit:'bottles', note:'Combination product.' },
  { id:'NB-DW08', section:'Dewormers & Anthelmintics', sectionColor:C4.green, priority:'★★',
    name:'Levafas Drench', spec:'Levamisole HCl  |  Oral drench',
    indication:'Roundworms, lungworms — cattle', unit:'bottles', note:'Oral drench.' },
  { id:'NB-DW09', section:'Dewormers & Anthelmintics', sectionColor:C4.green, priority:'★★',
    name:'Levafas X-tra', spec:'Levamisole + Oxyclozanide  |  Oral drench',
    indication:'Roundworms + liver fluke — cattle', unit:'bottles', note:'Withdrawal 10 days before slaughter.' },
  { id:'NB-DW10', section:'Dewormers & Anthelmintics', sectionColor:C4.green, priority:'★★',
    name:'Duotech Drench', spec:'Ivermectin + Closantel  |  Oral drench',
    indication:'Roundworms, external parasites, flukes — cattle & sheep', unit:'bottles', note:'Broad-spectrum combination.' },
  { id:'NB-DW11', section:'Dewormers & Anthelmintics', sectionColor:C4.green, priority:'★★★',
    name:'Noromectin Drench', spec:'Ivermectin 0.08%  |  Oral drench',
    indication:'Internal & external parasites — cattle & sheep', unit:'bottles', note:'Ivermectin oral formulation.' },

  // Acaricides & External Parasite Control
  { id:'NB-AC01', section:'Acaricides & External Parasite Control', sectionColor:C4.brown, priority:'★★★',
    name:'Duodip 55%', spec:'Amitraz 55%  |  Liquid concentrate (dip)',
    indication:'Ticks, mange mites — cattle', unit:'bottles', note:'Dilute for dipping or spraying. Follow withdrawal.' },
  { id:'NB-AC02', section:'Acaricides & External Parasite Control', sectionColor:C4.brown, priority:'★★★',
    name:'Norotraz 12.5%', spec:'Amitraz 12.5%  |  Liquid',
    indication:'Ticks, mange — cattle', unit:'bottles', note:'Spray or dip. Dilute per label.' },
  { id:'NB-AC03', section:'Acaricides & External Parasite Control', sectionColor:C4.brown, priority:'★★',
    name:'Sypertix 10%', spec:'Cypermethrin 10%  |  Liquid',
    indication:'Ticks, flies, lice — cattle & sheep', unit:'bottles', note:'Spray application.' },

  // Vitamins & Supplements
  { id:'NB-VIT01', section:'Vitamins & Poultry Health', sectionColor:C4.teal, priority:'★★★',
    name:'Avavite', spec:'Vitamins A, D3, E + B-complex  |  Oral solution',
    indication:'Vitamin deficiency, growth, laying performance — poultry', unit:'bottles', note:'Mix in drinking water.' },
  { id:'NB-VIT02', section:'Vitamins & Poultry Health', sectionColor:C4.teal, priority:'★★',
    name:'Intradine Poultry', spec:'Iodine-based supplement  |  Oral solution',
    indication:'Thyroid function, metabolic support — poultry', unit:'bottles', note:'Add to drinking water.' },

  // Udder Care & Dairy Hygiene
  { id:'NB-UD01', section:'Udder Care & Dairy Hygiene', sectionColor:C4.blue, priority:'★★★',
    name:'Norbrook Milking Salve', spec:'Emollient cream  |  Topical',
    indication:'Teat condition, chapping — dairy cattle', unit:'tins', note:'Apply after each milking.' },
  { id:'NB-UD02', section:'Udder Care & Dairy Hygiene', sectionColor:C4.blue, priority:'★★',
    name:'Norbrook Udderwash', spec:'Teat disinfectant wash  |  Liquid concentrate',
    indication:'Pre & post-milking teat hygiene — dairy cattle', unit:'bottles', note:'Dilute before use.' },

  // Antiseptics & Wound Care
  { id:'NB-WC01', section:'Antiseptics & Wound Care', sectionColor:C4.red, priority:'★★★',
    name:'Norosept 3%', spec:'Iodine 3%  |  Antiseptic solution',
    indication:'Wound care, navel dipping, footrot — all livestock', unit:'bottles', note:'Apply directly or dilute as wound spray.' },
  { id:'NB-WC02', section:'Antiseptics & Wound Care', sectionColor:C4.red, priority:'★★',
    name:'Norocleanse', spec:'Chlorhexidine-based cleanser  |  Liquid',
    indication:'Wound cleaning, pre-surgery skin prep — all animals', unit:'bottles', note:'Gentle cleansing action.' },
  { id:'NB-WC03', section:'Antiseptics & Wound Care', sectionColor:C4.red, priority:'★★',
    name:'Norodine Bolus', spec:'Iodine slow-release bolus  |  Oral',
    indication:'Iodine deficiency — cattle & sheep (goitre prevention)', unit:'boxes', note:'Administer via bolus gun.' },
];

export function makeNorbrookSupplier() {
  return {
    name: 'Norbrook Uganda',
    contactEmail: 'info@norbrook.com',
    contactPerson: '',
    phone: '+256 414 000 000',
    location: 'Banda, Kampala',
    address: 'Plot 703 Banda, Jinja Road, Warehouses No.6 & 7, Kampala',
    web: 'norbrook.com/ea',
    paymentTerms: 'Net 30',
    minimumOrderQuantity: 1,
    leadTimeDays: 7,
    notes: 'Subsidiary of Norbrook Laboratories Ltd (N. Ireland). No. 1 animal healthcare company in Kenya. Products manufactured in Kenya & Ireland.',
    catalogue: NORBROOK_CATALOGUE,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SANGA VET CHEM — Local Ugandan Manufacturer, Namanve Industrial Park
// Source: sangavetchem.com (scraped May 2026).
// ═══════════════════════════════════════════════════════════════════════════════
const C5 = { green:'1B4332', brown:'4E342E', red:'B71C1C' };

export const SANGAVET_CATALOGUE = [
  // Acaricides
  { id:'SV-AC01', section:'Acaricides & Tick Control', sectionColor:C5.brown, priority:'★★★',
    name:'Sangatraz 125®', spec:'Amitraz 12.5%  |  Liquid concentrate',
    indication:'Ticks, mange, lice — cattle, sheep, goats', unit:'bottles',
    note:'Available: 100ml, 500ml, 1L, 2L, 5L. Dilute before dipping or spraying.' },
  { id:'SV-AC02', section:'Acaricides & Tick Control', sectionColor:C5.brown, priority:'★★★',
    name:'Sangatraz 250®', spec:'Amitraz 25%  |  Liquid concentrate (high-strength)',
    indication:'Heavy tick infestation, resistant ticks — cattle', unit:'bottles',
    note:'Available: 100ml, 500ml, 1L, 5L. Higher concentration — dilute carefully.' },
  { id:'SV-AC03', section:'Acaricides & Tick Control', sectionColor:C5.brown, priority:'★★',
    name:'Sangadelta®', spec:'Deltamethrin-based  |  EC formulation',
    indication:'Ticks, stable flies, lice — cattle & sheep', unit:'bottles',
    note:'Available: 100ml, 1L. Synthetic pyrethroid.' },
  { id:'SV-AC04', section:'Acaricides & Tick Control', sectionColor:C5.brown, priority:'★★',
    name:'SANGASUPA', spec:'Cypermethrin-based  |  Liquid',
    indication:'Ticks, external parasites — cattle, goats', unit:'bottles',
    note:'Available: 100ml, 500ml, 1L, 5L. Spray or dip.' },

  // Dewormers
  { id:'SV-DW01', section:'Dewormers & Anthelmintics', sectionColor:C5.green, priority:'★★★',
    name:'Sanga Worm & Fluke Drench', spec:'Albendazole + Closantel  |  Oral drench',
    indication:'Roundworms, tapeworms, liver flukes — cattle, sheep, goats', unit:'bottles',
    note:'Available: 250ml, 500ml, 1L, 5L. Locally manufactured. Affordable.' },

  // Wound Care
  { id:'SV-WC01', section:'Wound Care & Topicals', sectionColor:C5.red, priority:'★★',
    name:'Banish Wound Remedy', spec:'Antiseptic wound spray  |  Liquid',
    indication:'Wound healing, fly strike prevention — all livestock', unit:'bottles',
    note:'Available: 100ml. Spray directly on wound.' },
];

export function makeSangaVetSupplier() {
  return {
    name: 'Sanga Vet Chem Ltd',
    contactEmail: 'info@sangavetchem.com',
    contactPerson: '',
    phone: '+256 772 000 000',
    location: 'Namanve, Mukono',
    address: 'Plot 1144, Kampala Industrial Business Park, Namanve, Mukono District',
    web: 'sangavetchem.com',
    paymentTerms: 'Net 30',
    minimumOrderQuantity: 1,
    leadTimeDays: 2,
    notes: 'NDA-licensed local Ugandan manufacturer. Products: acaricides, anthelmintics, wound care. Manufacturing since August 2021. Supports local industry.',
    catalogue: SANGAVET_CATALOGUE,
  };
}

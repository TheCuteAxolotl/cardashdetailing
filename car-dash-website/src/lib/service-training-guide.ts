export type TrainingGuide = { title: string; focus: string; equipment: string[]; steps: string[]; checks: string[] };
const sharedChecks = [
  "Inspect results in natural or bright work lighting, including commonly missed edges and crevices.",
  "Photograph the finished condition, account for any pre-existing damage, and review the job with the customer.",
  "Confirm all accessories and personal items are returned, doors/windows are secured, and the vehicle is safe to release.",
];
function guide(title: string, focus: string, equipment: string[], steps: string[], checks: string[] = []): TrainingGuide {
  return {title, focus, equipment, steps, checks: [...checks, ...sharedChecks]};
}
export const TRAINING_GUIDES: Record<string, TrainingGuide> = {
  "essential": guide("Essential Detail", "Routine maintenance interior and exterior", ["Two-bucket/contact-wash tools", "pH-appropriate shampoo and foam cannon", "Interior brushes, vacuum and microfiber towels", "Glass cleaner, wheel and tire products"], [
    "Walk around the vehicle with the customer. Record condition, damage, unusual stains, sensitive surfaces, and any special requests.",
    "Secure the vehicle, remove only authorized loose trash and belongings, and pre-vacuum seats, floors, mats, trunk and accessible crevices.",
    "Clean the dashboard, console, cupholders, door panels, buttons and accessible trim with a suitable interior cleaner, choosing products that are compatible with the surface.",
    "Clean rubber or fabric mats using their proper methods, dry them fully, then clean interior glass without contaminating tint or electronic screens.",
    "Rinse loose exterior grit, pre-treat wheels and tires, foam/pre-soak as needed, and perform a controlled contact wash from clean areas toward dirtier panels.",
    "Rinse thoroughly; use clean drying towels or filtered air to dry paint, jambs and crevices. Dress tires carefully without overspray.",
    "Finish exterior glass and check for water runs, missed debris, streaks, and dirt in crevices."
  ]),
  "full": guide("Full Detail", "Deeper cleaning inside and out", ["Essential wash and interior tools", "Interior extractor where safe", "Soft detailing brushes", "Approved interior protection and paint sealant"], [
    "Start with a full condition assessment, photos and odor/stain identification. Explain any upgrades that require a quote.",
    "Remove authorized trash and mats, then vacuum thoroughly under seats, in seat tracks, seams, carpets and cargo areas.",
    "Agitate and clean accessible interior hard surfaces and vents; detail door pockets, cupholders and touch points without soaking controls.",
    "Spot treat light stains and clean seats/carpet with material-compatible products; extract only where appropriate and manage drying to avoid trapped moisture.",
    "Clean and protect compatible interior surfaces; clean both sides of glass and inspect for residue.",
    "Wash wheels and tires, pre-rinse, foam and contact wash the exterior. Remove routine road grime and bugs using appropriate dwell and safe agitation.",
    "Rinse, dry, apply the included compatible exterior protection, then dress tires and inspect paint, trim and glass.",
    "Recheck the interior for dampness, residue and missed stains before completing the final walkthrough."
  ]),
  "signature": guide("Signature Detail", "Full detail plus decontamination and one-step paint refinement", ["Full-detail equipment", "Iron remover and clay media", "Paint thickness gauge where appropriate", "RUPES DA polisher, pads and approved compound/polish", "Panel preparation and sealant"], [
    "Inspect for repainted panels, damaged clear coat, deep scratches and fragile trim; agree realistic correction expectations.",
    "Complete the deep interior and safe exterior wash steps of the Full Detail.",
    "Chemically decontaminate the paint as appropriate, then clay only where needed using lubrication. Rewash or wipe residue away.",
    "Measure/assess paint where possible, protect sensitive trim and edges, then test a small section to select a one-step pad/polish combination.",
    "Polish using controlled passes and pad cleaning. Do not chase scratches that cannot safely be corrected.",
    "Remove polishing oils using the product-compatible surface-prep method; inspect paint under suitable lighting.",
    "Apply the included sealant only to compatible, prepared surfaces following its label, respecting curing and weather limitations.",
    "Finish wheels, tires, trim and glass; review the restored gloss and explain ongoing maintenance."
  ]),
  "interior-refresh": guide("Interior Refresh", "Light maintenance interior", ["Vacuum, brushes", "Material-safe interior cleaner", "Lint-free towels and glass cleaner"], [
    "Inspect upholstery and document existing damage; remove authorized loose debris.",
    "Vacuum seats, mats and accessible flooring, then brush/vacuum crevices.",
    "Wipe dashboard, console, touch points and panels with compatible cleaner; avoid soaking electronics or perforated materials.",
    "Clean mats and interior glass, allow any damp areas to dry, and complete a final touch-point check."
  ]),
  "full-interior": guide("Full Interior Detail", "Detailed interior cleaning", ["Vacuum and crevice tools", "Interior brushes", "Surface-compatible cleaners and protection", "Optional extraction tools"], [
    "Inspect and photograph stains, fabrics, leather and potential water or odor sources.",
    "Remove authorized debris, mats, and accessible loose items, then vacuum under seats, in tracks and along edges.",
    "Clean seams, vents, cupholders, door pockets, console, dash and trim carefully.",
    "Agitate and clean seats, carpets and mats according to material; extract only when appropriate and allow complete drying.",
    "Clean glass, protect compatible surfaces, and verify no cleaners remain in controls or stitching."
  ]),
  "deep-reset": guide("Deep Interior Reset", "Heavily neglected cabin and stain work", ["Extractor with suitable chemistry", "Vacuum", "Soft/hard brushes by surface", "Air movers", "PPE"], [
    "Inspect all stains and odors; identify the source, note exclusions, and get customer approval for extra labor or replacement needs.",
    "Remove loose debris and thoroughly vacuum seat seams, floors, footwells, cargo space and tight crevices.",
    "Pre-treat compatible fabrics and carpets, use controlled agitation and extraction, and avoid saturating foam, electronics and headliners.",
    "Address heavy staining in repeated controlled passes; stop when further cleaning would risk fabric or dye damage.",
    "Deep clean hard surfaces, mats and vents, then dry thoroughly using ventilation and air movement.",
    "Inspect after drying; quote persistent contamination and document anything not safely removable."
  ]),
  "maintenance-wash": guide("Maintenance Wash", "Safe exterior upkeep", ["Foam cannon and shampoo", "Wash mitts", "Wheel-safe cleaner", "Drying towels"], [
    "Inspect for damage, loose trim and coating/paint conditions.",
    "Clean wheels and tires with compatible products, keeping chemicals away from hot or sensitive finishes.",
    "Pre-rinse and foam the vehicle; safely remove bonded dirt before contact when possible.",
    "Wash top-down with clean mitts, rinse and dry with clean towels or air.",
    "Dress tires and clean exterior glass; inspect for water spotting."
  ]),
  "full-exterior": guide("Full Exterior Detail", "Thorough wash, decontamination and protection", ["Full wash system", "Iron remover", "Clay media", "Sealant", "Trim-safe towels"], [
    "Inspect paint and note embedded contamination, chips, oxidation and damaged clear coat.",
    "Clean wheels, tires, jambs and exterior, using pre-rinse and contact-wash best practices.",
    "Use iron remover and clay only where compatible and necessary; follow product instructions and rinse away residues.",
    "Dry and assess surface condition, then apply approved paint protection on suitable finishes.",
    "Finish trim, glass and tires; inspect in bright lighting for residue and missed panels."
  ]),
  "paint-enhancement": guide("Paint Enhancement Detail", "Exterior detail plus one-step polishing", ["DA polisher and pads", "Compound/polish", "Masking tape", "Panel wipe", "Exterior protection"], [
    "Inspect paint history, panel edges, prior repairs, clear-coat condition and deep defects.",
    "Wash and chemically/mechanically decontaminate compatible paint, then dry completely.",
    "Mask fragile trim, do a test spot, and choose the least aggressive pad/polish combination that meets the agreed result.",
    "Polish with controlled technique, clean pads frequently, and avoid heat buildup at edges.",
    "Inspect correction under lighting, remove compatible polish residue and apply agreed protection.",
    "Finish wheels and exterior glass and explain realistic maintenance expectations."
  ]),
  "ceramic": guide("Ceramic Coating", "Prep, correction and controlled ceramic application", ["Wash and decontamination tools", "DA polisher", "Panel prep", "Gyeon/Gtechniq coating and applicators", "Proper lighting, gloves, temperature/humidity monitoring"], [
    "Confirm coating authenticity, chosen product, manufacturer's current application directions and realistic durability expectations.",
    "Wash and remove tar, iron fallout and bonded contaminants using compatible chemistry; dry all seams and trim.",
    "Assess paint and perform quoted correction. Inspect under suitable lighting and avoid excessive material removal.",
    "Clean and degrease surfaces using the coating maker's approved panel prep; protect unsuitable plastics, rubber and nearby areas.",
    "Check temperature, humidity, ventilation and cure conditions. Apply coating panel-by-panel following the exact product label for timing and leveling.",
    "Inspect from several angles for high spots while within safe correction windows; do not assume all coating products flash the same way.",
    "Keep vehicle dry and protected during the manufacturer's initial cure period; explain wash restrictions, maintenance and warranty exclusions.",
    "Document batch/product, installation date, condition and recommended follow-up."
  ]),
  "paint-correction": guide("Paint Correction", "Multi-stage defect reduction", ["Paint inspection lighting", "Paint gauge where applicable", "DA and/or rotary polisher", "Compounds, polishes and matched pads", "Masking and protection"], [
    "Inspect paint thickness, previous repairs, deep defects and potential clear-coat failure; establish realistic correction goal.",
    "Wash and decontaminate, dry the car and mask sensitive edges, badges and trim.",
    "Perform test spots and choose stages based on paint response; start with the least aggressive effective method.",
    "Polish controlled sections, clean pads often, avoid excess heat and recheck between stages.",
    "Refine compounding haze with finishing polish where needed, and inspect in multiple lighting conditions.",
    "Remove residual oils by a compatible method, protect the paint and explain which defects remain."
  ]),
  "headlight": guide("Headlight Restoration", "Restore oxidized exterior plastic lenses", ["Masking materials", "Appropriate wet/dry abrasives", "Polisher and compound", "UV-specific headlight coating"], [
    "Inspect for internal haze, deep cracking and lens integrity; those may require replacement.",
    "Mask paint, rubber and trim. Clean lenses and evaluate the minimum sanding required.",
    "Refine sanded surfaces through appropriate progressive abrasives; avoid overheating or gouging the lens.",
    "Polish until clarity is restored and remove all residues.",
    "Apply a dedicated UV-resistant headlight coating according to its manufacturer's directions. Without UV protection, resurfaced lenses can yellow rapidly.",
    "Explain curing restrictions and inspect beam clarity and lens finish."
  ]),
  "marine": guide("Marine Detailing", "Boat wash, surface preservation and gelcoat care", ["Marine-safe cleaners", "Soft brushes", "Access/PPE and fall protection as appropriate", "Gelcoat polisher", "Marine protection"], [
    "Inspect boat and trailer access, oxidation, decals, electrical fittings and gelcoat condition. Quote by actual area and severity.",
    "Protect drains, waterways and sensitive electrical systems; comply with local wash-water containment rules.",
    "Wash non-skid and hull surfaces with suitable cleaners without making footing hazardous.",
    "Clean seating, compartments and vinyl with material-compatible products, avoiding prolonged saturation.",
    "Test oxidation correction on a small gelcoat section and work in controlled steps; use marine-grade polish and protection where appropriate.",
    "Inspect seams, windows and hardware; document areas needing repair beyond detailing."
  ]),
  "odor-general": guide("General Odor Treatment", "Food, pet and everyday odors", ["Vacuum", "Material-safe interior cleaner", "Source-specific cleaning products", "Optional professional gas treatment with exposure controls"], [
    "Interview the customer to identify odor type, location, duration and prior treatments. Check for hidden spills, filters or moisture.",
    "Remove trash and contaminated residues; vacuum and deep-clean the affected textiles and hard surfaces.",
    "Address the actual source rather than masking it; treat pet urine with suitable products only when material compatibility is verified.",
    "Inspect the cabin air filter and HVAC air intake if the smell recirculates.",
    "Only consider an approved supplemental deodorization treatment after cleaning, according to product labeling and exposure-control requirements.",
    "Ventilate and verify safe re-entry before anyone occupies the car. Reassess smell after the cabin has cooled and been closed for a period.",
    "Explain that deeper contamination can require padding, upholstery or filter replacement."
  ]),
  "odor-smoke": guide("Smoke Odor Treatment", "Cigarette, cigar and cannabis residue", ["PPE and microfiber towels", "Residue-safe cleaner", "Extractor where appropriate", "Glass cleaner", "Optional professional odor-treatment materials"], [
    "Inspect smoke severity and document tobacco film, ash, headliner discoloration and HVAC contamination.",
    "Remove ash and loose debris. Clean glass, door panels, dashboard, seats and other touched surfaces with compatible products.",
    "Carefully clean the headliner without soaking or damaging adhesive; shampoo/extract compatible fabrics and carpeting as needed.",
    "Inspect and replace contaminated cabin air filters if approved, and clean accessible HVAC surfaces safely.",
    "Only use a supplemental gas or other odor technology when warranted and supported by the manufacturer's safety directions. Keep the cabin unoccupied and restrict access during any hazardous treatment.",
    "Ventilate and verify safe re-entry before returning the car. Check the smell again after airing out; quote further contamination work if necessary.",
    "Do not promise permanent elimination of smoke that has penetrated foam, insulation or HVAC internals."
  ]),
  "odor-severe": guide("Severe Odor Restoration", "Custom-quoted embedded smoke, urine or other persistent contamination", ["Inspection tools", "Appropriate PPE", "Material-safe cleaning and extraction tools", "Drying/ventilation equipment"], [
    "Perform a detailed assessment before giving a fixed quote; document sources, extent of contamination, moisture and material condition.",
    "Determine whether contaminated carpet, padding, foam, filters or insulation require specialist cleaning or replacement.",
    "Remove sources first; clean all safe-to-access surfaces and manage moisture during extraction.",
    "For mold or biological hazards, assess whether specialist remediation is required instead of ordinary detailing.",
    "If supplemental oxidative treatment is used, follow all labels, keep people and animals out, isolate the work area, and verify safe re-entry after ventilation.",
    "Reinspect over time and provide a written scope of improvements, exclusions and possible return visits."
  ]),
  "pet-hair": guide("Pet Hair Removal", "Loosen and remove embedded hair without damaging fabric", ["Vacuum", "Rubber hair-removal tool", "Soft brushes", "Lint rollers"], [
    "Inspect fabric and document hair severity and delicate woven materials.",
    "Vacuum broad surfaces first, then gently loosen trapped hair using a fabric-compatible brush or rubber tool.",
    "Work seams, seat tracks and carpet edges in sections. Avoid aggressive scraping on leather, suede or fragile fibers.",
    "Vacuum again and check for remaining hair under changing light angles."
  ]),
  "seat-shampoo": guide("Seat Shampoo", "Fabric-seat spotting and extraction", ["Test-spot cleaner", "Brushes", "Extractor", "Air mover"], [
    "Identify fabric versus leather, Alcantara or other moisture-sensitive material and test in a concealed spot.",
    "Dry vacuum thoroughly, then apply suitable cleaner without oversaturating foam.",
    "Agitate gently, extract if safe and repeat only as needed; avoid lifting dyes and leaving detergent residue.",
    "Promote complete drying before returning the vehicle; inspect seams and seat sensors."
  ]),
  "carpet-extraction": guide("Carpet Extraction", "Deep carpet and floor-mat cleaning", ["Vacuum", "Pre-spray", "Extractor", "Air mover"], [
    "Inspect carpeting, underlay moisture and staining. Remove mats if appropriate.",
    "Dry vacuum and agitate embedded soil before wet chemistry.",
    "Pre-treat with material-compatible products, agitate gently and extract using controlled moisture.",
    "Rinse/extract residues as appropriate, dry fully and verify no dampness or recurring odor."
  ]),
  "heavy-stain": guide("Heavy Stain Removal", "Targeted staining on compatible surfaces", ["Stain-specific cleaner", "Brushes", "Extractor", "Colorfastness test"], [
    "Identify the source and age of staining; document irreversible dye transfer or material damage.",
    "Test an inconspicuous area for colorfastness. Select targeted chemistry rather than indiscriminately combining cleaners.",
    "Apply carefully, gently agitate and remove residue using extraction or wiping as appropriate.",
    "Repeat conservatively, dry and document any remaining staining without promising perfect results."
  ]),
  "leather": guide("Leather Protection", "Clean and protect compatible finished leather", ["Leather-safe cleaner", "Soft brush", "Lint-free towel", "Compatible protectant"], [
    "Identify protected, coated, aniline or delicate leather; test a hidden spot.",
    "Vacuum seams, gently clean with compatible chemistry, and avoid soaking perforated seats.",
    "Wipe residues and dry completely, then apply a manufacturer-compatible protectant sparingly.",
    "Check for residue on steering wheel and other high-grip touch points."
  ]),
  "engine": guide("Engine Bay Cleaning", "Controlled low-moisture engine-bay care", ["Low-pressure spray or damp microfiber", "Detail brushes", "Appropriate degreaser", "Air blower"], [
    "Confirm vehicle and manufacturer precautions; avoid working on hot components and identify vulnerable connectors, exposed wiring, alternator and intakes.",
    "Dry-remove leaves and debris first. Protect susceptible parts without blocking cooling or airflow.",
    "Use a controlled amount of surface-compatible cleaner with brushes and microfiber; avoid high-pressure spray into electronics.",
    "Wipe/low-pressure rinse only where safe, dry accessible areas thoroughly and check for residual moisture.",
    "Inspect before releasing and never start or operate a vehicle where electrical or mechanical safety is uncertain."
  ]),
  "iron": guide("Iron Decontamination", "Remove bonded ferrous fallout", ["Iron remover", "Gloves", "Pressure rinse", "Clean drying towel"], [
    "Inspect wheels and paint for fragile or incompatible finishes and work on cool surfaces.",
    "Apply manufacturer-approved iron remover without letting it dry.",
    "Allow the label-specified dwell time, keep off incompatible surfaces and rinse thoroughly.",
    "Inspect and repeat only where necessary before further decontamination."
  ]),
  "clay": guide("Clay Bar Treatment", "Mechanically remove bonded contamination", ["Clay media", "Dedicated lubricant", "Clean towels"], [
    "Wash and chemically decontaminate as appropriate; test paint for bonded grit.",
    "Use ample lubrication and light pressure on a small compatible section.",
    "Inspect and replace contaminated clay to avoid marring. Rewash or remove all lubricant.",
    "Advise customers that clay may introduce light marring and may need polishing."
  ]),
  "wax": guide("Hand Wax", "Temporary gloss and paint protection", ["Compatible wax", "Foam applicator", "Fresh microfiber"], [
    "Wash and dry paint; remove surface contamination when necessary.",
    "Check finish compatibility and apply a thin coat according to the wax label.",
    "Allow correct hazing/removal timing and buff with clean towels.",
    "Inspect trim, edges and body seams for residue."
  ]),
  "sealant": guide("Ceramic Sealant", "Spray-applied or wipe-on paint sealant", ["Clean applicator", "Sealant", "Microfiber towels"], [
    "Clean and dry the finish; follow the sealant manufacturer's required preparation.",
    "Apply evenly and sparingly by panel to compatible surfaces; follow exact dwell/removal instructions.",
    "Level streaks with the recommended method and observe any water/cure restrictions.",
    "Explain that this is a sealant, not a professional multi-year ceramic coating."
  ]),
  "wheel-coating": guide("Wheel Ceramic Coating", "Protect accessible wheel surfaces", ["Wheel cleaner", "Iron remover", "Surface prep", "Wheel coating and applicators"], [
    "Inspect finish, heat and accessibility. Agree whether wheel removal and inner barrels are included.",
    "Wash, decontaminate and dry wheels thoroughly; avoid hot or damaged finishes.",
    "Prepare surfaces as recommended and apply coating section-by-section per manufacturer's instructions.",
    "Inspect for leveling/high spots and respect heat and cure limitations."
  ]),
  "trim": guide("Exterior Trim Protection", "Restore appearance and protect compatible plastic trim", ["Plastic-safe cleaner", "Brush", "Trim-specific protectant"], [
    "Inspect trim material, fading and previous dressings; mask adjacent paint if needed.",
    "Clean dirt and oils thoroughly, dry and confirm product compatibility.",
    "Apply small even amounts of approved protectant; remove excess and avoid glass/paint transfer.",
    "Observe cure restrictions and document pre-existing irreversible fading."
  ]),
  "bug-tar": guide("Bug & Tar Removal", "Remove bonded organic and petroleum contamination", ["Surface-safe remover", "Microfiber", "Rinse"], [
    "Identify contamination and test a hidden compatible area.",
    "Use a dedicated product on cool surfaces according to label dwell instructions.",
    "Remove gently rather than scraping paint, then rinse and inspect.",
    "Reapply paint protection if the remover affected the existing layer."
  ]),
  "underbody": guide("Underbody Cleaning", "Clean accessible undercarriage areas", ["Approved low-pressure wash equipment", "PPE", "Drainage controls"], [
    "Check vehicle clearance and access; never crawl under an inadequately supported vehicle.",
    "Inspect sensors, electrical components and corrosion-sensitive areas.",
    "Remove loose salt and road debris from safely accessible surfaces with controlled rinsing.",
    "Manage runoff, avoid forcing water into electrical equipment, and inspect before release."
  ]),
};
export function findTrainingGuide(name: string, id = ""): TrainingGuide {
  const key = `${id} ${name}`.toLowerCase();
  if (/odor-severe|severe odor/.test(key)) return TRAINING_GUIDES["odor-severe"];
  if (/odor-smoke|smoke odor|cigarette|cannabis/.test(key)) return TRAINING_GUIDES["odor-smoke"];
  if (/odor|deodor/.test(key)) return TRAINING_GUIDES["odor-general"];
  if (/headlight/.test(key)) return TRAINING_GUIDES.headlight;
  if (/wheel.*coat/.test(key)) return TRAINING_GUIDES["wheel-coating"];
  if (/iron/.test(key)) return TRAINING_GUIDES.iron;
  if (/clay/.test(key)) return TRAINING_GUIDES.clay;
  if (/bug|tar/.test(key)) return TRAINING_GUIDES["bug-tar"];
  if (/underbody/.test(key)) return TRAINING_GUIDES.underbody;
  if (/engine/.test(key)) return TRAINING_GUIDES.engine;
  if (/leather/.test(key)) return TRAINING_GUIDES.leather;
  if (/sealant/.test(key)) return TRAINING_GUIDES.sealant;
  if (/trim/.test(key)) return TRAINING_GUIDES.trim;
  if (/wax/.test(key)) return TRAINING_GUIDES.wax;
  if (/pet.*hair/.test(key)) return TRAINING_GUIDES["pet-hair"];
  if (/seat.*shampoo/.test(key)) return TRAINING_GUIDES["seat-shampoo"];
  if (/carpet.*extract|carpet.*shampoo/.test(key)) return TRAINING_GUIDES["carpet-extraction"];
  if (/stain/.test(key)) return TRAINING_GUIDES["heavy-stain"];
  if (/marine|boat/.test(key)) return TRAINING_GUIDES.marine;
  if (/ceramic.*coat|mohs|syncro|gtechniq/.test(key)) return TRAINING_GUIDES.ceramic;
  if (/paint.*correction|2.step|3.step/.test(key)) return TRAINING_GUIDES["paint-correction"];
  if (/signature/.test(key)) return TRAINING_GUIDES.signature;
  if (/essential/.test(key)) return TRAINING_GUIDES.essential;
  if (/maintenance.*wash/.test(key)) return TRAINING_GUIDES["maintenance-wash"];
  if (/paint.*enhancement/.test(key)) return TRAINING_GUIDES["paint-enhancement"];
  if (/full.*exterior/.test(key)) return TRAINING_GUIDES["full-exterior"];
  if (/full.*detail/.test(key)) return TRAINING_GUIDES.full;
  if (/deep.*interior|deep.*reset/.test(key)) return TRAINING_GUIDES["deep-reset"];
  if (/full.*interior/.test(key)) return TRAINING_GUIDES["full-interior"];
  if (/interior.*refresh/.test(key)) return TRAINING_GUIDES["interior-refresh"];
  if (/exterior/.test(key)) return TRAINING_GUIDES["full-exterior"];
  if (/interior/.test(key)) return TRAINING_GUIDES["full-interior"];
  return guide(name, "Custom service — adapt the standard procedure to the vehicle and contracted scope",
    ["Inspection light and photos", "Appropriate surface-compatible tools", "PPE and clean towels"], [
      "Inspect the vehicle with the customer and confirm the precise scope, exclusions and desired result.",
      "Identify materials, stains, damage and electrical or mechanical concerns; select compatible cleaners and methods.",
      "Prepare the area, protect sensitive surfaces and test a small inconspicuous section.",
      "Complete the quoted work methodically while checking results and material condition.",
      "Clean up all residues, verify surfaces are dry and safe, and review the completed work with the customer.",
    ]);
}

# United States (us): motorcycle and boat fees, October 2026

Snapshot date 10 Oct 2026. Rates and fees are what a buyer meets in the 50 states plus DC; the state codes are the same two-letter codes CarFinder already uses for cars (`data/states_us.json`, plus `US` = nationwide average). Items marked "approx" were not confirmed on a government page and should be shown as estimates.

## Motorcycles: price basis
- `price_min` / `price_max` are the US MSRP of the cheapest and most expensive standard variant (for example base, ABS, SE, DCT trims), in whole dollars. MSRP excludes freight/destination, dealer set-up (PDI), the dealer doc fee, sales/use tax, title, plates and registration, and accessories. The typical freight plus set-up amount is in each row's `freight` field.
- Harley-Davidson and Indian list a "Starting at" price for the base colour; `price_max` adds the usual premium-paint or trim upcharge (about $500 to $1,500) and is not a published variant price. Ducati, KTM and Zero show 2027 model-year prices for several bikes because those 2027 bikes went on sale in mid-2026; Honda, Yamaha, Kawasaki, Suzuki, BMW, Harley-Davidson, Indian, Triumph and Royal Enfield prices are 2026 model year.
- `est = 1` (50 of 270 rows) means the price is estimated or only partly confirmed (small importers, MV Agusta, Husqvarna, some Aprilia and Moto Guzzi, electric Kawasakis, Can-Am three-wheeler top trims). Tariffs on imported bikes in 2025 and 2026 are already inside these MSRPs.

## Motorcycles: dealer discount climate
hot: 0% to +2%   steady: -4% to 0%   deals: -12% to -5%
- hot (sells at sticker, some dealers add up to 2% market adjustment): Honda Rebel 300/500, Triumph Speed 400, Royal Enfield Hunter 350 and Classic 350, Yamaha MT-07 and R9, BMW R 1300 GS, Ducati Multistrada V4, Kawasaki Ninja 500 and Z900RS.
- steady (small discounts, free accessories, financing offers): most Honda, Yamaha, Kawasaki, BMW, Triumph, Ducati and Royal Enfield models.
- deals (factory rebates of $500 to $4,000 or 0.99% to 4.99% APR for 36 to 60 months, plus dealer discounts): Harley-Davidson (excluding CVO), Indian (especially baggers and Scouts), Suzuki, KTM and Husqvarna, Zero, LiveWire, Can-Am, Slingshot and 2026 leftovers once 2027 models arrive in autumn.

## Motorcycles: fees and taxes from list price to on-the-road
| Line item | Amount or formula | Varies by region? | Notes |
|---|---|---|---|
| Freight/destination plus dealer set-up | the row's `freight` field: Honda $500-600, Yamaha/Kawasaki/Suzuki $600, Harley-Davidson $1,000-1,100, Indian $995, BMW $1,095 ($895 R 18, $595 G 310), Ducati $695, KTM $700, Triumph $595, Royal Enfield $624 ($375 freight + $249 prep), Aprilia $595-695, CFMoto $495, Vespa $450, Zero $495, Can-Am and Slingshot three-wheelers $1,500 | No | Charged on top of MSRP by nearly every dealer; ask for an out-the-door price. Taxable in most states |
| Dealer doc/handling fee | `min(car doc fee in states_us.json, 599)`; legal caps: CA $85, NY $175, MN $125, IA $180, AR $129; typical $199-$599 elsewhere; FL, VA, GA, TN dealers often charge the $599 maximum used here | Yes (table below) | Powersports dealers charge a little less than car dealers; fee is taxable in most states |
| Sales/use tax | `rate × (price after discount + freight + set-up + doc fee)`, using the per-state rate below | Yes | Same state rate as cars except DC (6%) and WA (no 0.3% motor vehicle tax). Out-of-state purchases are taxed at the home state rate with credit for tax already paid |
| Title fee | default $25; CA $27, FL $77, IL $150-$165, PA $67, NY $50, MA $75, TX $33, OH $15, NC $56, VA $15 | Yes | Approx; one-time |
| Plates plus first-year registration | default $125; CA $120 plus 0.65% of the price (vehicle licence fee), AZ $2.80 per $100 of 60% of MSRP (first-year licence tax), CO $100 plus specific ownership tax of about 1.8% of MSRP in year 1 (2.1% of 85% of MSRP, declining yearly), IL $210 all-in, MA $190, PA $150, NY $130, WA $130, NJ $130, FL $120, TX $110, MI $60, OH $75 | Yes | Approx; renewals are cheaper (default $40-$100 per year). Some states (VA, MO, KS, CT, SC) add local personal-property tax on motorcycles |
| Safety inspection | $0 in most states; $10-$40 in NY, NJ, MA, PA, VA, NC, NH, ME, DE, HI, DC | Yes | Annual or two-yearly; emissions checks only in a few counties |
| Compulsory insurance | liability cover is required in 48 states plus DC (New Hampshire does not require it and Florida does not require it for motorcycles unless the rider goes helmetless) | Yes | Information only: first-year full coverage averages $600-$900 for a cruiser or standard, $900-$1,500 for a sportbike, $1,500-$3,000 for riders under 25; trikes about $500-$900 |
| Rider training (optional) | Basic RiderCourse $0-$350, often waives the road test | Yes | Many insurers give 5%-15% off; mandatory for under-21 first-time riders in CA and some other states |
| Federal excise tax | $0 | No | The 12% federal excise tax applies to heavy trucks and trailers, not to motorcycles |
| EV credit (electric bikes) | $0 | No | See licences and incentives |

State sales/use tax, typical dealer doc fee and notes (rate is state plus average local tax; the nationwide average is on the `US` line):

| Code | State | Tax % | Doc fee $ | Notes |
|---|---|---|---|---|
| US | Nationwide average | 7 | 500 | Average of state rates; pick your state for a closer estimate |
| AL | Alabama | 4 | 500 | 2% state auto rate plus local; local rates vary widely |
| AK | Alaska | 0 | 200 | No state sales tax; a few boroughs charge a local tax |
| AZ | Arizona | 8.4 | 500 | 5.6% state plus city and county |
| AR | Arkansas | 9.5 | 129 | 6.5% state plus local; doc fee capped at $129 |
| CA | California | 8.75 | 85 | 7.25% state plus local (LA and Bay Area run 9.5%-10.25%); doc fee capped at $85 |
| CO | Colorado | 7.8 | 599 | 2.9% state plus local; Denver metro runs 8%-9% |
| CT | Connecticut | 6.35 | 500 | 6.35%, or 7.75% on vehicles over $50,000 |
| DE | Delaware | 4.25 | 300 | No sales tax; the DMV charges a 4.25% document fee instead |
| DC | District of Columbia | 6 | 599 | Excise tax is 6% on motorcycles (cars pay 6% to 8% by weight and mpg) |
| FL | Florida | 6 | 599 | 6% state plus a county surtax (up to 1.5%) on the first $5,000; doc fees are among the highest |
| GA | Georgia | 7 | 599 | One-time 7% Title Ad Valorem Tax on fair market value applies to motorcycles too |
| HI | Hawaii | 4.5 | 300 | 4% excise tax plus county surcharge (4.712% on Oahu) |
| ID | Idaho | 6 | 300 | 6% statewide |
| IL | Illinois | 8.8 | 358 | 6.25% state plus local (Chicago about 10.25%); doc fee capped near $358 |
| IN | Indiana | 7 | 200 | 7% statewide |
| IA | Iowa | 5 | 180 | 5% one-time fee for new registration instead of sales tax; doc fee capped at $180 |
| KS | Kansas | 8.7 | 500 | 6.5% state plus local |
| KY | Kentucky | 6 | 450 | 6% motor vehicle usage tax |
| LA | Louisiana | 10 | 425 | 5% state plus local (often 9%-10.5%); doc fee capped at $425 |
| ME | Maine | 5.5 | 500 | 5.5% statewide |
| MD | Maryland | 6.5 | 500 | 6.5% titling tax (raised from 6% in July 2025); doc fee capped at $500 |
| MA | Massachusetts | 6.25 | 450 | 6.25% statewide |
| MI | Michigan | 6 | 290 | 6% statewide; doc fee capped near $290 |
| MN | Minnesota | 6.875 | 125 | 6.875% motor vehicle sales tax; doc fee capped at $125 |
| MS | Mississippi | 5 | 300 | 5% on cars and light trucks |
| MO | Missouri | 7.9 | 500 | 4.225% state plus local (often 7%-9%) |
| MT | Montana | 0 | 300 | No sales tax |
| NE | Nebraska | 7 | 300 | 5.5% state plus local |
| NV | Nevada | 8.25 | 500 | 6.85% state plus county (Clark County 8.375%) |
| NH | New Hampshire | 0 | 500 | No sales tax |
| NJ | New Jersey | 6.625 | 599 | 6.625%; an extra 0.4% applies to some vehicles over $45,000 |
| NM | New Mexico | 4 | 300 | 4% motor vehicle excise tax |
| NY | New York | 8.5 | 175 | 4% state plus local (NYC 8.875%); doc fee capped at $175 |
| NC | North Carolina | 3 | 599 | 3% highway use tax instead of sales tax |
| ND | North Dakota | 5 | 200 | 5% motor vehicle excise tax |
| OH | Ohio | 7.25 | 250 | 5.75% state plus county; doc fee capped at $250 |
| OK | Oklahoma | 4.5 | 350 | 1.25% sales tax plus 3.25% excise tax |
| OR | Oregon | 0.5 | 250 | No sales tax; 0.5% vehicle privilege tax is usually passed on to the buyer |
| PA | Pennsylvania | 6 | 450 | 6% (7% in Allegheny County, 8% in Philadelphia) |
| RI | Rhode Island | 7 | 400 | 7% statewide |
| SC | South Carolina | 5 | 400 | 5% infrastructure maintenance fee, capped at $500 |
| SD | South Dakota | 4 | 250 | 4% motor vehicle excise tax |
| TN | Tennessee | 7.25 | 599 | 7% state plus local tax on the first $1,600 |
| TX | Texas | 6.25 | 225 | 6.25% statewide; no local tax on vehicles |
| UT | Utah | 7.2 | 400 | 4.85% state plus local |
| VT | Vermont | 6 | 300 | 6% purchase and use tax |
| VA | Virginia | 4.15 | 599 | 4.15% sales and use tax; doc fees are among the highest |
| WA | Washington | 9 | 200 | 6.5% state plus local (Seattle about 10.5%); the 0.3% motor vehicle tax does not apply to motorcycles; doc fee capped at $200 |
| WV | West Virginia | 6 | 400 | 6% titling privilege tax |
| WI | Wisconsin | 5.5 | 400 | 5% state plus 0.5% county |
| WY | Wyoming | 5.4 | 400 | 4% state plus local |

## Motorcycles: licence classes and incentives
- **Licence.** Every state requires a motorcycle licence or an M endorsement on the driver licence for anything above the moped limit (usually 50 cc / 30 mph / about 2 hp; California M2 covers scooters up to 150 cc). There is no engine-size ladder for adults in the US: once a rider passes the written test plus a road test (or the MSF Basic RiderCourse, which waives the road test in most states) any bike is allowed. Learner permits typically bar passengers, night riding and highways. Riders under 18 face engine-size or course rules in some states (CA requires a course for under-21 first-time riders).
- **Beginner-friendly picks** in this dataset: Honda Rebel 300/500, Kawasaki Ninja 500/Z500/Eliminator, Yamaha MT-03/R3, Triumph Speed 400, KTM 390 Duke, Royal Enfield Hunter/Classic 350, Suzuki GSX-8S (all under about 50 hp or with ABS).
- **Three-wheelers.** Polaris Slingshot is an "autocycle" in about 45 states (car licence only; helmet rules vary). Can-Am Spyder/Ryker and Harley trikes are motorcycles in many states (M endorsement) but not in all; check the state DMV.
- **Helmets.** Universal helmet laws in 19 states plus DC (AL, CA, GA, LA, MD, MA, MS, MO, NE, NV, NJ, NY, NC, OR, TN, VT, VA, WA, WV); partial laws (usually under 18 or 21) elsewhere; IL, IA and NH have no helmet law.
- **Incentives.** No federal credit for electric motorcycles: the 30D credit never covered two-wheelers and ended for all EVs on 30 Sep 2025. A few states run small rebates for e-motorcycles (for example Connecticut CHEAPR, Illinois, Colorado); amounts change, so CarFinder should show no incentive. Many states (for example CA, AZ, NV, TX, UT) let motorcycles use carpool lanes solo.


## Boats: price basis
- `price_min` / `price_max` are US MSRP for the standard package in dollars, before freight/prep/commissioning, sales tax, title, registration and dealer fees. The package is stated in each row's note.
- **BMT** = boat, motor and trailer: Tracker, Nitro, Ranger, Mako skiffs (13-19 ft) and Triton are sold as complete BMT packages at a "national price" (no haggling, but clearance rebates); Lowe, Lund, Alumacraft, Crestliner, G3 and Smoker Craft aluminum boats are usually quoted as BMT too, at dealer prices. **Sun Tracker, Tahoe, Bennington, larger Mako and the fiberglass brands** include the outboard or inboard engine but not the trailer ($2,500-$4,500 single axle, $5,000-$9,000 tandem, $9,000-$14,000 for tritoons and 25+ ft hulls). **Personal watercraft** are ski only; a single-ski trailer is $1,000-$2,500. Wake boats usually include the trailer and ballast. Sailboats include the diesel auxiliary but not electronics, canvas or commissioning.
- Prices follow the newest model year on the maker's site in October 2026: model-year 2027 for Sea-Doo, Yamaha WaveRunner, Kawasaki Jet Ski, the Tracker group (Tracker, Sun Tracker, Nitro, Mako 13-17 ft and 226/246, Tahoe, Ranger) and Bennington; model-year 2026 or earlier for the rest. `est = 0` only for Sea-Doo, Yamaha WaveRunner, Kawasaki Jet Ski and the Tracker group (51 of 162 rows); `est = 1` (111 rows) marks every other brand, including Bennington, whose starting prices are confirmed but whose top prices are estimated.
- Typical engines are Mercury or Yamaha outboards; `gph` is an estimate of fuel burn at typical cruise with the standard engine, in US gallons per hour (not a test result).

## Boats: dealer discount climate
hot: 0% to +1%   steady: -6% to 0%   deals: -15% to -6%
- The 2025-26 boat market is soft: high interest rates, tariffs on imported parts and a large stock of 2025 and 2026 boats. Autumn is model-year-end clearance (Oct-Dec) and the best deals appear at winter boat shows (Jan-Feb).
- hot: Grady-White, Boston Whaler (Montauk and Vantage) and Scout; premium saltwater brands rarely sell below MSRP and some dealers have order waits.
- steady: Bennington, wake boats, most fiberglass bowriders, most Tracker-group "no haggle" boats (clearance rebates of $1,000-$3,000 are common), Sea-Doo (2026 models carry $1,000 off or 2 years of coverage), Yamaha WaveRunner and Kawasaki Jet Ski (rebate cycles of $500-$1,500).
- deals: 2025 and 2026 leftovers (Mako 24 Apex was $10,500 off), Sun Tracker clearance, Tahoe, Mako, entry fiberglass bowriders and any boat with an expiring model year. Dealers often bundle trailer, cover or free winterisation instead of cutting price.

## Boats: fees and taxes from list price to in-the-water
| Line item | Amount or formula | Varies by region? | Notes |
|---|---|---|---|
| Freight, prep and commissioning | the row's `freight` field: PWC $900-$1,500, Tracker group $1,195-$3,295, Bennington $2,055-$3,800 (destination), fiberglass runabouts and center consoles $1,800-$7,500, wake boats $3,200-$5,500, sailboats $2,500-$8,000 | No | Added to the "national price" on Bass Pro group boats; taxable in most states |
| Dealer doc fee | $150-$995, typical $399; FL up to $995 | Yes | Check whether it is taxed |
| Sales/use tax | `rate × (boat + motor + trailer + freight/prep)`, then apply the cap column below; use-tax credit for tax paid in another state | Yes | Caps: FL $18,000, TX $18,750, MD $16,100 (from 1 Jul 2026; was $15,000), VA $2,000, NC $1,500, SC $500 per boat and per motor, NY exempts receipts above $230,000 |
| Title | $5-$75 where boats are titled (about 30 states; some titling only above a length or for older hulls) | Yes | e.g. TX $33; FL, VA and MD charge roughly $5-$30; none in several states |
| Registration | by length, one to three years: under 16 ft $15-$45, 16-26 ft $30-$110, 26-40 ft $80-$220, 40 ft and over $150-$400 | Yes | Examples (approx): FL state fee $16.25 (12-16 ft), $28.75 (16-26 ft), $78.25 (26-40 ft) plus about 50% county fee; TX (2-year) $33 under 16 ft, $53 for 16-26 ft, $93 for 26-40 ft. PWC use the same classes |
| Trailer | registration $10-$100 per year; trailer title $5-$50 | Yes | Bought with BMT packages; separate trailer $2,500-$14,000 |
| USCG documentation (optional) | about $133 initial, $26 annual renewal | No | Federal paper for 5+ net tons (roughly 27 ft and up); lenders may require it above $50,000 |
| Compulsory insurance | none in most states; lenders and marinas require liability | Mostly no | Information only: hull plus liability about 1%-2% of value per year (PWC $250-$600, aluminum fishing $250-$700, pontoon $400-$900, ski/wake boat $900-$2,500, center console $800-$3,000; FL, Gulf and Atlantic states add hurricane surcharges) |
| Mooring, launch and storage | wet slip $1,500-$12,000 a year (about $60-$250 per foot, coastal metros top end); dry stack $2,000-$9,000; trailer storage $500-$1,500; ramp fee $0-$25 per launch | Yes | Information only |
| Annual running | winterising and shrink-wrap $300-$1,200; engine service $300-$1,000; bottom paint $500-$2,500 | Yes | Information only |
| Annual local boat tax | MA excise $10 per $1,000 of value (on a 90%/60%/40%/30%/10% age schedule); personal-property tax on boats in many states (for example CT, ME, SC, VA, MO, KS) | Yes | Information only |

Boat sales/use tax by state (rate is state plus typical local tax where local tax applies; `Cap $` is the maximum sales tax per boat sale; New York instead caps the taxable price at $230,000):

| Code | State | Boat tax % | Cap $ | Notes |
|---|---|---|---|---|
| US | Nationwide average | 6 | none | Nationwide average of state rules; many states are capped or exempt |
| AL | Alabama | 2 | none | 2% state rate on a boat, motor and trailer sold as a unit; 4% state rate if the boat or motor is sold alone; local tax may add 1% to 5% |
| AK | Alaska | 0 | none | No state tax; some boroughs charge 3% to 7.5% |
| AZ | Arizona | 8.4 | none | 5.6% state transaction privilege tax plus city and county |
| AR | Arkansas | 9.5 | none | 6.5% state plus local |
| CA | California | 8.75 | none | 7.25% state plus district tax; use tax if the boat is bought elsewhere and kept in CA |
| CO | Colorado | 7.8 | none | 2.9% state plus local |
| CT | Connecticut | 2.99 | none | Reduced 2.99% rate on boats, boat motors and boat trailers (since 1 Jul 2018) |
| DE | Delaware | 0 | none | No sales tax; the 4.25% DMV document fee applies to cars only |
| DC | District of Columbia | 6 | none | 6% sales tax |
| FL | Florida | 6 | 18000 | 6% state plus county surtax (up to 1.5%) on the first $5,000; state tax capped at $18,000 per boat sale |
| GA | Georgia | 7 | none | 4% state plus local sales tax (not the Title Ad Valorem Tax); no cap |
| HI | Hawaii | 4.5 | none | 4% general excise tax plus county surcharge |
| ID | Idaho | 6 | none | 6% statewide |
| IL | Illinois | 8.8 | none | 6.25% state plus local; watercraft use tax when bought out of state |
| IN | Indiana | 7 | none | 7% statewide |
| IA | Iowa | 6 | none | 6% sales tax (approx); local option up to 1% |
| KS | Kansas | 8.7 | none | 6.5% state plus local |
| KY | Kentucky | 6 | none | 6% usage tax |
| LA | Louisiana | 10 | none | 5% state plus local (often 9% to 10.5% total) |
| ME | Maine | 5.5 | none | 5.5% statewide; some exemptions for non-residents |
| MD | Maryland | 5 | 16100 | 5% vessel excise tax capped at $16,100 from 1 Jul 2026 (was $15,000); trade-in of a vessel is credited |
| MA | Massachusetts | 6.25 | none | 6.25% statewide plus annual municipal boat excise |
| MI | Michigan | 6 | none | 6% statewide |
| MN | Minnesota | 6.875 | none | 6.875% plus local (up to 1.5%) (approx) |
| MS | Mississippi | 7 | none | 7% general rate (approx) |
| MO | Missouri | 7.9 | none | 4.225% state plus local |
| MT | Montana | 0 | none | No sales tax |
| NE | Nebraska | 7 | none | 5.5% state plus local |
| NV | Nevada | 8.25 | none | 6.85% state plus county |
| NH | New Hampshire | 0 | none | No sales tax |
| NJ | New Jersey | 6.625 | none | 6.625% statewide |
| NM | New Mexico | 7.1 | none | Gross receipts tax about 7% (approx) |
| NY | New York | 8.5 | base 230000 | 4% state plus local (NYC 8.875%); receipts above $230,000 on a vessel (with motor and trailer) are exempt, so tax applies only to the first $230,000 |
| NC | North Carolina | 3 | 1500 | 3% with a $1,500 maximum per boat; local and transit taxes do not apply to boats |
| ND | North Dakota | 6.5 | none | 5% state plus local (approx) |
| OH | Ohio | 7.25 | none | 5.75% state plus county |
| OK | Oklahoma | 4.5 | none | 3.25% excise plus 1.25% sales tax (approx) |
| OR | Oregon | 0 | none | No sales tax on boats |
| PA | Pennsylvania | 6 | none | 6% (7% Allegheny, 8% Philadelphia) |
| RI | Rhode Island | 0 | none | Sales of boats are exempt from sales and use tax (R.I. Gen. Laws 44-18-30); parts and accessories are taxed |
| SC | South Carolina | 5 | 500 | 5% maximum-tax rate capped at $500 per boat, $500 per motor and $500 per trailer; local taxes do not apply |
| SD | South Dakota | 4.5 | none | 4.2% state plus local (approx) |
| TN | Tennessee | 7.25 | none | 7% state plus local tax on the first $1,600 and 2.75% state single-article tax on $1,600 to $3,200 |
| TX | Texas | 6.25 | 18750 | 6.25% boat and boat motor tax, no local tax; capped at $18,750 per boat sale, motors taxed separately (115 ft or shorter) |
| UT | Utah | 7.2 | none | 4.85% state plus local |
| VT | Vermont | 6 | none | 6% purchase and use tax |
| VA | Virginia | 2 | 2000 | 2% watercraft sales and use tax, maximum $2,000 (Code of Virginia 58.1-1402) |
| WA | Washington | 9 | none | 6.5% state plus local (Seattle about 10.5%) |
| WV | West Virginia | 6 | none | 6% (approx) |
| WI | Wisconsin | 5.5 | none | 5% state plus 0.5% county |
| WY | Wyoming | 5.4 | none | 4% state plus local |

## Boats: licences and rules
- **No federal boating licence.** Education rules are state law, set by birth year, age or horsepower, and almost every state has some rule (approx; check the state agency). Examples: Florida needs a Boating Safety ID Card for anyone born on or after 1 Jan 1988 to run a boat of 10 hp or more; Texas requires a course for anyone born on or after 1 Sep 1993 who runs a boat over 15 hp or a PWC; North Carolina for anyone born after 1 Jan 1988 on 10 hp or more; Georgia for anyone born on or after 1 Jan 1998; California and New York now require a boater card or safety certificate for all operators of motorised boats. Online NASBLA-approved courses cost $0-$60.
- **Personal watercraft.** Minimum operator age is 14 to 16 in most states (education card required), a wearable life jacket is mandatory, riding at night is banned, and the engine cut-off lanyard must be worn.
- **Horsepower.** No limit for adult beginners. Many states restrict children under 12 to 10-15 hp or require an adult aboard; check the state.
- **Registration and title.** Every motorised boat (and sailboat with an engine) must be registered in the state where it is mostly used, usually by the wildlife/natural-resources agency (TX TPWD, NC Wildlife, GA DNR, MD DNR, MN DNR) or the DMV (CA, NY, FL via county tax collector, MI Secretary of State). Registration numbers and a validation decal go on the bow, and the hull ID (HIN) on the transom. About 30 states also title boats. Federal documentation by the Coast Guard is optional for boats of 5 net tons and over (roughly 27 ft and up).
- **Safety rules (federal).** A wearable life jacket for each person (children under 13 must wear one on a moving boat in most states), a throwable device on boats 16 ft and over, a fire extinguisher where required, sound signals, navigation lights, and flares on coastal waters. Since 2021 an engine cut-off switch must be used on planing boats under 26 ft. Boating under the influence is 0.08% blood alcohol.
- **Trailers** need their own plate or registration in most states and must have lights; brakes are required above about 1,500-3,000 lb gross weight depending on the state.

## Fuel and running assumptions
- Road petrol: $4.45 per US gallon, or $1.18 per litre (CarFinder US default); premium (91-93 octane) about $5.15 per gallon ($1.36 per litre) for sport and luxury bikes.
- Marine petrol at a marina: about $5.75 per gallon ($1.52 per litre); ethanol-free about $6.25 ($1.65 per litre). Marine diesel at a marina: about $5.90 per gallon ($1.56 per litre).
- Home electricity: $0.17 per kWh (CarFinder US default).
- Typical annual use: 3,000 miles (4,800 km) for a motorcycle (range 1,500-6,000; commuter scooters 4,000 and up); 50 engine hours a year for a pontoon, fishing or runabout boat, 40 for a PWC, 100-150 for a wake boat (including ballast time), 50 motoring hours for a sailboat.
- Annual fuel cost = `gph × hours × marine fuel price` for boats; `miles ÷ mpg × petrol price` for bikes (mpg = 235.215 ÷ `l100`).
- Typical loan: motorcycles 7.9% APR, 60 months, 10% down (manufacturer promotions run 0.99%-4.99% for 36-60 months); boats 8.5% APR, 180 months, 15% down (120 months under $30,000, 240 months over $100,000).
- Depreciation, for information: a new motorcycle loses about 15%-20% in year 1; a new boat loses about 10%-15% in year 1 and 5%-8% a year afterwards. Maintenance on a boat is about 5%-10% of its value per year including storage.

## Glossary (8–12 terms per vertical)
Motorcycles
- MSRP: the manufacturer's suggested retail price, before freight, set-up, tax and fees.
- Freight (destination): the charge for shipping the bike from the factory or port to the dealer.
- PDI (set-up): the dealer's assembly and pre-delivery inspection, billed on top of the price.
- Doc fee: the dealer's paperwork charge, capped by law in a few states.
- M endorsement: the motorcycle class added to a driver licence after a test or rider course.
- ABS: anti-lock brakes that stop the wheels locking under hard braking.
- DCT: Honda's dual-clutch automatic gearbox, with no clutch lever.
- E-Clutch: Honda's system that works the clutch for you but still lets you shift gears.
- Cruiser, bagger: relaxed-posture bikes; baggers add a fairing and hard saddlebags.
- Adventure bike: tall, long-travel bike made for both roads and unpaved tracks.
- Dual-sport: a lightweight street-legal trail bike, usually 150 to 650 cc.
- Autocycle/trike: three-wheeler (Slingshot, Spyder, Ryker, Harley trikes) with its own licence rules in many states.

Boats
- BMT: boat, motor and trailer sold as one priced package.
- National price: a fixed price (Tracker group) that dealers do not haggle on; freight and prep are added.
- Freight and prep: the charge for delivering and commissioning a new boat.
- Pontoon/tritoon: a deck on two (pontoon) or three (tritoon) aluminum tubes; tritoons are faster and take bigger engines.
- Mod-V and deep-V: hull shapes; mod-V is flatter and stable for shallow lakes, deep-V cuts through big-water chop.
- Center console: an open boat with the steering station in the middle, popular for fishing.
- Outboard, sterndrive, inboard, jet drive: engine layouts; outboards hang off the transom, jets have no exposed propeller.
- HIN: the hull identification number stamped on every boat, used for titling and registration.
- Titling vs registration: title proves ownership; registration lets you operate on public water for a set period.
- USCG documentation: optional federal registration for boats of 5 net tons or more.
- Max HP/person capacity: the maximum engine power and number of people allowed on the manufacturer's capacity plate.
- Wake/surf boat: an inboard tow boat with ballast tanks that shape a wave for surfing or wakeboarding.

## Sources
Motorcycle prices and models:
- https://www.hbhonda.com/Showroom/New-Honda-Models/Model-List/Honda/Motorcycles/2026
- https://powersports.honda.com/motorcycle/scooter/pcx/2026/pcx
- https://www.yamahamotorsports.com/motorcycles
- https://www.421powersports.com/Brands/Manufacturer-Models/Model-List/Yamaha/Motorcycles/2026
- https://yamahamotorsports.com/Blogs.php?action=blogArticle&blog_id=yamaha-announces-thrilling-new-r7-and-all-new-wr125r
- https://www.mainlandcyclecenter.com/Showroom/Factory-Catalogue/Model-List/Kawasaki/Motorcycles/2026
- https://www.motorcyclepowersportsnews.com/2026-kawasaki-motorcycles/
- https://suzukicycles.com/news/2025/07/suzuki-announces-first-wave-of-2026-models-featuring-the-new-gsx-8t-and-gsx-8tt
- https://www.desertcyclenm.com/Brands/Manufacturer-Models/Model-List/Suzuki/Motorcycles/2026
- https://www.harley-davidson.com/us/en/motorcycles/index.html
- https://www.harley-davidson.com/us/en/motorcycles/touring.html
- https://www.harley-davidson.com/us/en/motorcycles/adventure-touring.html
- https://www.indianmotorcycle.com/en-us/motorcycles/
- https://www.warhorsecamphill.com/blog/2026-bmw-motorcycle-price-guide--105915
- https://www.aeopowersports.com/Inventory/Manufacturer-Models/Model-List/Ducati
- https://www.ducati.com/us/en/home/ducati-world-premiere
- https://www.montysmotorsports.com/Brands/Manufacturer-Models/Model-List/KTM/Motorcycles
- https://www.triumphroswell.com/Showroom/Manufacturer-Models/Model-List/Triumph/Motorcycles/2026
- https://www.bmwmoc.com/Showroom/Manufacturer-Models/Model-List/Royal-Enfield/Motorcycles/2026
- https://www.vespamarietta.com/Brands/Manufacturer-Models/Model-List/Vespa/Scooters/2026
- https://zeromotorcycles.com/model-comparison
- https://www.livewire.com/s2-mulholland-electric-motorcycle
- https://www.cfmotousa.com/motorcycles
- https://ridermagazine.com/2026-cfmoto-motorcycle-lineup-plus-clarity-on-app-subscription-rumor/
- https://can-am.brp.com/on-road/us/en/
- https://ridermagazine.com/major-price-drop-on-2026-can-am-electric-motorcycles-plus-spyder-updates/
- https://slingshot.polaris.com/en-us/slingshots/
- https://kymcousa.com/scooters/

Boat prices and models:
- https://sea-doo.brp.com/us/en/models/personal-watercrafts.html
- https://watercraftzone.com.au/2026-sea-doo-prices-specifications-colour-changes/
- https://www.yamahawaverunners.com/waverunner/series/recreation/
- https://www.citiesedge.com/Brands/Manufacturer-Models/Model-List/Kawasaki?Category=Watercraft
- https://www.trackerboats.com/bass.html
- https://www.trackerboats.com/deep-v.html
- https://www.suntrackerboats.com/recreational-pontoons.html
- https://www.suntrackerboats.com/fishing-pontoons.html
- https://www.nitro.com/bass.html
- https://www.makoboats.com/inshore.html
- https://www.makoboats.com/offshore.html
- https://www.tahoeboats.com/bowrider-boats.html
- https://www.rangerboats.com/fiberglass/bass/z-comanche.html
- https://www.rangerboats.com/fiberglass/bass/z500-z100.html
- https://www.benningtonmarine.com/en-us/pontoon-boats/
- https://www.bayliner.com/us/en/boats/watersports/bowrider
- https://www.malibuboats.com/
- https://xshore.com/us/products/x-shore-1/
- https://anglersportmarine.com/all-boats/new-boats/lowe-boats/lowe-fishing-boats/

Taxes and rules:
- https://law.lis.virginia.gov/vacode/title58.1/chapter14/section58.1-1402/
- https://ncdor.gov/taxes-forms/sales-and-use-tax/taxable-items/boats-and-related-items
- https://dnr.maryland.gov/boating/Pages/registration.aspx
- https://dor.sc.gov/sales-use-tax-index/maximum-tax-max-tax
- https://tax.ny.gov/pdf/research/stats/expenditure-reports/TaxExpenditureFY18.pdf
- https://webserver.rilegislature.gov/Statutes/TITLE44/44-18/44-18-30.HTM
- https://portal.ct.gov/dmv/vehicle-services/sales-tax-registrations/sales-tax-calculator
- https://admincode.legislature.state.al.us/administrative-code/810-6-2-.46.01
- https://flsenate.gov/Laws/Statutes/2025/212.05
- https://comptroller.texas.gov/taxes/boat
- `data/states_us.json` in this repository (car sales tax and doc fees reused for motorcycles).

Not confirmed on a web page (knowledge-based, approx): title and registration fees, insurance ranges, mooring and storage costs, boater-education birth-year rules, loan norms, and every price flagged `est = 1`.

"""Aircraft datasets: one master list of new general-aviation aircraft with 2026 factory list prices in US dollars,
then one file per country with the models sold there, converted at the exchange rates recorded for the aircraft
compile in data/sources.json (fx.perEur[fx.convertedAt.air], rubles at fx.rubPerUsd) and left BEFORE VAT / GST /
sales tax and import duty, which data/vfees.json adds per country.
Run from the repo root: python3 tools/air.py   (rewrites data/air_*.json; then node src/build.js && node --test)
Row: [make, model, body, size, cls, fuelsStr, fuel, price, top, ktas, gph, range_km, kwh, hp, seats, engines, mkt, note, est, isNew, delivery]"""
import json, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
with open(os.path.join(ROOT, 'sources.json'), encoding='utf-8') as f:
    _FX = json.load(f)['fx']
_DATE = _FX['convertedAt']['air']
_E = _FX['perEur'][_DATE]
# per US dollar: ECB rates are quoted per euro, so divide by the euro's dollar rate; the ruble is the Bank of Russia rate
FX = {'US': 1, 'ES': 1 / _E['USD'], 'UK': _E['GBP'] / _E['USD'], 'IN': _E['INR'] / _E['USD'], 'CN': _E['CNY'] / _E['USD'], 'AU': _E['AUD'] / _E['USD'],
      'MX': _E['MXN'] / _E['USD'], 'TH': _E['THB'] / _E['USD'], 'RU': _FX['rubPerUsd'][_DATE], 'BR': _E['BRL'] / _E['USD'], 'CA': _E['CAD'] / _E['USD']}
LUX = {'Gulfstream','Bombardier','Dassault','Embraer','HondaJet','Cessna Citation','Pilatus','Daher','Bell','Airbus Helicopters','Leonardo','Sikorsky','Cirrus','Beechcraft','Epic','Piper M-Class'}
EXOTIC = {'Gulfstream','Bombardier','Dassault'}

def size(seats): return 'Up to 2' if seats <= 2 else '3-4' if seats <= 4 else '5-8' if seats <= 8 else '9-14' if seats <= 14 else 'Over 14'
def tier(make, body):
    if make in EXOTIC or body == 'Large jet': return 'Exotic'
    if make in LUX or body in ('Midsize jet','Light jet','Turboprop'): return 'Luxury'
    return 'Mainstream'

# make, model, body, usd_min, usd_max, ktas, gph, range_km, kwh, hp, seats, engines, mkt, note, est, isNew, delivery_usd, fuel, markets
# markets: 'ALL' or a list of country codes where the type is sold with support; hp = shaft horsepower, or lbf of thrust for jets
A = 'Avgas'; J = 'Jet-A'; E = 'EV'
M = [
 # light-sport, trainers and piston singles
 ('Pipistrel','Velis Electro','LSA',210000,230000,90,None,100,24.8,76,2,'Electric motor','steady','The first type-certified electric aircraft; about 50 minutes of flying per charge, built for flight schools',0,0,8000,E,'ALL'),
 ('Pipistrel','Alpha Trainer / Virus SW','LSA',135000,215000,120,3.5,1100,None,100,2,'Single piston (Rotax)','steady','Slovenian trainers and touring motorgliders; Textron-owned since 2022',1,0,8000,A,'ALL'),
 ('Pipistrel','Panthera','Piston single',900000,1000000,200,10,1850,None,260,4,'Single piston (Lycoming)','steady','Carbon-fibre four-seat tourer with a 200-knot cruise',1,0,12000,A,['US','UK','ES','AU','CA']),
 ('Tecnam','P2008 JC / P2010','Piston single',330000,520000,135,6,1300,None,180,4,'Single piston','steady','Italian trainers; the P2010 is the four-seat tourer, the P2008 the two-seat school aircraft',1,0,8000,A,'ALL'),
 ('Tecnam','P2006T','Piston twin',700000,780000,145,9,1200,None,200,4,'Twin piston (Rotax)','steady','The lightest certified twin; multi-engine trainer',1,0,10000,A,['US','UK','ES','AU','CA','BR','IN','TH','MX']),
 ('Tecnam','P2012 Traveller','Piston twin',3000000,3300000,195,38,1900,None,750,11,'Twin piston (Lycoming TEO-540)','steady','Eleven-seat commuter and skydive aircraft with two 375 hp pistons; Sentinel and NxT versions',1,0,25000,A,['US','UK','ES','AU','BR','TH','IN']),
 ('Cessna','172 Skyhawk','Piston single',520000,560000,124,9,1200,None,180,4,'Single piston','hot','The most-built aircraft in history; flight-school backlog keeps new ones at list',1,0,10000,A,'ALL'),
 ('Cessna','182 Skylane','Piston single',680000,720000,145,13,1700,None,230,4,'Single piston','steady','The 172’s bigger brother with a 230 hp engine',1,0,10000,A,'ALL'),
 ('Cessna','206 / T206 Stationair','Piston single',830000,900000,150,16,1300,None,310,6,'Single piston','steady','Six-seat utility single; floats and cargo door options',1,0,12000,A,'ALL'),
 ('Cessna','Caravan / Grand Caravan EX','Turboprop',2900000,3300000,185,52,1800,None,867,14,'Single turboprop','steady','The workhorse utility turboprop; freight, floats and skydiving',1,0,25000,J,'ALL'),
 ('Piper','Pilot 100i','Piston single',340000,370000,128,8,900,None,180,2,'Single piston','steady','Budget two-seat trainer version of the Archer',1,0,8000,A,['US','CA','MX','BR','IN','TH','AU','ES','UK','CN']),
 ('Piper','Archer LX / DLX','Piston single',560000,660000,128,9,1000,None,180,4,'Single piston','steady','Classic four-seat trainer; DLX burns Jet-A in a Continental diesel',1,0,10000,A,'ALL'),
 ('Piper','Seminole','Piston twin',900000,950000,160,18,1500,None,360,4,'Twin piston','steady','The multi-engine trainer of most flight schools',1,0,12000,A,'ALL'),
 ('Piper','Seneca V','Piston twin',1400000,1450000,195,26,1500,None,440,6,'Twin piston','deals','Six-seat pressurised-less twin; production winding down',1,0,12000,A,['US','CA','MX','BR','AU','IN','ES','UK']),
 ('Piper','M350','Piston single',1500000,1550000,213,20,2400,None,350,6,'Single piston (pressurised)','steady','Pressurised six-seat piston single',1,0,15000,A,['US','CA','MX','BR','AU','ES','UK','CN']),
 ('Piper','M500 / M600 SLS','Turboprop',2900000,3800000,274,40,2700,None,600,6,'Single turboprop','steady','Pressurised turboprop singles; the M600 has Garmin Autoland',1,0,20000,J,'ALL'),
 ('Piper','M700 Fury','Turboprop',4300000,4500000,301,45,3100,None,700,6,'Single turboprop','hot','The 2024 replacement for the M600; 300-knot cruise',1,1,20000,J,'ALL'),
 ('Cirrus','SR20','Piston single',650000,720000,155,11,1300,None,215,5,'Single piston','steady','Entry Cirrus with the whole-airframe parachute',1,0,10000,A,'ALL'),
 ('Cirrus','SR22 / SR22T (G7+)','Piston single',900000,1300000,183,17,1900,None,315,5,'Single piston','hot','The best-selling piston aircraft for twenty years; G7+ adds Safe Return autoland; delivery positions a year out',1,1,12000,A,'ALL'),
 ('Cirrus','Vision Jet SF50 G2+','Light jet',3400000,3700000,311,70,2200,None,1846,7,'Single turbofan','hot','The owner-flown single-engine jet with a parachute; backlog',1,0,30000,J,'ALL'),
 ('Diamond','DA20-C1','LSA',350000,380000,138,5.5,1000,None,125,2,'Single piston','steady','Austrian-designed two-seat trainer built in Canada',1,0,8000,A,['US','CA','UK','ES','AU','CN','IN','TH']),
 ('Diamond','DA40 NG','Piston single',700000,760000,154,6,1700,None,168,4,'Single piston (Jet-A diesel)','hot','Jet-A-burning four-seater popular with airline academies',1,0,10000,J,'ALL'),
 ('Diamond','DA42-VI','Piston twin',1200000,1300000,197,13,2300,None,336,4,'Twin piston (Jet-A diesel)','steady','Diesel twin trainer and tourer',1,0,12000,J,'ALL'),
 ('Diamond','DA50 RG','Piston single',1100000,1150000,181,9,1400,None,300,5,'Single piston (Jet-A diesel)','steady','Big five-seat retractable single',1,0,12000,J,['US','CA','UK','ES','AU','CN','IN']),
 ('Diamond','DA62','Piston twin',1600000,1750000,192,17,2300,None,360,7,'Twin piston (Jet-A diesel)','steady','Seven-seat diesel twin; the SUV of light aircraft',1,0,15000,J,'ALL'),
 ('Beechcraft','Bonanza G36','Piston single',1200000,1250000,176,17,1700,None,300,6,'Single piston','steady','The 75-year-old six-seat classic, still in production',1,0,12000,A,['US','CA','MX','BR','AU','ES','UK','IN']),
 ('Beechcraft','Baron G58','Piston twin',1900000,1950000,202,32,2000,None,600,6,'Twin piston','steady','Six-seat piston twin',1,0,15000,A,['US','CA','MX','BR','AU','ES','UK','IN','CN']),
 ('Beechcraft','King Air 260 / 360','Turboprop',7500000,8900000,310,100,3200,None,2100,11,'Twin turboprop','steady','The most-built business turboprop; 360 adds a longer cabin and autothrottle',1,0,40000,J,'ALL'),
 ('Beechcraft','Denali','Turboprop',6500000,6800000,285,65,2900,None,1300,11,'Single turboprop','steady','Textron’s new single-engine turboprop with the GE Catalyst engine',1,1,35000,J,['US','CA','MX','BR','AU','UK','ES','CN']),
 ('Mooney','M20V Acclaim Ultra','Piston single',850000,900000,242,18,2000,None,280,4,'Single piston','deals','The fastest piston single; built to order in Kerrville',1,0,12000,A,['US','CA']),
 ('Vulcanair','V1.0','Piston single',400000,430000,140,10,1300,None,180,4,'Single piston','deals','Italian four-seater priced against used 172s',1,0,10000,A,['US','ES','UK','AU','IN']),
 ('Van’s','RV-12iS (S-LSA)','LSA',180000,200000,118,5,1000,None,100,2,'Single piston (Rotax)','steady','Factory-built light-sport version of the kitplane',1,0,6000,A,['US','CA','AU']),
 ('CubCrafters','Carbon Cub SS / XCub','LSA',300000,460000,145,8,1300,None,180,2,'Single piston','steady','Backcountry taildraggers; the XCub is the certified four-seater-style cruiser',1,0,8000,A,['US','CA','AU','BR','MX']),
 ('Bristell','B23 / B8','LSA',300000,330000,135,5,1300,None,140,2,'Single piston (Rotax)','steady','Czech two-seater; the B23 is EASA-certified for training',1,0,8000,A,['US','UK','ES','AU','CA','IN','TH']),
 ('Flight Design','F2 / F4','LSA',250000,420000,130,5,1500,None,140,4,'Single piston (Rotax)','steady','German composite light aircraft; F4 is the four-seater',1,0,8000,A,['US','UK','ES','AU','CA','CN','TH']),
 ('Aeroprakt','A-22LS / A-32','LSA',115000,160000,100,4,1000,None,100,2,'Single piston (Rotax)','deals','Low-cost Ukrainian light-sport aircraft, popular with clubs',1,0,6000,A,['US','UK','ES','AU','TH','IN','BR','MX']),
 ('Jabiru','J230D / J170D','LSA',110000,140000,120,4.5,1300,None,120,2,'Single piston (Jabiru)','steady','Australian-built light-sport aircraft with its own engine',1,0,5000,A,['AU','US','UK','ES','IN','TH','BR']),
 ('American Champion','Citabria / Decathlon','LSA',250000,330000,120,8,900,None,180,2,'Single piston','steady','Aerobatic taildraggers',1,0,8000,A,['US','CA','AU','UK','BR','MX']),
 ('Extra','NG / 330LX','Piston single',600000,680000,180,20,800,None,315,2,'Single piston','steady','Unlimited aerobatic monoplanes',1,0,15000,A,['US','UK','ES','AU','CA','BR','CN','MX']),
 ('Game Composites','GB1 GameBird','Piston single',500000,550000,175,18,900,None,303,2,'Single piston','steady','Carbon aerobatic two-seater',1,0,12000,A,['US','UK','ES','AU']),
 ('Waco','YMF-5D','Piston single',600000,650000,110,14,700,None,300,3,'Single piston (radial)','steady','New-build 1930s biplane',1,0,12000,A,['US','CA']),
 ('Icon','A5','LSA',400000,420000,95,5,800,None,100,2,'Single piston (Rotax)','deals','Amphibious light-sport aircraft with folding wings; production paused and restarted',1,0,8000,A,['US','CA','AU','BR','MX']),
 ('Seamax','M-22','LSA',190000,210000,95,4.5,900,None,100,2,'Single piston (Rotax)','steady','Brazilian amphibious light-sport aircraft',1,0,6000,A,['BR','US','AU','MX','ES']),
 ('GippsAero','Airvan GA8','Piston single',1000000,1100000,120,16,1300,None,300,8,'Single piston','steady','Australian eight-seat utility aircraft for scenic and skydive work',1,0,15000,A,['AU','US','IN','TH','BR','CA']),
 ('Britten-Norman','Islander BN-2','Piston twin',1800000,2200000,140,30,1400,None,520,10,'Twin piston','steady','The island-hopper; still built in the UK',1,0,20000,A,['UK','AU','TH','IN','BR','CA']),
 ('Quest','Kodiak 100 / 900','Turboprop',3200000,4000000,183,50,2100,None,750,10,'Single turboprop','steady','Rough-field utility turboprop; Daher-owned',1,0,25000,J,'ALL'),
 ('Daher','TBM 960','Turboprop',5200000,5500000,330,60,3100,None,850,6,'Single turboprop','hot','The fastest single-engine turboprop; autothrottle and autoland',1,0,30000,J,'ALL'),
 ('Pilatus','PC-12 NGX','Turboprop',6500000,7000000,290,66,3400,None,1200,11,'Single turboprop','hot','Swiss do-everything turboprop with a cargo door; backlog',1,0,35000,J,'ALL'),
 ('Pilatus','PC-24','Light jet',12500000,13000000,440,190,3700,None,6800,11,'Twin turbofan','hot','Jet that uses unpaved strips',1,0,60000,J,'ALL'),
 ('Epic','E1000 AX','Turboprop',4900000,5100000,333,55,3000,None,1200,6,'Single turboprop','steady','Carbon-fibre 333-knot turboprop single',1,0,30000,J,['US','CA','MX','BR','AU','UK','ES']),
 # jets
 ('Cessna Citation','M2 Gen2','Light jet',6500000,6800000,404,130,2900,None,3900,7,'Twin turbofan','steady','Entry Citation for owner-pilots',1,0,40000,J,'ALL'),
 ('Cessna Citation','CJ3 Gen2 / CJ4 Gen2','Light jet',11500000,12500000,450,180,3800,None,7200,10,'Twin turbofan','steady','Light jets with single-pilot approval',1,0,50000,J,'ALL'),
 ('Cessna Citation','XLS Gen2','Midsize jet',16000000,16500000,440,220,3900,None,8200,12,'Twin turbofan','deals','The most-built business jet family',1,0,60000,J,'ALL'),
 ('Cessna Citation','Latitude / Ascend','Midsize jet',20000000,22500000,446,240,5000,None,11600,12,'Twin turbofan','steady','Flat-floor midsize cabin; Ascend is the 2025 update',1,1,70000,J,'ALL'),
 ('Cessna Citation','Longitude','Midsize jet',31000000,32000000,476,300,6500,None,15400,12,'Twin turbofan','steady','Super-midsize flagship Citation',1,0,80000,J,'ALL'),
 ('Embraer','Phenom 100EX','Light jet',5500000,5800000,406,130,2200,None,3400,8,'Twin turbofan','steady','Entry-level jet built in Brazil and Florida',1,0,40000,J,'ALL'),
 ('Embraer','Phenom 300E','Light jet',11000000,11500000,464,180,3700,None,6800,11,'Twin turbofan','hot','The best-selling light jet for a decade',1,0,50000,J,'ALL'),
 ('Embraer','Praetor 500 / 600','Midsize jet',19000000,23000000,466,260,6000,None,15000,12,'Twin turbofan','steady','Midsize and super-midsize with fly-by-wire',1,0,70000,J,'ALL'),
 ('HondaJet','Elite II','Light jet',7500000,7800000,422,140,2900,None,4100,8,'Twin turbofan','steady','Over-the-wing engines and the quietest light-jet cabin',1,0,40000,J,'ALL'),
 ('Bombardier','Challenger 3500','Midsize jet',27500000,28500000,470,300,6200,None,14600,12,'Twin turbofan','steady','Super-midsize with the Global’s cabin tech',1,0,80000,J,'ALL'),
 ('Bombardier','Challenger 650','Large jet',33500000,34500000,470,330,7400,None,18600,14,'Twin turbofan','steady','Wide-cabin large jet; the medevac and special-mission favourite',1,0,90000,J,'ALL'),
 ('Bombardier','Global 5500 / 6500','Large jet',48000000,57000000,516,420,11000,None,31000,16,'Twin turbofan','steady','Long-range Globals',1,0,120000,J,'ALL'),
 ('Bombardier','Global 7500 / 8000','Large jet',75000000,78000000,516,500,14600,None,37600,19,'Twin turbofan','hot','The longest-range business jets; the 8000 is the fastest at Mach 0.94',1,1,150000,J,'ALL'),
 ('Gulfstream','G280','Midsize jet',25000000,26000000,459,280,6700,None,15200,10,'Twin turbofan','steady','Super-midsize Gulfstream built with IAI',1,0,80000,J,'ALL'),
 ('Gulfstream','G400 / G500 / G600','Large jet',35000000,60000000,516,420,12000,None,31000,19,'Twin turbofan','steady','The fly-by-wire mid-size-to-large family',1,0,120000,J,'ALL'),
 ('Gulfstream','G650ER','Large jet',72000000,73000000,516,480,13900,None,33600,19,'Twin turbofan','steady','The 7,500-nm flagship until the G700',1,0,150000,J,'ALL'),
 ('Gulfstream','G700 / G800','Large jet',78000000,82000000,516,500,14800,None,36500,19,'Twin turbofan','hot','The tallest, longest cabin in business aviation; G800 flies 8,000 nm',1,1,150000,J,'ALL'),
 ('Dassault','Falcon 2000LXS / 900LX','Large jet',36000000,45000000,470,330,8800,None,21000,14,'Twin / tri turbofan','steady','French large jets; the 900LX is the three-engine classic',1,0,100000,J,'ALL'),
 ('Dassault','Falcon 6X / 8X','Large jet',55000000,63000000,516,460,11900,None,27000,16,'Twin / tri turbofan','steady','Widest cabin in its class; the 8X flies 6,450 nm',1,0,130000,J,'ALL'),
 ('Dassault','Falcon 10X','Large jet',75000000,78000000,516,520,13900,None,36000,19,'Twin turbofan','hot','Entering service 2027; positions sold',1,1,150000,J,['US','CA','UK','ES','CN','IN','BR','AU','MX','RU','TH']),
 # helicopters
 ('Robinson','R22 Beta II','Helicopter',370000,390000,96,9,380,None,131,2,'Single piston','steady','The world’s most popular training helicopter',1,0,8000,A,'ALL'),
 ('Robinson','R44 Raven I / II','Helicopter',450000,560000,110,15,560,None,245,4,'Single piston','steady','The best-selling civil helicopter; Cadet and Raven versions',1,0,10000,A,'ALL'),
 ('Robinson','R66 Turbine','Helicopter',1100000,1200000,110,23,650,None,300,5,'Single turboshaft','steady','Five-seat turbine Robinson with a Rolls-Royce RR300',1,0,15000,J,'ALL'),
 ('Robinson','R88','Helicopter',3300000,3500000,120,45,650,None,1000,10,'Single turboshaft','hot','Robinson’s new ten-seat utility helicopter unveiled in 2025; first deliveries 2026',1,1,25000,J,['US','CA','AU','BR','MX','IN','TH','ES','UK','CN']),
 ('Guimbal','Cabri G2','Helicopter',450000,480000,90,8,700,None,180,2,'Single piston','steady','French two-seat trainer with a Fenestron tail',1,0,10000,A,['US','UK','ES','AU','CA','IN','TH','CN','BR','MX']),
 ('Enstrom','280FX / 480B','Helicopter',600000,1300000,110,20,500,None,420,5,'Single piston / turboshaft','deals','Michigan-built helicopters revived under new ownership',1,0,12000,A,['US','CA','BR','MX','TH']),
 ('Schweizer','S300C','Helicopter',600000,650000,85,13,360,None,190,3,'Single piston','steady','The 300 series trainer, back in production',1,0,10000,A,['US','CA','MX','BR','AU','IN','TH']),
 ('Bell','505 Jet Ranger X','Helicopter',1600000,1700000,125,32,600,None,504,5,'Single turboshaft','steady','Five-seat light single built in Mirabel, Canada',1,0,20000,J,'ALL'),
 ('Bell','407GXi','Helicopter',3500000,3700000,133,45,620,None,862,7,'Single turboshaft','steady','Seven-seat utility and corporate single',1,0,25000,J,'ALL'),
 ('Bell','429','Helicopter',8000000,8500000,150,80,760,None,1250,8,'Twin turboshaft','steady','Light twin for EMS and corporate use',1,0,40000,J,'ALL'),
 ('Bell','525 Relentless','Helicopter',16000000,17000000,160,150,1000,None,3600,16,'Twin turboshaft','steady','Fly-by-wire super-medium; certified 2025',1,1,60000,J,['US','CA','UK','AU','BR','MX','CN','IN','TH']),
 ('Airbus Helicopters','H125','Helicopter',3500000,3800000,135,45,630,None,952,6,'Single turboshaft','hot','The utility and tourism single that lands on Everest; built in France, Brazil and the US',1,0,25000,J,'ALL'),
 ('Airbus Helicopters','H130','Helicopter',3900000,4100000,130,46,610,None,952,7,'Single turboshaft','steady','Wide-cabin sightseeing single with a Fenestron',1,0,25000,J,'ALL'),
 ('Airbus Helicopters','H135','Helicopter',6500000,7000000,137,65,630,None,1270,7,'Twin turboshaft','steady','Light twin for EMS, police and training',1,0,35000,J,'ALL'),
 ('Airbus Helicopters','H145','Helicopter',11000000,11500000,140,80,650,None,2040,10,'Twin turboshaft','steady','Five-blade twin for EMS and corporate',1,0,45000,J,'ALL'),
 ('Airbus Helicopters','H160','Helicopter',16000000,17000000,150,120,830,None,2600,12,'Twin turboshaft','steady','Medium twin with a quiet Blue Edge rotor',1,0,60000,J,'ALL'),
 ('Leonardo','AW09','Helicopter',3500000,3700000,130,45,800,None,1000,8,'Single turboshaft','steady','The former Kopter SH09 single, certified 2025',1,1,25000,J,['US','CA','UK','ES','AU','BR','CN','IN','TH','MX']),
 ('Leonardo','AW119Kx','Helicopter',4000000,4200000,140,55,950,None,1002,8,'Single turboshaft','steady','Eight-seat single with the AW109’s cabin',1,0,25000,J,'ALL'),
 ('Leonardo','AW109 Trekker / GrandNew','Helicopter',7000000,8000000,150,75,830,None,1700,8,'Twin turboshaft','deals','Light twins for VIP and EMS',1,0,40000,J,'ALL'),
 ('Leonardo','AW169','Helicopter',10000000,11000000,150,95,820,None,2000,10,'Twin turboshaft','steady','Intermediate twin',1,0,45000,J,'ALL'),
 ('Leonardo','AW139','Helicopter',15000000,16000000,165,150,1060,None,3300,15,'Twin turboshaft','steady','The medium twin of offshore, SAR and VIP fleets',1,0,60000,J,'ALL'),
 ('MD Helicopters','MD 500E / 530F','Helicopter',2200000,2600000,135,38,430,None,650,5,'Single turboshaft','steady','The egg-shaped light single, back under new ownership',1,0,20000,J,['US','CA','MX','BR','AU','TH','IN']),
 ('Sikorsky','S-76D','Helicopter',15000000,15500000,155,140,760,None,2100,13,'Twin turboshaft','deals','Corporate and offshore medium twin; last deliveries',1,0,60000,J,['US','CA','UK','BR','CN','IN','AU','MX']),
 # eVTOL, gyroplanes, gliders
 ('EHang','EH216-S','eVTOL',410000,450000,70,None,30,17,100,2,'Electric motors (16)','hot','The first type-certified passenger eVTOL (China, 2023); sold to tourism operators',1,1,20000,E,['CN','TH','MX','BR','ES']),
 ('Pivotal','Helix','eVTOL',190000,220000,55,None,32,11,50,1,'Electric motors (8)','steady','Single-seat ultralight eVTOL sold in the US since 2024; no licence under Part 103',1,0,8000,E,['US','CA','AU']),
 ('Jetson','ONE','eVTOL',128000,150000,55,None,25,10,100,1,'Electric motors (8)','steady','Swedish-Italian single-seat ultralight eVTOL',1,0,8000,E,['US','ES','UK','AU','CA','MX','BR','TH','IN']),
 ('AIR','AIR ONE','eVTOL',150000,170000,80,None,110,20,120,2,'Electric motors (8)','steady','Israeli two-seat eVTOL on pre-order; FAA light-sport path',1,1,8000,E,['US','CA','AU']),
 ('Joby','S4','eVTOL',2500000,3000000,175,None,160,150,600,5,'Electric motors (6)','hot','Air-taxi eVTOL in FAA certification; not sold to individuals yet, price estimated',1,1,30000,E,['US','AU','UK','ES','IN','CA']),
 ('Archer','Midnight','eVTOL',3000000,3500000,130,None,80,140,700,5,'Electric motors (12)','hot','Air-taxi eVTOL in FAA certification; operator orders only, price estimated',1,1,30000,E,['US','IN','AU','UK','ES','CA']),
 ('Vertical Aerospace','VX4','eVTOL',4000000,4500000,130,None,160,200,800,5,'Electric motors (8)','steady','British eVTOL in UK CAA certification; price estimated',1,1,30000,E,['UK','US','ES','BR','IN','AU']),
 ('Beta','ALIA CX300','eVTOL',4000000,4500000,135,None,460,180,500,6,'Electric motor','steady','Vermont electric aircraft; the CTOL version is first to certify',1,1,30000,E,['US','CA']),
 ('AutoGyro','MTOsport 2017 / Cavalon','Gyroplane',120000,175000,95,4.5,600,None,115,2,'Single piston (Rotax)','steady','German gyroplanes; the Cavalon is the side-by-side enclosed model',1,0,6000,A,['US','UK','ES','AU','CA','IN','TH','BR','MX','CN']),
 ('Magni','M16 / M24 Orion','Gyroplane',130000,160000,95,4.5,600,None,115,2,'Single piston (Rotax)','steady','Italian gyroplanes',1,0,6000,A,['US','UK','ES','AU','CA','BR','TH']),
 ('Pipistrel','Taurus Electro / Sinus','Glider',150000,200000,110,3.5,900,None,80,2,'Single piston / electric','steady','Self-launching motorgliders; the Taurus Electro launches on electricity',1,0,8000,A,['US','UK','ES','AU','CA','IN','CN','BR']),
 ('Stemme','S12','Glider',450000,480000,140,4,1500,None,115,2,'Single piston (retracting)','steady','Touring motorglider with a 25-metre wing',1,0,10000,A,['US','UK','ES','AU','CA']),
 ('Schempp-Hirth','Arcus / Discus-2','Glider',150000,260000,80,None,0,None,0,2,'None (towed) / sustainer','steady','German racing and club gliders; sustainer engines optional',1,0,8000,A,['UK','ES','AU','US','CA','BR']),
 ('Alexander Schleicher','ASK 21 B / ASG 32','Glider',120000,250000,80,None,0,None,0,2,'None (towed) / sustainer','steady','The ASK 21 is the standard two-seat training glider',1,0,8000,A,['UK','ES','AU','US','CA','IN']),
 # China, Russia and India locals
 ('AVIC','AC311A / AC312E','Helicopter',2800000,4500000,130,45,600,None,900,7,'Single / twin turboshaft','steady','Chinese light helicopters from Harbin and Changhe',1,0,20000,J,['CN']),
 ('AVIC','AC313A','Helicopter',12000000,13000000,150,160,900,None,3600,27,'Tri turboshaft','steady','13-tonne utility helicopter',1,0,50000,J,['CN']),
 ('Harbin','Y-12F','Turboprop',6000000,6500000,200,90,1400,None,2200,19,'Twin turboprop','steady','19-seat utility turboprop',1,0,40000,J,['CN','TH']),
 ('AVIC General','Leadair AG50 / AG60','LSA',120000,220000,100,4,800,None,100,2,'Single piston (Rotax)','steady','Chinese light-sport aircraft for flying schools',1,0,6000,A,['CN']),
 ('Russian Helicopters','Ansat','Helicopter',4500000,5000000,135,65,500,None,1260,9,'Twin turboshaft','steady','Kazan light twin for EMS and VIP; price in rubles set by the state airline buyers',1,0,30000,J,['RU']),
 ('Russian Helicopters','Ka-226T','Helicopter',6000000,6500000,120,70,600,None,1150,8,'Twin turboshaft (coaxial)','steady','Coaxial light twin',1,0,30000,J,['RU','IN']),
 ('Russian Helicopters','Mi-171A3','Helicopter',16000000,18000000,135,200,800,None,4400,24,'Twin turboshaft','steady','Offshore version of the Mi-8 family',1,0,60000,J,['RU']),
 ('UZGA','Baikal LMS-901','Turboprop',3500000,4000000,160,45,1500,None,800,9,'Single turboprop','steady','The An-2 replacement, still in certification; price estimated',1,1,25000,J,['RU']),
 ('Aviatika','MAI-890 / Sigma-4','LSA',80000,120000,90,4,600,None,100,2,'Single piston (Rotax)','deals','Russian light aircraft',1,0,5000,A,['RU']),
 ('HAL','Dhruv (civil)','Helicopter',6500000,7000000,140,90,640,None,2000,14,'Twin turboshaft','steady','Indian-built medium helicopter; civil version for state governments',1,0,30000,J,['IN']),
 ('HAL','Hindustan 228','Turboprop',6000000,6500000,195,80,700,None,1500,19,'Twin turboprop','steady','Licence-built Dornier 228 for regional routes',1,0,40000,J,['IN']),
 ('Mahindra','Airvan 8','Piston single',1000000,1100000,120,16,1300,None,300,8,'Single piston','deals','GippsAero utility single sold in India',1,0,15000,A,['IN']),
 ('Embraer','Phenom 300E (home market)','Light jet',10500000,11000000,464,180,3700,None,6800,11,'Twin turbofan','hot','Built in São José dos Campos; the best-selling light jet',1,0,50000,J,['BR']),
 ('Helibras','H125 / H130 (Itajubá)','Helicopter',3300000,3900000,135,45,630,None,952,7,'Single turboshaft','steady','Airbus singles assembled in Brazil',1,0,25000,J,['BR']),
 ('Viking','DHC-6-400 Twin Otter','Turboprop',7000000,7500000,170,90,1400,None,1500,19,'Twin turboprop','steady','Canadian-built 19-seat STOL turboprop, floats optional',1,0,40000,J,['CA','US','AU','BR','TH','IN']),
]

RU_PARALLEL = {'Robinson','Cessna','Cirrus','Bell','Airbus Helicopters','Leonardo','Diamond','Piper','Beechcraft','Pilatus','Gulfstream','Bombardier','Dassault','Embraer','Cessna Citation'}
LOCAL_NOTE = {'US':'', 'CA':' · factory list price converted to C$ before GST/HST', 'UK':' · factory price converted to pounds before VAT', 'AU':' · factory price converted to A$ before GST',
              'MX':' · precio de fábrica convertido a pesos antes de IVA', 'ES':' · precio de fábrica en euros antes de IVA y matriculación', 'TH':' · factory price converted to baht before VAT',
              'RU':' · factory price converted to rubles before VAT and duty', 'BR':' · preço de fábrica convertido antes de ICMS', 'CN':' · factory price converted to yuan before VAT and duty', 'IN':' · factory price converted to rupees before customs duty and GST'}
def round_local(x, cc):
    if cc in ('IN',): return int(round(x / 100000.0) * 100000)
    if cc in ('RU','TH','MX'): return int(round(x / 10000.0) * 10000)
    if cc in ('CN','BR'): return int(round(x / 1000.0) * 1000)
    return int(round(x / 1000.0) * 1000)


def fit_note(note, local, cap=230):
    """keep the country suffix whole; shorten the model note at a word boundary if the two together run long"""
    if len(note) + len(local) <= cap: return note + local
    room = cap - len(local)
    cut = note[:room].rsplit(' ', 1)[0].rstrip(',;:')
    return cut + '…' + local

def rows_for(cc):
    out = []
    fx = FX[cc]
    for (make, model, body, lo, hi, ktas, gph, rng, kwh, hp, seats, eng, mkt, note, est, new, dest, fuel, markets) in M:
        if markets != 'ALL' and cc not in markets: continue
        if cc == 'RU' and markets == 'ALL':
            # Russia: Western types have no official importer since 2022; keep the ones that reach the market through third countries
            if make not in RU_PARALLEL: continue
            mkt2, note2 = 'deals', note + ' · parallel import via third countries, no factory support'
        else:
            mkt2, note2 = mkt, note
        p = round_local(lo * fx, cc); t = round_local(hi * fx, cc); d = round_local(dest * fx, cc) if cc != 'US' else dest
        if cc != 'US': est = 1
        f2 = 'None' if not hp else fuel                      # pure gliders: no engine, no fuel, no fixed range
        out.append([make, model, body, size(seats), tier(make, body), f2, f2, p, max(t, p), ktas, gph if hp else None, rng or None, kwh, hp, seats, eng, mkt2, fit_note(note2, LOCAL_NOTE[cc]), est, new, d])
    return out

for cc in FX:
    rows = rows_for(cc)
    with open(os.path.join(ROOT, f'air_{cc.lower()}.json'), 'w', encoding='utf-8') as f:
        f.write('[\n' + ',\n'.join(json.dumps(r, ensure_ascii=False) for r in rows) + '\n]\n')
    print(cc, len(rows))
print('converted at the rates of', _DATE)

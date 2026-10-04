#!/usr/bin/env python3
"""Feed diverse Vancouver civic reports into the CityFix API for live demos."""

from __future__ import annotations

import argparse
import json
import os
import random
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

DEFAULT_API_BASE = "https://cityfix-ztj9.onrender.com"
DEFAULT_SEED_COUNT = 56
CLIENT_ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = CLIENT_ROOT / ".env"

LOCATIONS: list[dict[str, Any]] = [
    {
        "description": "Granville Street and Davie Street",
        "latitude": 49.2806,
        "longitude": -123.1306,
    },
    {
        "description": "Main Street near 12th Avenue",
        "latitude": 49.2610,
        "longitude": -123.1130,
    },
    {
        "description": "Commercial Drive near 1st Avenue",
        "latitude": 49.2696,
        "longitude": -123.0697,
    },
    {
        "description": "Kingsway and Fraser Street",
        "latitude": 49.2494,
        "longitude": -123.0902,
    },
    {
        "description": "Burrard Street Bridge south approach",
        "latitude": 49.2756,
        "longitude": -123.1284,
    },
    {
        "description": "East Hastings Street near Main Street",
        "latitude": 49.2811,
        "longitude": -123.0996,
    },
    {
        "description": "Cambie Street and Broadway",
        "latitude": 49.2631,
        "longitude": -123.1154,
    },
    {
        "description": "West 4th Avenue near Arbutus Street",
        "latitude": 49.2682,
        "longitude": -123.1526,
    },
    {
        "description": "Joyce Street and Vanness Avenue",
        "latitude": 49.2386,
        "longitude": -123.0315,
    },
    {
        "description": "Waterfront Road near Canada Place",
        "latitude": 49.2888,
        "longitude": -123.1114,
    },
    {
        "description": "Stanley Park Causeway near Lions Gate",
        "latitude": 49.3124,
        "longitude": -123.1392,
    },
    {
        "description": "Robson Street near Thurlow Street",
        "latitude": 49.2829,
        "longitude": -123.1258,
    },
    {
        "description": "Oak Street and West 41st Avenue",
        "latitude": 49.2345,
        "longitude": -123.1535,
    },
    {
        "description": "Marine Drive near Cambie Street",
        "latitude": 49.2102,
        "longitude": -123.1168,
    },
    {
        "description": "Hastings Street and Nanaimo Street",
        "latitude": 49.2810,
        "longitude": -123.0550,
    },
    {
        "description": "Broadway and Commercial Drive",
        "latitude": 49.2634,
        "longitude": -123.0695,
    },
    {
        "description": "Georgia Street viaduct east approach",
        "latitude": 49.2795,
        "longitude": -123.1088,
    },
    {
        "description": "Yaletown Roundhouse Community Centre block",
        "latitude": 49.2744,
        "longitude": -123.1219,
    },
    {
        "description": "South False Creek seawall near Olympic Village",
        "latitude": 49.2710,
        "longitude": -123.1085,
    },
    {
        "description": "Boundary Road and East 49th Avenue",
        "latitude": 49.2245,
        "longitude": -123.0230,
    },
    {
        "description": "University Boulevard near Wesbrook Mall",
        "latitude": 49.2606,
        "longitude": -123.2460,
    },
    {
        "description": "Knight Street and East 33rd Avenue",
        "latitude": 49.2420,
        "longitude": -123.0755,
    },
]

CLUSTER_LOCATION = {
    "description": "Main Street near 12th Avenue",
    "latitude": 49.2610,
    "longitude": -123.1130,
}

SECOND_CLUSTER_LOCATION = {
    "description": "Commercial Drive near 1st Avenue",
    "latitude": 49.2696,
    "longitude": -123.0697,
}

THIRD_CLUSTER_LOCATION = {
    "description": "East Hastings Street near Main Street",
    "latitude": 49.2811,
    "longitude": -123.0996,
}

UNMAPPED_PLACES = [
    "Alley behind Granville Street, block unknown",
    "Residential lane west of Commercial Drive",
    "Side street near Joyce-Collingwood Station",
    "Parking lot access off Kingsway, no visible address",
    "Laneway south of Broadway between two shops",
    "Trail edge near Stanley Park, no street number",
    "Service road behind Canada Place loading zone",
]

ISSUE_TEMPLATES: list[dict[str, str]] = [
    {
        "issue_type": "pothole",
        "severity": "high",
        "title": "Deep pothole in the right travel lane",
        "description": "A wide, deep pothole is breaking up the asphalt in the right lane. Vehicles swerve around it during peak traffic.",
        "recommended_action": "Dispatch a road crew to mill and patch the failed pavement and restore the travel lane.",
        "transcript": "There's a really deep pothole in the right lane, cars are swerving around it.",
    },
    {
        "issue_type": "pothole",
        "severity": "medium",
        "title": "Growing pothole at the intersection",
        "description": "A pothole at the stop bar is expanding after recent rain. Cyclists and buses hit it on every cycle.",
        "recommended_action": "Inspect the intersection, patch the surface, and check for underlying base failure.",
        "transcript": "There's a pothole right at the stop line and it's getting bigger after the rain.",
    },
    {
        "issue_type": "graffiti",
        "severity": "low",
        "title": "Graffiti on a civic utility cabinet",
        "description": "Fresh tagging covers a street-level utility cabinet and adjacent retaining wall.",
        "recommended_action": "Schedule graffiti removal and inspect the cabinet for damage to locks or vents.",
        "transcript": "Someone tagged the grey cabinet on the corner, it's pretty fresh.",
    },
    {
        "issue_type": "streetlight",
        "severity": "high",
        "title": "Streetlight out on a dark pedestrian stretch",
        "description": "The overhead light is dark, leaving the sidewalk and crosswalk poorly lit after dusk.",
        "recommended_action": "Replace or repair the luminaire and verify adjacent poles on the same circuit.",
        "transcript": "The streetlight is completely out and this sidewalk is really dark at night.",
    },
    {
        "issue_type": "sidewalk_damage",
        "severity": "medium",
        "title": "Heaved sidewalk creating a trip edge",
        "description": "Concrete panels have heaved, leaving a sharp lip across the walking path.",
        "recommended_action": "Grind or replace the panels and mark the trip hazard until repairs are complete.",
        "transcript": "The sidewalk is lifted up, it's easy to trip on that edge.",
    },
    {
        "issue_type": "overflowing_bin",
        "severity": "low",
        "title": "Public litter bin overflowing onto the sidewalk",
        "description": "A street bin is overflowing, with loose waste blowing onto the sidewalk and curb.",
        "recommended_action": "Empty the receptacle and increase pickup frequency on this block.",
        "transcript": "The garbage can is overflowing and stuff is blowing onto the sidewalk.",
    },
    {
        "issue_type": "illegal_dumping",
        "severity": "medium",
        "title": "Household waste dumped beside the lane",
        "description": "Bags, broken furniture, and cardboard have been left beside the public lane.",
        "recommended_action": "Remove dumped material, photograph evidence, and post a cleanup notice.",
        "transcript": "Someone dumped a bunch of furniture and bags in the lane.",
    },
    {
        "issue_type": "blocked_drain",
        "severity": "high",
        "title": "Catch basin blocked and ponding in the curb lane",
        "description": "Standing water covers the curb lane after moderate rain because the catch basin is clogged with debris.",
        "recommended_action": "Clear the grate and flush the catch basin so the lane can drain.",
        "transcript": "The drain is blocked and the whole curb lane is a puddle after the rain.",
    },
    {
        "issue_type": "traffic_signal",
        "severity": "high",
        "title": "Traffic signal stuck on red for one approach",
        "description": "One approach remains red through multiple cycles, causing backups and unsafe gap-running.",
        "recommended_action": "Send signal maintenance to inspect the controller and restore normal phasing.",
        "transcript": "The light is stuck on red this way, people are starting to run it.",
    },
    {
        "issue_type": "fallen_tree",
        "severity": "high",
        "title": "Fallen limb blocking part of the sidewalk",
        "description": "A large limb is down across the sidewalk and brushing into the parking lane.",
        "recommended_action": "Remove the limb, inspect the tree, and reopen the sidewalk.",
        "transcript": "A big branch came down across the sidewalk, you have to walk into the street.",
    },
    {
        "issue_type": "abandoned_vehicle",
        "severity": "medium",
        "title": "Abandoned vehicle occupying a curb space",
        "description": "A vehicle has sat in the same curb space for several days with expired insurance and a flat tire.",
        "recommended_action": "Tag the vehicle and schedule bylaw removal if it remains unmoved.",
        "transcript": "This car has been sitting here for days, tire is flat and it looks abandoned.",
    },
    {
        "issue_type": "bike_lane_obstruction",
        "severity": "medium",
        "title": "Debris blocking the protected bike lane",
        "description": "Broken crate pieces and glass are sitting in the protected bike lane, forcing riders into mixed traffic.",
        "recommended_action": "Clear debris from the bike lane and sweep remaining glass.",
        "transcript": "There's junk and glass in the bike lane so you have to merge into cars.",
    },
    {
        "issue_type": "water_leak",
        "severity": "high",
        "title": "Water leaking onto the roadway from the curb",
        "description": "Clear water is flowing from the curb into the travel lane, creating a slick surface.",
        "recommended_action": "Investigate a possible water-service leak and isolate if confirmed.",
        "transcript": "Water is coming out by the curb and the road is really slick.",
    },
    {
        "issue_type": "pothole",
        "severity": "low",
        "title": "Shallow pavement depression near the curb",
        "description": "A shallow depression is collecting water and gravel along the curb lane.",
        "recommended_action": "Schedule routine pavement maintenance on the next sweep of this corridor.",
        "transcript": "There's a dip in the road by the curb, not huge but it's holding water.",
    },
    {
        "issue_type": "graffiti",
        "severity": "medium",
        "title": "Large mural-scale tagging on a retaining wall",
        "description": "Multiple layers of spray paint cover a retaining wall facing a busy sidewalk.",
        "recommended_action": "Remove graffiti and assess whether anti-graffiti coating should be reapplied.",
        "transcript": "The whole wall along the sidewalk got tagged overnight.",
    },
    {
        "issue_type": "streetlight",
        "severity": "medium",
        "title": "Streetlight flickering and strobing",
        "description": "A pole light strobes at night, which is distracting for drivers and pedestrians.",
        "recommended_action": "Replace the ballast or LED driver and test the circuit.",
        "transcript": "The light keeps flickering, it's kind of strobing at night.",
    },
    {
        "issue_type": "streetlight",
        "severity": "low",
        "title": "Damaged light pole base cover",
        "description": "The metal base cover is missing, exposing wiring at ankle height.",
        "recommended_action": "Secure the base and inspect for corrosion or exposed conductors.",
        "transcript": "The cover at the bottom of the streetlight pole is gone.",
    },
    {
        "issue_type": "sidewalk_damage",
        "severity": "high",
        "title": "Collapsed sidewalk panel near a bus stop",
        "description": "A panel has sunk, leaving a hole rimmed with broken concrete beside a busy stop.",
        "recommended_action": "Barricade the area, replace the failed panel, and restore ADA clearance.",
        "transcript": "The sidewalk caved in right by the bus stop, it's dangerous.",
    },
    {
        "issue_type": "sidewalk_damage",
        "severity": "low",
        "title": "Uneven pavers in a plaza crossing",
        "description": "Several pavers are uneven, catching stroller wheels and mobility devices.",
        "recommended_action": "Re-level pavers and grout joints in the affected crossing.",
        "transcript": "The bricks in the crosswalk are all uneven, wheels get stuck.",
    },
    {
        "issue_type": "overflowing_bin",
        "severity": "medium",
        "title": "Recycling and litter bins both full",
        "description": "Both bins at a corner are full, with recyclables stacked on top.",
        "recommended_action": "Empty all receptacles and review collection timing for this node.",
        "transcript": "Both garbage and recycling are overflowing at this corner.",
    },
    {
        "issue_type": "illegal_dumping",
        "severity": "high",
        "title": "Construction debris dumped in a bike lane",
        "description": "Drywall and insulation were left in the painted bike lane overnight.",
        "recommended_action": "Remove debris immediately and document for enforcement follow-up.",
        "transcript": "Someone left construction junk in the bike lane.",
    },
    {
        "issue_type": "blocked_drain",
        "severity": "medium",
        "title": "Leaves and grit blocking a storm grate",
        "description": "A grate is covered with wet leaves, slowing drainage after light rain.",
        "recommended_action": "Clear the grate and schedule leaf removal on this block.",
        "transcript": "The storm drain is covered in leaves and not draining.",
    },
    {
        "issue_type": "traffic_signal",
        "severity": "medium",
        "title": "Pedestrian signal not registering push",
        "description": "The beg button appears dead; pedestrians wait through multiple cycles.",
        "recommended_action": "Test the pedestrian phase and replace the push button if faulty.",
        "transcript": "The walk button doesn't seem to work at all.",
    },
    {
        "issue_type": "fallen_tree",
        "severity": "medium",
        "title": "Hanging branch over a sidewalk",
        "description": "A cracked limb is resting on a phone line above the sidewalk.",
        "recommended_action": "Trim or remove the limb and inspect the tree for further failure.",
        "transcript": "There's a branch hanging low over the sidewalk, looks like it could fall.",
    },
    {
        "issue_type": "abandoned_vehicle",
        "severity": "low",
        "title": "Commercial van parked for weeks",
        "description": "A van with expired plates has not moved through street cleaning.",
        "recommended_action": "Verify abandonment and issue a notice before towing.",
        "transcript": "This van hasn't moved in weeks, plates look expired.",
    },
    {
        "issue_type": "bike_lane_obstruction",
        "severity": "high",
        "title": "Delivery truck blocking the bike lane",
        "description": "A truck is parked in the protected lane during rush hour, forcing cyclists into traffic.",
        "recommended_action": "Coordinate with bylaw for immediate relocation and signage review.",
        "transcript": "There's a truck sitting in the bike lane and cyclists have to go around.",
    },
    {
        "issue_type": "bike_lane_obstruction",
        "severity": "low",
        "title": "Sand and grit in the bike lane after sanding",
        "description": "Residual sand makes the lane slippery for cyclists after winter treatment.",
        "recommended_action": "Sweep the bike lane and flush debris from drainage paths.",
        "transcript": "The bike lane is full of sand and it's slippery on corners.",
    },
    {
        "issue_type": "water_leak",
        "severity": "medium",
        "title": "Discoloured water seeping from a valve box",
        "description": "Murky water pools around a valve box at the curb.",
        "recommended_action": "Inspect the valve assembly and schedule repair if the seal has failed.",
        "transcript": "Dirty water keeps bubbling up from that metal box in the sidewalk.",
    },
    {
        "issue_type": "damaged_sign",
        "severity": "medium",
        "title": "Bent stop sign at a neighbourhood intersection",
        "description": "A stop sign is bent toward the ground and hard to see from the approach.",
        "recommended_action": "Reset or replace the sign and verify reflectivity.",
        "transcript": "The stop sign is bent over, you can barely see it coming up the hill.",
    },
    {
        "issue_type": "damaged_sign",
        "severity": "low",
        "title": "Faded crosswalk signage",
        "description": "School zone signs are sun-faded and illegible from a distance.",
        "recommended_action": "Replace sign faces and confirm mounting height meets standard.",
        "transcript": "The school zone signs are so faded you can't read them.",
    },
    {
        "issue_type": "crosswalk_paint",
        "severity": "medium",
        "title": "Crosswalk markings worn away",
        "description": "Paint is gone across most of a marked crossing, especially near the centreline.",
        "recommended_action": "Restripe the crossing and refresh advance warning markings.",
        "transcript": "You can barely see the crosswalk paint anymore.",
    },
    {
        "issue_type": "crosswalk_paint",
        "severity": "low",
        "title": "Bike box markings barely visible",
        "description": "Green bike box paint is chipped and drivers no longer respect the box.",
        "recommended_action": "Repaint the bike box and associated lane markings.",
        "transcript": "The green box for bikes is basically gone at this light.",
    },
    {
        "issue_type": "construction_debris",
        "severity": "medium",
        "title": "Loose gravel from a nearby work site",
        "description": "Gravel tracks across the sidewalk and into a bus stop pad.",
        "recommended_action": "Require site cleanup and sweep adjacent sidewalks.",
        "transcript": "There's gravel all over the sidewalk from the construction site.",
    },
    {
        "issue_type": "construction_debris",
        "severity": "high",
        "title": "Exposed rebar beside a travel lane",
        "description": "Rebar protrudes from a former formwork area without proper barricades.",
        "recommended_action": "Install barricades and remove or cap exposed steel immediately.",
        "transcript": "There's rebar sticking out by the road, no cones or anything.",
    },
    {
        "issue_type": "bus_shelter_damage",
        "severity": "medium",
        "title": "Cracked glass at a bus shelter",
        "description": "A shelter panel is cracked, with glass fragments on the bench.",
        "recommended_action": "Replace the panel and inspect the frame for structural damage.",
        "transcript": "The bus shelter glass is shattered and there's glass on the seat.",
    },
    {
        "issue_type": "bus_shelter_damage",
        "severity": "low",
        "title": "Graffiti and scratched shelter panels",
        "description": "Etching and tags cover multiple panels at a high-ridership stop.",
        "recommended_action": "Clean or replace panels and schedule routine shelter maintenance.",
        "transcript": "The bus shelter is covered in scratches and tags.",
    },
    {
        "issue_type": "malfunctioning_hydrant",
        "severity": "high",
        "title": "Fire hydrant leaking continuously",
        "description": "Water runs steadily from a hydrant flange, icing the sidewalk in cold weather.",
        "recommended_action": "Dispatch water utilities to repair the hydrant and salt icy patches.",
        "transcript": "The fire hydrant won't stop leaking, there's water on the sidewalk.",
    },
    {
        "issue_type": "malfunctioning_hydrant",
        "severity": "medium",
        "title": "Hydrant cap missing",
        "description": "A hydrant is missing its cap, exposing the connection to debris.",
        "recommended_action": "Install a replacement cap and inspect threads for damage.",
        "transcript": "The cap is missing off the hydrant on the corner.",
    },
    {
        "issue_type": "noise_complaint",
        "severity": "low",
        "title": "After-hours construction noise",
        "description": "Repeated loud equipment operation past permitted hours was reported by residents.",
        "recommended_action": "Log the complaint and coordinate with bylaw for permit verification.",
        "transcript": "They're running loud equipment way past when construction should stop.",
    },
    {
        "issue_type": "broken_bench",
        "severity": "low",
        "title": "Splintered bench slats in a small park",
        "description": "Several slats are broken on a public bench, with exposed nails.",
        "recommended_action": "Remove or repair the bench and replace damaged hardware.",
        "transcript": "The park bench is broken with nails sticking out.",
    },
    {
        "issue_type": "broken_bench",
        "severity": "medium",
        "title": "Bench frame twisted after impact",
        "description": "A bench frame is twisted and unstable after a vehicle strike.",
        "recommended_action": "Remove the bench and install a replacement anchor.",
        "transcript": "Someone hit the bench with a car and it's leaning badly.",
    },
    {
        "issue_type": "parking_meter",
        "severity": "low",
        "title": "Parking meter screen blank",
        "description": "A meter display is dark and will not accept payment.",
        "recommended_action": "Reset or replace the meter head and verify the payment network.",
        "transcript": "The parking meter screen is dead, can't pay.",
    },
    {
        "issue_type": "street_sweeping",
        "severity": "low",
        "title": "Heavy leaf buildup on a bike route",
        "description": "Wet leaves cover a downhill bike lane, reducing traction.",
        "recommended_action": "Schedule sweeping and leaf removal on this segment.",
        "transcript": "The bike lane is covered in wet leaves, it's slippery.",
    },
    {
        "issue_type": "other",
        "severity": "medium",
        "title": "Loose manhole cover rattling in traffic",
        "description": "A cover shifts when buses pass, creating a loud bang each cycle.",
        "recommended_action": "Inspect the frame and reset or replace the cover.",
        "transcript": "Every time a bus goes over it the manhole cover bangs really loud.",
    },
    {
        "issue_type": "other",
        "severity": "low",
        "title": "Missing grate on a utility access point",
        "description": "A small grate is missing beside the curb, leaving a foot-wide opening.",
        "recommended_action": "Secure the opening and replace the grate.",
        "transcript": "There's a hole in the sidewalk where a grate should be.",
    },
]

CLUSTER_TEMPLATES = [
    {
        "issue_type": "pothole",
        "severity": "high",
        "title": "Large pothole on Main Street",
        "description": "There is a large pothole near the right lane on Main Street close to 12th Avenue. Buses drop into it.",
        "recommended_action": "Inspect and repair the damaged road surface as a clustered hotspot.",
        "transcript": "There's a really large pothole here near the right lane on Main by 12th.",
    },
    {
        "issue_type": "pothole",
        "severity": "high",
        "title": "Second pothole opening beside the first",
        "description": "A second hole has opened a few metres from the first failure, spreading across both wheel paths.",
        "recommended_action": "Treat the block as one repair job rather than isolated patches.",
        "transcript": "There's another hole right next to the first one, same stretch of Main.",
    },
    {
        "issue_type": "pothole",
        "severity": "medium",
        "title": "Edge break on Main Street near 12th Avenue",
        "description": "The pavement edge is crumbling into the existing pothole cluster after overnight rain.",
        "recommended_action": "Coordinate one field response for the repeated pothole reports at this location.",
        "transcript": "The edge of the road is breaking up right by that pothole on Main and 12th.",
    },
    {
        "issue_type": "pothole",
        "severity": "high",
        "title": "Bus wheel drop at Main and 12th",
        "description": "Transit vehicles are hitting the same failed pavement, shaking the stop nearby.",
        "recommended_action": "Prioritize this hotspot for mill-and-fill before the next rain.",
        "transcript": "The bus just slammed into that hole on Main by 12th again.",
    },
    {
        "issue_type": "pothole",
        "severity": "high",
        "title": "Cyclist crash reported at Main and 12th pothole",
        "description": "A rider reported a fall after hitting the same pothole cluster transit uses.",
        "recommended_action": "Treat as safety-critical and expedite pavement repair at this hotspot.",
        "transcript": "Someone crashed their bike on that pothole on Main by 12th.",
    },
    {
        "issue_type": "pothole",
        "severity": "medium",
        "title": "Temporary cold patch failing on Main Street",
        "description": "An earlier patch has sunk, reopening the wheel path near 12th Avenue.",
        "recommended_action": "Remove failed patch material and install a permanent repair.",
        "transcript": "They patched it but the hole opened up again on Main.",
    },
]

SECOND_CLUSTER_TEMPLATES = [
    {
        "issue_type": "graffiti",
        "severity": "medium",
        "title": "Fresh tags along Commercial Drive shopfronts",
        "description": "Multiple storefront roll doors were tagged overnight on Commercial Drive.",
        "recommended_action": "Coordinate one graffiti response for the repeated reports on this block.",
        "transcript": "A bunch of shops got tagged on Commercial overnight.",
    },
    {
        "issue_type": "graffiti",
        "severity": "low",
        "title": "Sticker bombing on utility poles",
        "description": "Dozens of stickers cover poles near the Commercial and 1st intersection.",
        "recommended_action": "Remove stickers and schedule follow-up cleaning on adjacent poles.",
        "transcript": "All the poles are covered in stickers near Commercial and First.",
    },
    {
        "issue_type": "graffiti",
        "severity": "medium",
        "title": "Murals defaced on Commercial Drive",
        "description": "Tags were sprayed across a permitted mural panel facing the sidewalk.",
        "recommended_action": "Restore the mural surface and document for community arts follow-up.",
        "transcript": "Someone tagged right over the mural on Commercial.",
    },
    {
        "issue_type": "graffiti",
        "severity": "low",
        "title": "Repeated tagging on the same retaining wall",
        "description": "The same wall was hit again within a week of the last cleanup.",
        "recommended_action": "Apply anti-graffiti coating after removal to reduce repeat effort.",
        "transcript": "They tagged the same wall again on Commercial, it was just cleaned.",
    },
]

THIRD_CLUSTER_TEMPLATES = [
    {
        "issue_type": "blocked_drain",
        "severity": "high",
        "title": "Standing water on East Hastings after rain",
        "description": "The curb lane floods because catch basins are clogged along Hastings near Main.",
        "recommended_action": "Clear all grates on this block as one drainage response.",
        "transcript": "Hastings is flooded in the curb lane, the drains are clogged.",
    },
    {
        "issue_type": "blocked_drain",
        "severity": "medium",
        "title": "Second grate blocked on Hastings",
        "description": "Another grate a few metres east is packed with litter and grit.",
        "recommended_action": "Flush the line between the two reported grates.",
        "transcript": "There's another blocked drain just down Hastings from the first one.",
    },
    {
        "issue_type": "blocked_drain",
        "severity": "high",
        "title": "Bus splash zone from ponding on Hastings",
        "description": "Buses throw water onto the sidewalk where ponding persists near Main.",
        "recommended_action": "Prioritize drainage work before the next forecast rain.",
        "transcript": "Buses soak the sidewalk because the water won't drain on Hastings.",
    },
]


def unique_issue_types() -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for template in ISSUE_TEMPLATES:
        key = template["issue_type"]
        if key not in seen:
            seen.add(key)
            ordered.append(key)
    return ordered


def load_dotenv(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.is_file():
        return values
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def first_value(*candidates: str | None) -> str:
    for candidate in candidates:
        if candidate and candidate.strip():
            return candidate.strip()
    return ""


def strip_slash(value: str) -> str:
    return value.rstrip("/")


def with_scheme(value: str) -> str:
    trimmed = value.strip()
    if not trimmed:
        return ""
    if trimmed.lower().startswith("http://") or trimmed.lower().startswith("https://"):
        return strip_slash(trimmed)
    return strip_slash(f"https://{trimmed.lstrip('/')}")


def join_api_url(base: str, path: str) -> str:
    prefix = path if path.startswith("/") else f"/{path}"
    if base.endswith("/api") and prefix.startswith("/api/"):
        return f"{base}{prefix[4:]}"
    return f"{base}{prefix}"


class Config:
    def __init__(self, args: argparse.Namespace) -> None:
        file_env = load_dotenv(ENV_PATH)
        self.api_base = with_scheme(
            first_value(
                args.api_base,
                os.environ.get("CITYFIX_API_BASE_URL"),
                os.environ.get("VITE_API_BASE_URL"),
                file_env.get("CITYFIX_API_BASE_URL"),
                file_env.get("VITE_API_BASE_URL"),
                DEFAULT_API_BASE,
            )
        )
        self.staff_email = first_value(
            args.staff_email,
            os.environ.get("CITYFIX_STAFF_EMAIL"),
            file_env.get("CITYFIX_STAFF_EMAIL"),
        )
        self.staff_password = first_value(
            args.staff_password,
            os.environ.get("CITYFIX_STAFF_PASSWORD"),
            file_env.get("CITYFIX_STAFF_PASSWORD"),
        )
        self.supabase_url = with_scheme(
            first_value(
                args.supabase_url,
                os.environ.get("VITE_SUPABASE_URL"),
                file_env.get("VITE_SUPABASE_URL"),
            )
        )
        self.supabase_key = first_value(
            args.supabase_key,
            os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY"),
            file_env.get("VITE_SUPABASE_PUBLISHABLE_KEY"),
        )
        self.interval = max(0.5, float(args.interval))
        self.access_token = ""


def parse_json(raw: str) -> Any:
    if not raw.strip():
        return None
    return json.loads(raw)


def request_json(
    method: str,
    url: str,
    *,
    body: dict[str, Any] | None = None,
    headers: dict[str, str] | None = None,
    retry: bool = True,
) -> tuple[int, Any, dict[str, str]]:
    payload = None if body is None else json.dumps(body).encode("utf-8")
    request_headers = {"Accept": "application/json"}
    if payload is not None:
        request_headers["Content-Type"] = "application/json"
    if headers:
        request_headers.update(headers)
    req = urllib.request.Request(url, data=payload, headers=request_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=45) as response:
            raw = response.read().decode("utf-8")
            header_map = {key.lower(): value for key, value in response.headers.items()}
            return response.status, parse_json(raw), header_map
    except urllib.error.HTTPError as error:
        raw = error.read().decode("utf-8", errors="replace")
        header_map = {key.lower(): value for key, value in error.headers.items()}
        if error.code == 429 and retry:
            wait = 2.0
            retry_after = header_map.get("retry-after")
            if retry_after:
                try:
                    wait = max(wait, float(retry_after))
                except ValueError:
                    pass
            print(f"Rate limited. Waiting {wait:.0f}s then retrying once.")
            time.sleep(wait)
            return request_json(method, url, body=body, headers=headers, retry=False)
        try:
            parsed = parse_json(raw)
        except json.JSONDecodeError:
            parsed = {"error": raw}
        return error.code, parsed, header_map
    except urllib.error.URLError as error:
        raise RuntimeError(f"Request failed: {error.reason}") from error


def as_record(value: Any) -> dict[str, Any] | None:
    if isinstance(value, dict):
        return value
    return None


def pick_string(source: dict[str, Any], keys: list[str]) -> str:
    for key in keys:
        value = source.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def unwrap_report(payload: Any) -> dict[str, Any]:
    top = as_record(payload) or {}
    envelope = as_record(top.get("data")) or as_record(top.get("result")) or top
    nested = as_record(envelope.get("report"))
    return nested or envelope


def parse_report(payload: Any) -> dict[str, Any] | None:
    source = unwrap_report(payload)
    if not source:
        return None
    nested_location = as_record(source.get("location")) or {}
    tracking = pick_string(source, ["tracking_id", "trackingId", "trackingID"])
    remote_id = pick_string(source, ["id", "report_id", "reportId"])
    if remote_id.upper().startswith("CF-"):
        if not tracking:
            tracking = remote_id
        remote_id = ""
    if not tracking and not remote_id:
        return None
    return {
        "id": remote_id,
        "tracking_id": tracking,
        "title": pick_string(source, ["title"]) or pick_string(source, ["description"]),
        "issue_type": pick_string(source, ["issue_type", "issueType"]) or "other",
        "severity": pick_string(source, ["severity"]) or "medium",
        "status": pick_string(source, ["status", "current_status"]) or "queued",
        "location": pick_string(nested_location, ["description"])
        or pick_string(source, ["location_description", "locationLabel"]),
        "created_at": pick_string(source, ["created_at", "createdAt"]),
    }


def parse_report_list(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        items = payload
    else:
        record = as_record(payload) or {}
        nested = (
            record.get("reports")
            or record.get("data")
            or record.get("items")
            or record.get("results")
            or record.get("rows")
        )
        if isinstance(nested, dict):
            nested = nested.get("reports") or nested.get("data") or nested.get("items")
        items = nested if isinstance(nested, list) else []
    reports: list[dict[str, Any]] = []
    for item in items:
        parsed = parse_report(item)
        if parsed:
            reports.append(parsed)
    return reports


def build_create_body(template: dict[str, str], location: dict[str, Any] | None) -> dict[str, Any]:
    place = location or {}
    body: dict[str, Any] = {
        "type": "report",
        "issue_type": template["issue_type"],
        "title": template["title"],
        "description": template["description"],
        "severity": template["severity"],
        "location": {
            "description": str(place.get("description") or template.get("location_description") or ""),
        },
        "recommended_action": template["recommended_action"],
        "transcript": template["transcript"],
    }
    if "latitude" in place and "longitude" in place:
        body["location"]["latitude"] = place["latitude"]
        body["location"]["longitude"] = place["longitude"]
    return body


def jitter_location(location: dict[str, Any], amount: float = 0.00035) -> dict[str, Any]:
    if "latitude" not in location or "longitude" not in location:
        return dict(location)
    return {
        "description": location["description"],
        "latitude": round(float(location["latitude"]) + random.uniform(-amount, amount), 6),
        "longitude": round(float(location["longitude"]) + random.uniform(-amount, amount), 6),
    }


def build_seed_plan(count: int) -> list[tuple[dict[str, str], dict[str, Any] | None]]:
    planned: list[tuple[dict[str, str], dict[str, Any] | None]] = []
    for template in CLUSTER_TEMPLATES:
        planned.append((dict(template), jitter_location(CLUSTER_LOCATION, 0.00016)))
    for template in SECOND_CLUSTER_TEMPLATES:
        planned.append((dict(template), jitter_location(SECOND_CLUSTER_LOCATION, 0.00014)))
    for template in THIRD_CLUSTER_TEMPLATES:
        planned.append((dict(template), jitter_location(THIRD_CLUSTER_LOCATION, 0.00014)))
    coverage: dict[str, list[dict[str, str]]] = {}
    for template in ISSUE_TEMPLATES:
        coverage.setdefault(template["issue_type"], []).append(template)
    for issue_type in unique_issue_types():
        options = coverage.get(issue_type, [])
        if not options:
            continue
        pick = dict(random.choice(options))
        place = random.choice(LOCATIONS)
        planned.append((pick, jitter_location(place, 0.0004)))
    unmapped_count = min(len(UNMAPPED_PLACES), max(5, count // 12))
    unmapped_templates = [t for t in ISSUE_TEMPLATES if t["severity"] != "high"]
    random.shuffle(unmapped_templates)
    for index in range(unmapped_count):
        if len(planned) >= count:
            break
        template = dict(unmapped_templates[index % len(unmapped_templates)])
        planned.append((template, {"description": UNMAPPED_PLACES[index]}))
    used_titles: set[str] = {item[0]["title"] for item in planned}
    pool = [dict(t) for t in ISSUE_TEMPLATES]
    random.shuffle(pool)
    location_cycle = list(LOCATIONS)
    random.shuffle(location_cycle)
    location_index = 0
    while len(planned) < count:
        template = dict(pool[len(planned) % len(pool)])
        if template["title"] in used_titles:
            template = dict(random.choice(ISSUE_TEMPLATES))
        used_titles.add(template["title"])
        place = location_cycle[location_index % len(location_cycle)]
        location_index += 1
        planned.append((template, jitter_location(place, 0.00055)))
    random.shuffle(planned)
    return planned[:count]


class Feeder:
    def __init__(self, config: Config) -> None:
        self.config = config
        self.created: list[dict[str, Any]] = []

    def url(self, path: str) -> str:
        return join_api_url(self.config.api_base, path)

    def health(self) -> None:
        status, payload, _ = request_json("GET", self.url("/api/health"))
        print(f"Health {status}: {json.dumps(payload, indent=2) if payload else '(empty)'}")

    def create_report(self, template: dict[str, str], location: dict[str, Any] | None) -> dict[str, Any] | None:
        body = build_create_body(template, location)
        status, payload, _ = request_json("POST", self.url("/api/reports"), body=body)
        report = parse_report(payload)
        if status >= 400 or not report:
            print(f"Create failed ({status}): {payload}")
            return None
        self.created.append(report)
        loc = report["location"] or "(unmapped)"
        print(
            f"Filed {report['tracking_id'] or report['id']:10}  "
            f"{report['severity']:6}  {report['issue_type']:24}  {loc}"
        )
        return report

    def ensure_staff(self) -> bool:
        if self.config.access_token:
            return True
        if not (
            self.config.staff_email
            and self.config.staff_password
            and self.config.supabase_url
            and self.config.supabase_key
        ):
            print(
                "Staff actions skipped. Set CITYFIX_STAFF_EMAIL, CITYFIX_STAFF_PASSWORD, "
                "VITE_SUPABASE_URL, and VITE_SUPABASE_PUBLISHABLE_KEY."
            )
            return False
        token_url = (
            f"{self.config.supabase_url}/auth/v1/token?"
            + urllib.parse.urlencode({"grant_type": "password"})
        )
        status, payload, _ = request_json(
            "POST",
            token_url,
            body={"email": self.config.staff_email, "password": self.config.staff_password},
            headers={"apikey": self.config.supabase_key, "Authorization": f"Bearer {self.config.supabase_key}"},
        )
        record = as_record(payload) or {}
        token = pick_string(record, ["access_token"])
        if status >= 400 or not token:
            print(f"Staff login failed ({status}): {payload}")
            return False
        self.config.access_token = token
        print("Staff session ready.")
        return True

    def staff_headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.config.access_token}"}

    def fetch_reports(self) -> list[dict[str, Any]]:
        if not self.ensure_staff():
            return []
        status, payload, _ = request_json(
            "GET",
            self.url("/api/admin/reports"),
            headers=self.staff_headers(),
        )
        if status >= 400:
            print(f"List failed ({status}): {payload}")
            return []
        return parse_report_list(payload)

    def list_reports(self) -> list[dict[str, Any]]:
        reports = self.fetch_reports()
        if not reports:
            print("No reports returned.")
            return []
        print(f"{'TRACKING':10}  {'STATUS':12}  {'SEV':6}  {'TYPE':24}  TITLE")
        for report in reports[:40]:
            print(
                f"{report['tracking_id'] or report['id'][:8]:10}  "
                f"{report['status']:12}  {report['severity']:6}  "
                f"{report['issue_type']:24}  {report['title'][:48]}"
            )
        if len(reports) > 40:
            print(f"... {len(reports) - 40} more")
        return reports

    def patch_status(self, report_id: str, status_value: str) -> bool:
        if not self.ensure_staff():
            return False
        status, payload, _ = request_json(
            "PATCH",
            self.url(f"/api/admin/reports/{urllib.parse.quote(report_id)}/status"),
            body={"status": status_value},
            headers=self.staff_headers(),
        )
        if status >= 400:
            print(f"Status update failed ({status}): {payload}")
            return False
        updated = parse_report(payload) or {}
        print(
            f"Updated {updated.get('tracking_id') or report_id} → "
            f"{updated.get('status') or status_value}"
        )
        return True

    def reports_with_status(self, wanted: str) -> list[dict[str, Any]]:
        return [report for report in self.fetch_reports() if report.get("status") == wanted and report.get("id")]

    def dispatch_next(self, count: int = 1) -> None:
        queued = [r for r in self.reports_with_status("queued")]
        if not queued:
            print("No queued reports with an internal id.")
            return
        for report in queued[:count]:
            self.patch_status(report["id"], "in_progress")

    def resolve_next(self, count: int = 1) -> None:
        open_work = [r for r in self.reports_with_status("in_progress")]
        if not open_work:
            print("No in-progress reports with an internal id.")
            return
        for report in open_work[:count]:
            self.patch_status(report["id"], "resolved")

    def apply_status_mix(self, reports: list[dict[str, Any]]) -> None:
        if not reports or not self.ensure_staff():
            return
        workable = [r for r in reports if r.get("id")]
        if not workable:
            print("Created reports had no internal ids; skip status mix.")
            return
        random.shuffle(workable)
        total = len(workable)
        reject_count = max(1, total // 25)
        resolve_count = max(4, int(total * 0.38))
        progress_count = max(4, int(total * 0.28))
        rejected: list[dict[str, Any]] = []
        resolved: list[dict[str, Any]] = []
        in_progress: list[dict[str, Any]] = []
        remaining = list(workable)
        for report in remaining:
            if len(rejected) >= reject_count:
                break
            if report.get("severity") in {"low", "medium"} and report.get("issue_type") in {
                "noise_complaint",
                "parking_meter",
                "graffiti",
                "other",
            }:
                rejected.append(report)
        for report in remaining:
            if report in rejected or report in resolved or report in in_progress:
                continue
            if len(resolved) < resolve_count:
                resolved.append(report)
            elif len(in_progress) < progress_count:
                in_progress.append(report)
        for report in rejected:
            self.patch_status(report["id"], "rejected")
        for report in in_progress:
            self.patch_status(report["id"], "in_progress")
        for report in resolved:
            self.patch_status(report["id"], "in_progress")
            self.patch_status(report["id"], "resolved")
        queued_left = total - len(rejected) - len(in_progress) - len(resolved)
        print(
            f"Status mix: {queued_left} queued, {len(in_progress)} in progress, "
            f"{len(resolved)} resolved, {len(rejected)} rejected."
        )

    def seed(self, count: int, mix_status: bool) -> None:
        planned = build_seed_plan(count)
        types = {item[0]["issue_type"] for item in planned}
        print(
            f"Seeding {len(planned)} reports ({len(types)} issue types, "
            f"{len(LOCATIONS)} mapped areas) → {self.config.api_base}"
        )
        created: list[dict[str, Any]] = []
        for template, location in planned:
            report = self.create_report(template, location)
            if report:
                created.append(report)
            time.sleep(0.12)
        print(f"Created {len(created)} reports.")
        if mix_status:
            self.apply_status_mix(created)

    def drip(self, count: int) -> None:
        print(f"Dripping {count} reports every {self.config.interval:.1f}s. Ctrl+C to stop.")
        filed = 0
        pool = list(ISSUE_TEMPLATES)
        random.shuffle(pool)
        try:
            while filed < count:
                template = dict(pool[filed % len(pool)])
                if random.random() < 0.08:
                    template = dict(random.choice(ISSUE_TEMPLATES))
                location = jitter_location(random.choice(LOCATIONS), 0.0006)
                self.create_report(template, location)
                filed += 1
                if filed < count:
                    time.sleep(self.config.interval)
        except KeyboardInterrupt:
            print("\nDrip stopped.")
        print(f"Drip filed {filed} reports.")

    def file_custom(self) -> None:
        types = sorted(unique_issue_types())
        print("Issue types: " + ", ".join(types))
        issue_type = input("Type [pothole]: ").strip() or "pothole"
        severity = input("Severity low|medium|high [high]: ").strip() or "high"
        if severity not in {"low", "medium", "high"}:
            severity = "medium"
        print("Locations:")
        for index, place in enumerate(LOCATIONS, start=1):
            print(f"  {index}. {place['description']}")
        print("  0. Unmapped (no coordinates)")
        choice = input("Location number [2]: ").strip() or "2"
        try:
            selected = int(choice)
        except ValueError:
            selected = 2
        if selected == 0:
            location: dict[str, Any] | None = {"description": input("Place label: ").strip() or UNMAPPED_PLACES[0]}
        else:
            location = jitter_location(LOCATIONS[(max(1, selected) - 1) % len(LOCATIONS)])
        title = input("Title: ").strip() or f"{issue_type.replace('_', ' ').title()} reported by a citizen"
        description = input("Description: ").strip() or title
        template = {
            "issue_type": issue_type.replace(" ", "_").replace("-", "_").lower(),
            "severity": severity,
            "title": title,
            "description": description,
            "recommended_action": "Inspect the site and take the appropriate field action.",
            "transcript": description,
        }
        self.create_report(template, location)


def print_menu() -> None:
    print(
        "\n"
        "1  Seed scene\n"
        "2  Live drip\n"
        "3  File custom\n"
        "4  Dispatch next queued → in_progress\n"
        "5  Close next in_progress → resolved\n"
        "6  List reports\n"
        "7  Health\n"
        "q  Quit"
    )


def run_repl(feeder: Feeder) -> None:
    print(f"CityFix demo feeder → {feeder.config.api_base}")
    print("Refresh /admin after filing so the map and insights pick up new reports.")
    while True:
        print_menu()
        choice = input("> ").strip().lower()
        if choice in {"q", "quit", "exit"}:
            return
        if choice == "1":
            raw = input(f"How many reports [{DEFAULT_SEED_COUNT}]: ").strip() or str(DEFAULT_SEED_COUNT)
            try:
                count = max(12, int(raw))
            except ValueError:
                count = DEFAULT_SEED_COUNT
            mix = (input("Apply staff status mix? [Y/n]: ").strip().lower() or "y") != "n"
            feeder.seed(count, mix)
        elif choice == "2":
            raw = input("How many drips [8]: ").strip() or "8"
            interval = input(f"Seconds between reports [{feeder.config.interval:g}]: ").strip()
            try:
                count = max(1, int(raw))
            except ValueError:
                count = 8
            if interval:
                try:
                    feeder.config.interval = max(0.5, float(interval))
                except ValueError:
                    pass
            feeder.drip(count)
        elif choice == "3":
            feeder.file_custom()
        elif choice == "4":
            feeder.dispatch_next(1)
        elif choice == "5":
            feeder.resolve_next(1)
        elif choice == "6":
            feeder.list_reports()
        elif choice == "7":
            feeder.health()
        else:
            print("Unknown choice.")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Feed demo civic reports into the CityFix API.")
    parser.add_argument("--api-base", default="")
    parser.add_argument("--staff-email", default="")
    parser.add_argument("--staff-password", default="")
    parser.add_argument("--supabase-url", default="")
    parser.add_argument("--supabase-key", default="")
    parser.add_argument("--seed", type=int, metavar="N", help="File N reports then exit.")
    parser.add_argument("--no-status-mix", action="store_true", help="Skip staff status mix after seed.")
    parser.add_argument("--drip", type=int, metavar="N", help="File N reports on an interval.")
    parser.add_argument("--interval", type=float, default=4.0, help="Seconds between drip reports.")
    parser.add_argument("--dispatch", type=int, metavar="N", help="Move N queued reports to in_progress.")
    parser.add_argument("--resolve", type=int, metavar="N", help="Move N in-progress reports to resolved.")
    parser.add_argument("--list", action="store_true", help="List admin reports then exit.")
    parser.add_argument("--health", action="store_true", help="Call /api/health then exit.")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    config = Config(args)
    if not config.api_base:
        print("No API base URL configured.")
        return 1
    feeder = Feeder(config)
    one_shot = any(
        [
            args.seed is not None,
            args.drip is not None,
            args.dispatch is not None,
            args.resolve is not None,
            args.list,
            args.health,
        ]
    )
    if not one_shot:
        run_repl(feeder)
        return 0
    if args.health:
        feeder.health()
    if args.seed is not None:
        feeder.seed(max(12, args.seed), mix_status=not args.no_status_mix)
    if args.drip is not None:
        feeder.drip(max(1, args.drip))
    if args.dispatch is not None:
        feeder.dispatch_next(max(1, args.dispatch))
    if args.resolve is not None:
        feeder.resolve_next(max(1, args.resolve))
    if args.list:
        feeder.list_reports()
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("\nStopped.")
        raise SystemExit(130)

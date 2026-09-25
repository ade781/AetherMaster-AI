"""
Script otomatis untuk meregenerasi 11 background AetherMaster AI yang tersisa:
bg_19 s.d bg_29 beserta covers terkait.
"""

BACKGROUND_PROMPTS = {
    "bg_19_shadowfell_citadel": {
        "name": "bg_19_shadowfell_citadel.png",
        "cover": "cover_shadowfell.jpg",
        "prompt": "Cinematic dark fantasy visual novel landscape background of the Shadowfell citadel. An imposing gothic fortress with colossal jagged spires made of black obsidian stone piercing a gloomy ash-choked monochromatic sky, an ominous eclipse with a dark sun surrounded by a violet-black corona of negative energy, wisps of ghostly black shadow mist drifting along crumbling stone bridges and abyssal chasms, dark gothic fantasy aesthetic, moody atmospheric lighting, 8k digital painting, wide angle, no characters, no people, 16:9 aspect ratio."
    },
    "bg_20_pirate_ship_deck": {
        "name": "bg_20_pirate_ship_deck.png",
        "cover": None,
        "prompt": "Cinematic dark fantasy visual novel landscape background of a pirate galleon ship deck caught in a violent tempest storm on the high seas. Weathered wet wooden deck planks, massive wooden masts with tattered black sails whipping in howling gale winds, colossal rolling ocean storm waves crashing against the hull, violent jagged white lightning illuminating the stormy dark ocean, dramatic cinematic angle, 8k digital painting, high fantasy art, wide view, no characters, no people, 16:9 aspect ratio."
    },
    "bg_21_goblin_war_camp": {
        "name": "bg_21_goblin_war_camp.png",
        "cover": "cover_goblin.jpg",
        "prompt": "Cinematic dark fantasy visual novel landscape background of a brutal goblin war camp at night. Crude wooden palisade watchtowers barbed with spikes, rugged leather tents patched with beast fur, smoking bonfires and flickering torchlights casting orange embers, wooden totems mounted with animal and beast skulls, scattered iron spears and scrap weapons, muddy trampled ground, gritty dark fantasy atmosphere, 8k digital painting, wide angle, no characters, no people, 16:9 aspect ratio."
    },
    "bg_22_crystal_mines": {
        "name": "bg_22_crystal_mines.png",
        "cover": "cover_crystal.jpg",
        "prompt": "Cinematic dark fantasy visual novel interior background of a subterranean crystal mine cavern. Colossal jagged clusters of glowing purple aether amethyst and bioluminescent sapphire crystals protruding from damp cavern walls, minecart wooden rails winding along stone chasms, warm flickering lanterns mounted on timber support beams reflecting iridescent magical prismatic facets, 8k digital painting, high fantasy art, wide angle, no characters, no people, 16:9 aspect ratio."
    },
    "bg_23_dungeon_torture_chamber": {
        "name": "bg_23_dungeon_torture_chamber.png",
        "cover": "cover_dungeon.jpg",
        "prompt": "Cinematic dark fantasy visual novel interior background of a grim medieval castle dungeon and torture chamber. Mossy damp flagstone walls, heavy rusted iron cage bars hanging from vaulted stone arches, iron maiden and hanging iron chains, a glowing wall brazier with burning red coals, damp cobblestone floor with drainage grates, ominous shadows and grimdark horror atmosphere, 8k digital painting, wide angle, no characters, no people, 16:9 aspect ratio."
    },
    "bg_24_feywild_glade": {
        "name": "bg_24_feywild_glade.png",
        "cover": "cover_fey.jpg",
        "prompt": "Cinematic dark fantasy visual novel landscape background of an enchanted twilight Feywild forest glade. Enormous glowing iridescent mushrooms and bioluminescent rainbow flowers blooming in lush mossy grass, ancient weeping willow trees with glittering silver leaves, floating magical fae orbs and glowing fireflies in misty purple and emerald dusk air, magical ethereal wonder, 8k digital painting, high fantasy concept art, wide angle, no characters, no people, 16:9 aspect ratio."
    },
    "bg_25_abandoned_cathedral": {
        "name": "bg_25_abandoned_cathedral.png",
        "cover": "cover_cathedral.jpg",
        "prompt": "Cinematic dark fantasy visual novel interior background of a colossal ruined gothic cathedral. Partially collapsed vaulted stone ceiling with dramatic god rays of golden afternoon sun piercing through dusty air, crumbling marble altar overgrown with ivy and wild creeping vines, broken stained glass windows scattering colorful jewel light across stone pews, solemn majestic ruins, 8k digital painting, wide angle, no characters, no people, 16:9 aspect ratio."
    },
    "bg_26_clockwork_vault": {
        "name": "bg_26_clockwork_vault.png",
        "cover": "cover_clockwork.jpg",
        "prompt": "Cinematic steampunk dark fantasy visual novel interior background of an ancient mechanus clockwork vault. Colossal interlocking bronze and brass cogs and gears rotating in precision, brass steam pipes with venting white steam, giant swinging brass clock pendulum, intricate gold astrolabe dials and mechanical levers, warm ambient lantern light glinting on polished metallic machinery, 8k digital painting, wide angle, no characters, no people, 16:9 aspect ratio."
    },
    "bg_27_dragon_hoard": {
        "name": "bg_27_dragon_hoard.png",
        "cover": None,
        "prompt": "Cinematic dark fantasy visual novel interior background of a colossal dragon treasure hoard cave. Mountains of sparkling gold coins, overflowing jewel-encrusted chests, ancient silver chalices, glowing gemstone crowns and legendary mythical swords embedded in hills of gold, stalactites hanging from smoky cavern roof illuminated by shimmering gold reflections and faint embers, epic fantasy hoard, 8k digital painting, wide angle, no characters, no people, 16:9 aspect ratio."
    },
    "bg_28_city_market_alley": {
        "name": "bg_28_city_market_alley.png",
        "cover": None,
        "prompt": "Cinematic dark fantasy visual novel landscape background of a narrow medieval city market alley at rainy night. Wet glistening cobblestone streets reflecting amber gas lamps and hanging oil lanterns, rustic timber-framed gothic merchant houses with colorful canvas canopies and awnings, wooden carts with barrels and fruit crates, misty rain drizzle in cool atmospheric night air, urban fantasy scene, 8k digital painting, wide angle, no characters, no people, 16:9 aspect ratio."
    },
    "bg_29_abyssal_rift": {
        "name": "bg_29_abyssal_rift.png",
        "cover": "cover_abyssal.jpg",
        "prompt": "Cinematic dark fantasy visual novel landscape background of an abyssal dimensional rift tearing through reality. A colossal swirling cosmic vortex of pure void darkness bordered by tendrils of chaotic violet and magenta magical energy, shattered floating obsidian landmasses drifting into the gravity well, distant cosmic nebulae and collapsing stars, epic cosmic horror and high fantasy rift, 8k digital painting, wide angle, no characters, no people, 16:9 aspect ratio."
    }
}

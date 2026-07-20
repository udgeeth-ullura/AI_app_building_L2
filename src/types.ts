export interface Era {
  id: string;
  name: string;
  description: string;
  timePeriod: string;
  suggestedPrompt: string;
  defaultPrompt: string; // Used to generate the historical scene
  avatarEmoji: string;
  presetStickers: Array<{
    id: string;
    name: string;
    emoji: string;
    scale?: number;
  }>;
}

export interface TimeTravelPhoto {
  id: string;
  timestamp: number;
  eraId: string;
  eraName: string;
  sourcePhotoUrl: string; // Base64 of snapped/uploaded face
  resultPhotoUrl: string; // Base64 of final composite or AI edit
  analysisText: string;  // Analysis of original face
  promptUsed: string;    // Custom or default prompt used for generation
}

export interface StickerInstance {
  id: string;
  name: string;
  emoji: string;
  x: number; // percentage of canvas (0 to 100)
  y: number; // percentage of canvas (0 to 100)
  scale: number; // multiplier (e.g., 1.0)
  rotation: number; // degrees
}

export interface ImageBlendSettings {
  filterType: 'none' | 'sepia' | 'vintage' | 'bw' | 'renaissance' | 'steampunk' | 'popart';
  opacity: number; // 0 to 1
  brightness: number; // 0.5 to 1.5
  contrast: number; // 0.5 to 1.5
  blur: number; // 0 to 5
}

export const HISTORICAL_ERAS: Era[] = [
  {
    id: 'egypt',
    name: 'Ancient Egypt',
    timePeriod: 'c. 2500 BCE',
    description: 'Stand as a high dignitary or architect during the Golden Age of Pyramids.',
    suggestedPrompt: 'A powerful Egyptian Pharaoh or Noble standing in front of the Great Sphinx of Giza, adorned in traditional golden and turquoise collars (shebyu), white linen robes, and a royal nemes headdress, in a realistic, majestic oil painting style.',
    defaultPrompt: 'A stunning, high-quality, photorealistic cinematic depiction of the construction of the Great Pyramids of Giza under a brilliant golden sun, ancient Egyptian palace terrace in the foreground, highly detailed, dramatic lighting.',
    avatarEmoji: '👑',
    presetStickers: [
      { id: 'nemes', name: 'Pharaoh Nemes Headdress', emoji: '🔱', scale: 1.5 },
      { id: 'ankh', name: 'Ankh Scepter', emoji: '☥' },
      { id: 'cat', name: 'Egyptian Mau Cat', emoji: '🐈' },
      { id: 'scarab', name: 'Sacred Scarab', emoji: '🪲' }
    ]
  },
  {
    id: 'medieval',
    name: 'Medieval Knight',
    timePeriod: 'c. 1200 CE',
    description: 'Adorn heavy steel armor and guard a grand stone fortress.',
    suggestedPrompt: 'A brave medieval knight in full shining silver plate armor, holding a large steel sword, standing on a castle rampart during sunset, banner waving, realistic high fantasy digital illustration, medieval style.',
    defaultPrompt: 'The majestic interior of a gothic medieval castle banquet hall, towering stained glass windows filtering colorful evening light, stone arches, tapestries, flaming torches, cinematic composition.',
    avatarEmoji: '🛡️',
    presetStickers: [
      { id: 'helmet', name: 'Knight Helmet', emoji: '🪖', scale: 1.2 },
      { id: 'sword', name: 'Excalibur Sword', emoji: '⚔️' },
      { id: 'shield', name: 'Royal Shield', emoji: '🛡️' },
      { id: 'crown', name: 'Golden Crown', emoji: '👑' }
    ]
  },
  {
    id: 'renaissance',
    name: 'Renaissance Master',
    timePeriod: 'c. 1500 CE',
    description: 'Step into a Florentine studio as a wealthy patron or classical painter.',
    suggestedPrompt: 'A high-society Florentine noble patron of the arts, dressed in luxurious deep red velvet and dark fur robes, sitting in a studio filled with unfinished fresco paintings, classic chiaroscuro lighting, Da Vinci painting style.',
    defaultPrompt: 'A beautiful 16th-century Italian art atelier, easel with a canvas, plaster sculptures, sunlight streaming through a large arched window overlooking Florence, soft atmospheric haze, renaissance painting texture.',
    avatarEmoji: '🎨',
    presetStickers: [
      { id: 'palette', name: 'Artist Palette', emoji: '🎨' },
      { id: 'beret', name: 'Renaissance Hat', emoji: '🎩' },
      { id: 'scroll', name: 'Sealed Parchment', emoji: '📜' },
      { id: 'feather', name: 'Quill Pen', emoji: '🪶' }
    ]
  },
  {
    id: 'steampunk',
    name: 'Victorian Steampunk',
    timePeriod: 'c. 1888 CE',
    description: 'Unleash your inner inventor with brass gears and coal-powered airships.',
    suggestedPrompt: 'A dashing Victorian steampunk inventor wearing brass-gilded goggles, a leather aviator cap, a rich velvet waistcoat with golden chains, standing in front of a giant ticking brass clockwork mechanism, hyper-detailed retro-futuristic style.',
    defaultPrompt: 'An epic steampunk metropolis skylight, giant floating copper airships and zeppelins amidst coal-steam smoke and golden sunlight, intricate clock towers, industrial brass machinery, cinematic.',
    avatarEmoji: '⚙️',
    presetStickers: [
      { id: 'goggles', name: 'Steampunk Goggles', emoji: '🽽', scale: 1.1 },
      { id: 'tophat', name: 'Gilded Top Hat', emoji: '🎩', scale: 1.3 },
      { id: 'gear', name: 'Pocket Clockwork', emoji: '⚙️' },
      { id: 'pipe', name: 'Bubble Pipe', emoji: '💨' }
    ]
  },
  {
    id: 'space',
    name: 'Apollo Astronaut',
    timePeriod: '1969 CE',
    description: 'Embark on humanity\'s greatest voyage and plant your flag on the lunar dust.',
    suggestedPrompt: 'A brave astronaut inside a heavy Apollo space suit, standing on the dusty grey lunar surface with the beautiful planet Earth visible as a blue marble in the dark cosmic background, reflections on helmet visor, cinematic photography.',
    defaultPrompt: 'A wide angle view of the dramatic grey lunar landscape, deep black sky with millions of sparkling stars, the Lunar Module lander standing on the dust, bright harsh sunlight casting long black shadows.',
    avatarEmoji: '🚀',
    presetStickers: [
      { id: 'helmet', name: 'Space Helmet Visor', emoji: '🧑‍🚀', scale: 1.4 },
      { id: 'flag', name: 'American Flag', emoji: '🇺🇸' },
      { id: 'rocket', name: 'Saturn V Rocket', emoji: '🚀' },
      { id: 'earth', name: 'Mini Earth', emoji: '🌍' }
    ]
  },
  {
    id: 'viking',
    name: 'Viking Voyager',
    timePeriod: 'c. 900 CE',
    description: 'Ride the stormy northern seas in search of uncharted lands.',
    suggestedPrompt: 'A fierce Norse viking warrior with braided hair, clad in leather, fur, and dark chainmail armor, holding a battleaxe, standing at the bow of a longship sailing through a stormy grey sea with fjords in the background, epic cinematic lighting.',
    defaultPrompt: 'An atmospheric viking settlement nestled inside a grand Norwegian fjord, longhouses with smoking stone chimneys, carved wooden dragon totems, soft morning fog, misty mountains in the background.',
    avatarEmoji: '⛵',
    presetStickers: [
      { id: 'horned', name: 'Viking Horned Helmet', emoji: '🪯', scale: 1.3 },
      { id: 'axe', name: 'Bearded Battleaxe', emoji: '🪓' },
      { id: 'raven', name: 'Odin\'s Raven', emoji: '🐦' },
      { id: 'mug', name: 'Drinking Horn', emoji: '🍺' }
    ]
  },
  {
    id: 'roaring20s',
    name: 'Roaring Twenties',
    timePeriod: 'c. 1925 CE',
    description: 'Jazz up your style with swing, flapper dresses, or classic dapper suits.',
    suggestedPrompt: 'A highly glamorous 1920s Gatsby partygoer dressed in an elegant silver flapper gown with feather headbands and sparkling pearl necklaces, or a sharp gentleman in a dapper tuxedo, inside a golden art deco jazz club filled with champagne.',
    defaultPrompt: 'An opulent Art Deco ballroom grand party, glistening crystal chandeliers, geometric golden and black walls, a live jazz band playing brass saxophones, shimmering glitter confetti falling, vintage warm photography.',
    avatarEmoji: '🎷',
    presetStickers: [
      { id: 'headband', name: 'Feather Headband', emoji: '🪶', scale: 1.2 },
      { id: 'saxophone', name: 'Jazz Saxophone', emoji: '🎷' },
      { id: 'glass', name: 'Champagne Coupe', emoji: '🥂' },
      { id: 'monocle', name: 'Dapper Monocle', emoji: '🧐' }
    ]
  }
];

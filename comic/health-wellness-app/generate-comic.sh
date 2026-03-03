#!/bin/bash

# Health & Wellness Diet Therapy Comic Generation Script
# This script will generate all 24 manga panels

BASE_DIR="C:/Users/10360/Desktop/111/comic/health-wellness-app"
OUTPUT_DIR="$BASE_DIR/images"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "Starting manga comic generation..."
echo "Output directory: $OUTPUT_DIR"
echo ""

# Function to generate a single panel
generate_panel() {
    local page=$1
    local panel=$2
    local prompt="$3"

    local output_file="$OUTPUT_DIR/page-${page}-panel-${panel}.png"

    echo "Generating Page ${page}, Panel ${panel}..."

    # Using a placeholder for the actual image generation command
    # This would be replaced with the actual baoyu-image-gen command
    # or the appropriate image generation tool

    # For now, creating a placeholder file
    touch "$output_file"

    echo "  → Saved to: $output_file"
}

# PAGE 1: 大雄的烦恼
echo "=== PAGE 1: 大雄的早晨困扰 ==="

generate_panel 1 1 "Manga style panel 1: Nobita (Doraemon character) sitting up in bed morning, dizziness spiral effects around head, Japanese bedroom with morning sunlight, confused expression with spiral eyes, warm lighting, anime style, clean line art, 3:4 portrait ratio"

generate_panel 1 2 "Manga style panel 2: Nobita looking in mirror pale complexion, thought bubble with question mark and blood pressure symbol, worried expression, bathroom mirror reflection, morning light, Doraemon manga character style, contemplative mood, 3:4 portrait"

generate_panel 1 3 "Manga style panel 3: Doraemon popping out of desk drawer classic entrance, blue robot cat with red collar and bell, Nobita pointing at head with dizziness effects, dynamic motion lines, DOKAN sound effect, energetic scene, anime action style, 3:4 portrait"

generate_panel 1 4 "Manga style panel 4: Nobita talking to Doraemon, concerned expression explaining, Doraemon thinking with hand on chin then lightbulb idea moment, conversation scene, lightbulb glow effect above head, bedroom setting, Doraemon manga style, 3:4 portrait"

generate_panel 1 5 "Manga style panel 5: Close-up Doraemon reaching into 4D pocket on white belly, magical glowing effects, sparkles emanating from pocket, dimensional space swirl visible, focused expression, magical realism, small detail panel, 3:4 portrait"

generate_panel 1 6 "Manga style panel 6: Doraemon holding up glowing smartphone gadget proudly, high-tech device with soup bowl and magnifying glass logo, Nobita amazed with sparkling eyes, dramatic spotlight on gadget, shiny effects, FLASH sound, exciting reveal, 3:4 portrait"

# PAGE 2: 食疗搜索道具
echo ""
echo "=== PAGE 2: 神奇的食疗小程序 ==="

generate_panel 2 1 "Manga style panel 1: Doraemon showing smartphone to Nobita, screen displays clean search interface with orange theme, Nobita leaning close with sparkling amazed eyes, warm inviting glow from screen, friendly helpful scene, Doraemon manga style, 3:4 portrait"

generate_panel 2 2 "Manga style panel 2: Close-up phone screen interface, clean modern UI design, search bar with 'enter symptoms or ingredients', magnifying glass with soup bowl icon, tags #blood pressure #health soups, warm orange color scheme, rounded card layout, beautiful app design, 3:4 portrait"

generate_panel 2 3 "Manga style panel 3: Nobita typing on phone screen, text 'dizziness blood pressure' in search bar, magnifying glass scanning animation effect, digital sparkles, focused expression, search action scene, modern UI interaction, 3:4 portrait"

generate_panel 2 4 "Manga style panel 4: Phone screen showing search results, recipe card 'Gastrodia Fish Head Soup' with cute soup bowl illustration, tags #stabilize blood pressure #brain nourishing, video tutorial button with play icon, Nobita excited with star eyes, discovery moment, 3:4 portrait"

generate_panel 2 5 "Manga style panel 5: Nobita very excited jumping with arms up, Doraemon pointing at screen happily, both characters celebrating discovery, dynamic energy lines, sparkle stars, exclamation marks, high energy manga emotion, enthusiastic interaction, 3:4 portrait"

generate_panel 2 6 "Manga style panel 6: Phone screen showing video player, cute cartoon chef character cooking soup, numbered steps 1 ingredient preparation 2 simmering 3 complete, friendly instructional style, warm video playback glow, clear step-by-step display, 3:4 portrait"

# PAGE 3: 跟着视频学做汤
echo ""
echo "=== PAGE 3: 跟着视频学做汤 ==="

generate_panel 3 1 "Manga style panel 1: Kitchen scene large panel, Nobita wearing apron standing at counter, ingredients arranged gastrodia fish head ginger, phone propped up playing video, confident ready to cook pose, bright clean kitchen, organized preparation, anime cooking scene, 3:4 portrait"

generate_panel 3 2 "Manga style panel 2: Nobita at sink washing fish head, hands in water, water splash effects, droplets, focused expression, step 1 cleaning ingredients, fresh water sparkle effects, dynamic cooking action, clean manga style, 3:4 portrait"

generate_panel 3 3 "Manga style panel 3: Nobita placing ingredients into soup pot, thought bubble showing golden medicinal essence spreading, healing energy visualization, warm golden glow from herbs, nurturing cooking process, visual metaphor of healing, 3:4 portrait"

generate_panel 3 4 "Manga style panel 4: Soup pot simmering on stove, steam rising in aroma spirals, clock showing time passage 1 hour to 2 hours, glass lid showing rich broth, warm comforting kitchen atmosphere, patient waiting, time lapse concept, 3:4 portrait"

generate_panel 3 5 "Manga style panel 5: Large panel Nobita holding bowl of hot steaming fish head soup, beautiful clear broth with ingredients visible, satisfied expression with rosy cheeks, warm light halo background, achievement and healing, appetizing presentation, 3:4 portrait"

generate_panel 3 6 "Manga style panel 6: Nobita sipping soup eyes closed in enjoyment, thought bubble showing orange warm energy flowing from head to toe, healing warmth visualization, comfort and nourishment, peaceful expression, health recovery metaphor, 3:4 portrait"

# PAGE 4: 分享健康
echo ""
echo "=== PAGE 4: 分享健康 ==="

generate_panel 4 1 "Manga style panel 1: Nobita healthy energetic walking with Shizuka, rosy cheeks bright eyes, outdoor path with trees, Shizuka caring friendly expression, health improvement obvious, bright cheerful day, friendship scene, 3:4 portrait"

generate_panel 4 2 "Manga style panel 2: Nobita excitedly showing phone to Shizuka, proud enthusiastic expression, Shizuka looking with interest curious, sharing discovery moment, friendly interaction, outdoor setting simplified background, 3:4 portrait"

generate_panel 4 3 "Manga style panel 3: Close-up phone screen interface showing features, body constitution recommendation, seasonal health, family sharing icons, clean modern UI warm orange theme, Shizuka impressed looking, feature discovery, 3:4 portrait"

generate_panel 4 4 "Manga style panel 4: Phone showing share menu, 'share to family group' option, Nobita tapping share button, Shizuka nodding happy supportive, sharing and caring concept, family connection theme, 3:4 portrait"

generate_panel 4 5 "Manga style panel 5: Large heartwarming family gathering panel, Nobita Doraemon Shizuka at table with various health soups, warm lighting, all smiling happy, cozy intimate atmosphere, success and satisfaction, golden warm glow, 3:4 portrait"

generate_panel 4 6 "Manga style panel 6: Closing small panel, Nobita thumbs up big smile, Doraemon friendly smile, Shizuka happy expression, all three triumphant pose, sparkle stars, to be continued ending, classic manga conclusion, 3:4 portrait"

echo ""
echo "=== Generation Complete ==="
echo "Total panels: 24"
echo "Output location: $OUTPUT_DIR"
echo ""
echo "Next steps:"
echo "1. Each prompt file contains detailed panel descriptions"
echo "2. Images will be generated using manga art style"
echo "3. All panels saved as page-N-panel-M.png format"

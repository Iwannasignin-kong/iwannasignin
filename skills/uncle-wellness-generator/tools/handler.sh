#!/bin/bash
# REDINK小红书内容创作工作室 Handler

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 需要安装Node.js"
    exit 1
fi

# 检查依赖
if ! node -e "require('tsx')" 2>/dev/null; then
    echo "📦 安装依赖中..."
    npm install tsx -g 2>/dev/null || {
        echo "❌ 无法安装tsx，请手动运行: npm install -g tsx"
        exit 1
    }
fi

# 解析参数
MODE=""
IMAGE=""
TITLE=""
COUNT="3"
CONTEXT=""

while [[ $# -gt 0 ]]; do
    case $1 in
        analyze|remix)
            MODE="$1"
            shift
            ;;
        -i|--image)
            IMAGE="$2"
            shift 2
            ;;
        -t|--title)
            TITLE="$2"
            shift 2
            ;;
        -c|--count)
            COUNT="$2"
            shift 2
            ;;
        --context)
            CONTEXT="$2"
            shift 2
            ;;
        *)
            if [[ -z "$MODE" ]]; then
                MODE="$1"
            elif [[ -z "$IMAGE" ]] && [[ -f "$1" ]]; then
                IMAGE="$1"
            elif [[ -z "$TITLE" ]]; then
                TITLE="$1"
            elif [[ "$1" =~ ^[0-9]+$ ]]; then
                COUNT="$1"
            fi
            shift
            ;;
    esac
done

# 执行工作流
case "$MODE" in
    analyze)
        if [[ -z "$IMAGE" ]]; then
            echo "❌ analyze模式需要指定图片路径"
            echo "用法: /redink analyze <图片路径> [备注说明]"
            exit 1
        fi
        npx tsx redink-workflow.ts analyze "$IMAGE" "$CONTEXT"
        ;;
    remix)
        if [[ -z "$IMAGE" ]]; then
            echo "❌ remix模式需要指定参考图片路径"
            echo "用法: /redink remix <图片路径> <新主题> [数量]"
            exit 1
        fi
        npx tsx redink-workflow.ts remix "$IMAGE" "$TITLE" "$COUNT"
        ;;
    *)
        echo "✨ REDINK小红书内容创作工作室"
        echo ""
        echo "可用命令:"
        echo "  analyze <图片> [备注]   - 分析参考图，提取Prompt"
        echo "  remix <图片> <主题> [n] - 二次创作（默认3张）"
        echo ""
        echo "示例:"
        echo "  /redink analyze reference.jpg"
        echo "  /redink remix reference.jpg \"春日樱花拿铁\" 3"
        ;;
esac

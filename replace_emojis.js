const fs = require('fs');

const replacements = {
    '📚': '<svg class="ui-icon"><use href="#icon-book"></use></svg>',
    '🧠': '<svg class="ui-icon"><use href="#icon-academic-cap"></use></svg>',
    '📊': '<svg class="ui-icon"><use href="#icon-chart-bar"></use></svg>',
    '🔍': '<svg class="ui-icon"><use href="#icon-search"></use></svg>',
    '📅': '<svg class="ui-icon"><use href="#icon-calendar"></use></svg>',
    '⏮': '<svg class="ui-icon"><use href="#icon-prev"></use></svg>',
    '▶': '<svg class="ui-icon" id="player-play-icon"><use href="#icon-play"></use></svg>',
    '⏭': '<svg class="ui-icon"><use href="#icon-next"></use></svg>',
    '📺': '<svg class="ui-icon" style="width: 48px; height: 48px;"><use href="#icon-video"></use></svg>',
    '💡': '<svg class="ui-icon"><use href="#icon-lightbulb"></use></svg>',
    '🎧': '<svg class="ui-icon"><use href="#icon-headphones"></use></svg>',
    '📖': '<svg class="ui-icon"><use href="#icon-book-open"></use></svg>',
    '📋': '<svg class="ui-icon"><use href="#icon-clipboard"></use></svg>',
    '✓': '<svg class="ui-icon"><use href="#icon-check"></use></svg>',
    '📭': '<svg class="ui-icon" style="width: 48px; height: 48px;"><use href="#icon-inbox"></use></svg>',
    '⚠️': '<svg class="ui-icon" style="width: 48px; height: 48px; color: var(--color-warning);"><use href="#icon-warning"></use></svg>',
    '📝': '<svg class="ui-icon" style="width: 48px; height: 48px;"><use href="#icon-edit"></use></svg>',
    '🚧': '<svg class="ui-icon" style="width: 48px; height: 48px;"><use href="#icon-construction"></use></svg>',
    '☕': '<svg class="ui-icon"><use href="#icon-coffee"></use></svg>',
    '☰': '<svg class="ui-icon"><use href="#icon-menu"></use></svg>',
};

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Special cases
    // Theme toggle
    content = content.replace(/>☀️</g, '><svg class="ui-icon" id="theme-icon"><use href="#icon-sun"></use></svg><');
    // Close button ✕
    content = content.replace(/>✕</g, '><svg class="ui-icon"><use href="#icon-x"></use></svg><');

    for (const [emoji, svg] of Object.entries(replacements)) {
        content = content.split(emoji).join(svg);
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Processed', filePath);
}

replaceInFile('/home/bin-naqeeb/Documents/BulughMemo/index.html');
replaceInFile('/home/bin-naqeeb/Documents/BulughMemo/js/renderer.js');
replaceInFile('/home/bin-naqeeb/Documents/BulughMemo/js/memorization.js');
replaceInFile('/home/bin-naqeeb/Documents/BulughMemo/js/sharh.js');
replaceInFile('/home/bin-naqeeb/Documents/BulughMemo/js/search.js');
replaceInFile('/home/bin-naqeeb/Documents/BulughMemo/js/app.js');


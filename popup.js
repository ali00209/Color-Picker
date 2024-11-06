const storage = {
  async get(key) {
    // Check if running in extension context
    if (typeof browser !== 'undefined') {
      return await browser.storage.local.get(key);
    }
    // Fallback to localStorage for web context
    try {
      const item = localStorage.getItem(key);
      return item ? { [key]: JSON.parse(item) } : {};
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return {};
    }
  },

  async set(data) {
    // Check if running in extension context
    if (typeof browser !== 'undefined') {
      return await browser.storage.local.set(data);
    }
    // Fallback to localStorage for web context
    try {
      for (const [key, value] of Object.entries(data)) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }
};

class ColorPicker {
  constructor() {
    this.initializeDOMReferences();
    this.initializeColorSync();
    
    this.initializeEventListeners();
    this.loadColorHistory();
    this.setInitialColor();
    this.initializeColorModels();
    this.initializeTabs();
    this.initializeBlending();
    this.initializeHarmonies();
    this.initializePalettes();
    this.initializeSliders();
    this.initializeExportOptions();
    
    this.initializeCustomization();
    this.loadUserPreferences();
    this.initializeColorLibrary();
    this.initializeTrendingColors();
    this.initializeColorInfo();
    this.initializePalettePreview();
  }

  initializeDOMReferences() {
    this.colorPicker = document.getElementById('colorPicker');
    this.colorDisplay = document.getElementById('colorDisplay');
    this.copyNotification = document.getElementById('copyNotification');
    this.formatButtons = document.querySelectorAll('.format-btn');
    
    this.themeBtn = document.getElementById('toggleTheme');
    this.sizeBtn = document.getElementById('toggleSize');
    this.layoutBtn = document.getElementById('toggleLayout');
    
    this.currentFormat = 'hex';
    this.maxHistoryItems = 10;
    this.colorHistory = [];
    this.currentHarmony = 'complementary';
    this.savedPalettes = [];
  }

  async initializeEventListeners() {
    this.colorPicker.addEventListener('input', (e) => this.handleColorChange(e));
    
    this.formatButtons.forEach(btn => {
      btn.addEventListener('click', (e) => this.changeFormat(e.target.dataset.format));
    });
  }

  async setInitialColor() {
    const initialColor = '#ff0000';
    this.colorPicker.value = initialColor;
    this.updateColorDisplay(initialColor);
  }

  async loadColorHistory() {
    try {
      const result = await storage.get('colorHistory');
      this.colorHistory = result.colorHistory || [];
      this.renderColorHistory();
    } catch (error) {
      console.error('Error loading color history:', error);
    }
  }

  async handleColorChange(e) {
    const color = e.target.value;
    await this.updateColorDisplay(color);
    this.updateHarmonyDisplay();
    await this.addToHistory(color);
  }

  async updateColorDisplay(color) {
    let alpha = 1;
    if (this.alphaSlider) {
      alpha = parseInt(this.alphaSlider.value) / 100;
    }

    const rgb = this.hexToRgbArray(color);
    const rgba = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
    
    this.colorDisplay.style.backgroundColor = rgba;
    this.colorPicker.value = color;
    
    this.updateColorValue(color);
    this.updateColorInfo(color);
    this.updatePalettePreview(color);
  }

  updateColorValue(color) {
    let displayValue;
    switch (this.currentFormat) {
      case 'rgb':
        displayValue = this.hexToRgb(color);
        break;
      case 'hsl':
        displayValue = this.hexToHsl(color);
        break;
      case 'cmyk':
        displayValue = this.hexToCmyk(color);
        break;
      default:
        displayValue = color;
    }
    this.colorDisplay.value = displayValue;
    this.updateColorInputs(color);
    this.updateHarmonies(color);
  }

  async addToHistory(color) {
    if (!this.colorHistory.includes(color)) {
      this.colorHistory.unshift(color);
      if (this.colorHistory.length > this.maxHistoryItems) {
        this.colorHistory.pop();
      }
      await this.saveColorHistory();
      this.renderColorHistory();
    }
  }

  async saveColorHistory() {
    try {
      await storage.set({ colorHistory: this.colorHistory });
    } catch (error) {
      console.error('Error saving color history:', error);
    }
  }

  renderColorHistory() {
    const container = document.getElementById('colorHistory');
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    
    this.colorHistory.forEach(color => {
      const element = document.createElement('div');
      element.className = 'history-color';
      element.style.backgroundColor = this.sanitizeColor(color);
      element.title = this.sanitizeColor(color);
      element.addEventListener('click', () => {
        this.colorPicker.value = color;
        this.updateColorDisplay(color);
      });
      container.appendChild(element);
    });
  }

  async copyToClipboard() {
    try {
      await navigator.clipboard.writeText(this.colorDisplay.value);
      this.showCopyNotification();
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }

  showCopyNotification() {
    const notification = this.copyNotification;
    notification.style.display = 'flex';
    notification.classList.remove('hiding');
    
    setTimeout(() => {
      notification.classList.add('hiding');
      setTimeout(() => {
        notification.style.display = 'none';
        notification.classList.remove('hiding');
      }, 300); // Match animation duration
    }, 1500);
  }

  changeFormat(format) {
    this.currentFormat = format;
    this.formatButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.format === format);
    });
    this.updateColorValue(this.colorDisplay.value);
  }

  hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${r}, ${g}, ${b})`;
  }

  hexToHsl(hex) {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  }

  initializeColorModels() {
    this.colorModels = {
      rgb: { min: [0, 0, 0], max: [255, 255, 255] },
      hsl: { min: [0, 0, 0], max: [360, 100, 100] },
      cmyk: { min: [0, 0, 0, 0], max: [100, 100, 100, 100] }
    };

    this.initializeColorInputs();
  }

  initializeColorInputs() {
    document.querySelectorAll('.color-input-group input').forEach(input => {
      input.addEventListener('input', (e) => this.handleColorInputChange(e));
    });
  }

  initializeTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });
  }

  initializeBlending() {
    this.blendColor1 = document.getElementById('blendColor1');
    this.blendColor2 = document.getElementById('blendColor2');
    this.blendResult = document.getElementById('blendResult');
    this.blendMode = document.getElementById('blendMode');

    this.blendColor1.addEventListener('click', () => this.selectBlendColor(1));
    this.blendColor2.addEventListener('click', () => this.selectBlendColor(2));
    this.blendMode.addEventListener('change', () => this.updateBlend());
  }

  switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabId}Tab`);
    });
  }

  updateColorInputs(color) {
    const rgb = this.hexToRgbArray(color);
    const hsl = this.hexToHslArray(color);
    
    document.querySelectorAll('#rgbInputs input').forEach((input, i) => {
      input.value = rgb[i];
    });
    
    document.querySelectorAll('#hslInputs input').forEach((input, i) => {
      input.value = hsl[i];
    });
  }

  updateHarmonies(color) {
    const hsl = this.hexToHslArray(color);
    
    // Create an object to store all harmony colors
    const harmonies = {
      complementary: document.getElementById('complementary'),
      analogous1: document.getElementById('analogous1'),
      analogous2: document.getElementById('analogous2'),
      tetradic1: document.getElementById('tetradic1'),
      tetradic2: document.getElementById('tetradic2'),
      split1: document.getElementById('split1'),
      split2: document.getElementById('split2')
    };

    // Only update if elements exist
    if (harmonies.complementary) {
      harmonies.complementary.style.backgroundColor = this.hslToHex([(hsl[0] + 180) % 360, hsl[1], hsl[2]]);
    }
    
    if (harmonies.analogous1 && harmonies.analogous2) {
      harmonies.analogous1.style.backgroundColor = this.hslToHex([(hsl[0] + 30) % 360, hsl[1], hsl[2]]);
      harmonies.analogous2.style.backgroundColor = this.hslToHex([(hsl[0] - 30 + 360) % 360, hsl[1], hsl[2]]);
    }
    
    if (harmonies.tetradic1 && harmonies.tetradic2) {
      harmonies.tetradic1.style.backgroundColor = this.hslToHex([(hsl[0] + 90) % 360, hsl[1], hsl[2]]);
      harmonies.tetradic2.style.backgroundColor = this.hslToHex([(hsl[0] + 270) % 360, hsl[1], hsl[2]]);
    }
    
    if (harmonies.split1 && harmonies.split2) {
      harmonies.split1.style.backgroundColor = this.hslToHex([(hsl[0] + 150) % 360, hsl[1], hsl[2]]);
      harmonies.split2.style.backgroundColor = this.hslToHex([(hsl[0] + 210) % 360, hsl[1], hsl[2]]);
    }
  }

  selectBlendColor(number) {
    const color = this.colorDisplay.value;
    if (number === 1) {
      this.blendColor1.style.backgroundColor = color;
    } else {
      this.blendColor2.style.backgroundColor = color;
    }
    this.updateBlend();
  }

  updateBlend() {
    const color1 = this.blendColor1.style.backgroundColor;
    const color2 = this.blendColor2.style.backgroundColor;
    if (!color1 || !color2) return;

    const rgb1 = this.parseRgb(color1);
    const rgb2 = this.parseRgb(color2);
    const blendedColor = this.blendColors(rgb1, rgb2, this.blendMode.value);
    this.blendResult.style.backgroundColor = `rgb(${blendedColor.join(',')})`;
  }

  blendColors(rgb1, rgb2, mode) {
    switch (mode) {
      case 'multiply':
        return rgb1.map((c, i) => (c * rgb2[i]) / 255);
      case 'screen':
        return rgb1.map((c, i) => 255 - ((255 - c) * (255 - rgb2[i])) / 255);
      case 'overlay':
        return rgb1.map((c, i) => {
          return c < 128
            ? (2 * c * rgb2[i]) / 255
            : 255 - (2 * (255 - c) * (255 - rgb2[i])) / 255;
        });
      case 'darken':
        return rgb1.map((c, i) => Math.min(c, rgb2[i]));
      case 'lighten':
        return rgb1.map((c, i) => Math.max(c, rgb2[i]));
      default:
        return rgb1;
    }
  }

  hexToCmyk(hex) {
    const rgb = this.hexToRgbArray(hex);
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;

    const k = 1 - Math.max(r, g, b);
    const c = (1 - r - k) / (1 - k);
    const m = (1 - g - k) / (1 - k);
    const y = (1 - b - k) / (1 - k);

    return `cmyk(${Math.round(c * 100)}%, ${Math.round(m * 100)}%, ${Math.round(y * 100)}%, ${Math.round(k * 100)}%)`;
  }

  hexToRgbArray(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  }

  hexToHslArray(hex) {
    let [r, g, b] = this.hexToRgbArray(hex).map(x => x / 255);

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return [
      Math.round(h * 360),
      Math.round(s * 100),
      Math.round(l * 100)
    ];
  }

  hslToHex([h, s, l]) {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    const toHex = x => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  parseRgb(rgbString) {
    const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return [
        parseInt(match[1]),
        parseInt(match[2]),
        parseInt(match[3])
      ];
    }
    return [0, 0, 0];
  }

  handleColorInputChange(e) {
    const input = e.target;
    const value = parseInt(input.value);
    const colorType = input.parentElement.id === 'rgbInputs' ? 'rgb' : 'hsl';
    
    if (isNaN(value) || value < parseInt(input.min) || value > parseInt(input.max)) {
      return;
    }

    const inputs = input.parentElement.querySelectorAll('input');
    const values = Array.from(inputs).map(inp => parseInt(inp.value));

    let color;
    if (colorType === 'rgb') {
      color = '#' + values.map(v => {
        const hex = v.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
    } else {
      color = this.hslToHex(values);
    }

    this.updateColorDisplay(color);
  }

  initializeHarmonies() {
    // Initialize harmony buttons
    document.querySelectorAll('.harmony-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.currentHarmony = e.target.dataset.harmony;
        this.updateHarmonyButtons();
        this.updateHarmonyDisplay();
      });
    });

    // Initialize save button if it exists
    const saveButton = document.getElementById('saveToPalette');
    if (saveButton) {
      saveButton.addEventListener('click', () => {
        this.saveCurrentHarmonyAsPalette();
      });
    }

    // Initial harmony display update
    this.updateHarmonyDisplay();
  }

  initializePalettes() {
    this.loadSavedPalettes();
    
    const createButton = document.getElementById('createPalette');
    const exportButton = document.getElementById('exportPalettes');
    
    createButton.addEventListener('click', () => this.createNewPalette());
    exportButton.addEventListener('click', () => this.exportPalettes());
  }

  updateHarmonyButtons() {
    document.querySelectorAll('.harmony-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.harmony === this.currentHarmony);
    });
  }

  updateHarmonyDisplay() {
    const colors = this.generateHarmonyColors();
    const display = document.getElementById('harmonyDisplay');
    
    while (display.firstChild) {
      display.removeChild(display.firstChild);
    }

    colors.forEach(color => {
      const div = document.createElement('div');
      div.className = 'harmony-color';
      div.style.backgroundColor = this.sanitizeColor(color);
      div.dataset.color = this.sanitizeColor(color);
      div.addEventListener('click', () => {
        this.colorDisplay.value = color;
        this.updateColorDisplay(color);
      });
      display.appendChild(div);
    });
  }

  generateHarmonyColors() {
    const baseHsl = this.hexToHslArray(this.colorDisplay.value);
    const [h, s, l] = baseHsl;
    
    switch (this.currentHarmony) {
      case 'complementary':
        return [
          this.colorDisplay.value,
          this.hslToHex([(h + 180) % 360, s, l])
        ];
      
      case 'analogous':
        return [
          this.hslToHex([(h - 30 + 360) % 360, s, l]),
          this.colorDisplay.value,
          this.hslToHex([(h + 30) % 360, s, l])
        ];
      
      case 'triadic':
        return [
          this.colorDisplay.value,
          this.hslToHex([(h + 120) % 360, s, l]),
          this.hslToHex([(h + 240) % 360, s, l])
        ];
      
      case 'tetradic':
        return [
          this.colorDisplay.value,
          this.hslToHex([(h + 90) % 360, s, l]),
          this.hslToHex([(h + 180) % 360, s, l]),
          this.hslToHex([(h + 270) % 360, s, l])
        ];
      
      case 'split':
        return [
          this.colorDisplay.value,
          this.hslToHex([(h + 150) % 360, s, l]),
          this.hslToHex([(h + 210) % 360, s, l])
        ];
      
      default:
        return [this.colorDisplay.value];
    }
  }

  async saveCurrentHarmonyAsPalette() {
    const name = prompt('Enter palette name:', 'My Palette');
    if (!name) return;

    const colors = this.generateHarmonyColors();
    const palette = {
      id: Date.now(),
      name,
      colors,
      timestamp: new Date().toISOString()
    };

    this.savedPalettes.push(palette);
    await this.savePalettes();
    this.renderSavedPalettes();
  }

  async loadSavedPalettes() {
    try {
      const result = await storage.get('palettes');
      this.savedPalettes = result.palettes || [];
      this.renderSavedPalettes();
    } catch (error) {
      console.error('Error loading palettes:', error);
    }
  }

  async savePalettes() {
    try {
      await storage.set({ palettes: this.savedPalettes });
    } catch (error) {
      console.error('Error saving palettes:', error);
    }
  }

  renderSavedPalettes() {
    const container = document.getElementById('savedPalettes');
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    this.savedPalettes.forEach(palette => {
      const div = document.createElement('div');
      div.className = 'palette-item';

      // Create header
      const header = document.createElement('div');
      header.className = 'palette-header';

      const nameSpan = document.createElement('span');
      nameSpan.textContent = this.sanitizeText(palette.name);
      header.appendChild(nameSpan);

      const buttonContainer = document.createElement('div');
      
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-palette-btn';
      copyBtn.textContent = 'Copy';
      copyBtn.dataset.paletteId = palette.id;
      copyBtn.addEventListener('click', () => this.copyPalette(palette.id));
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-palette-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.dataset.paletteId = palette.id;
      deleteBtn.addEventListener('click', () => this.deletePalette(palette.id));

      buttonContainer.appendChild(copyBtn);
      buttonContainer.appendChild(deleteBtn);
      header.appendChild(buttonContainer);
      div.appendChild(header);

      // Create colors container
      const colorsDiv = document.createElement('div');
      colorsDiv.className = 'palette-colors';
      
      palette.colors.forEach(color => {
        const colorDiv = document.createElement('div');
        colorDiv.className = 'palette-color';
        colorDiv.style.backgroundColor = this.sanitizeColor(color);
        colorDiv.title = this.sanitizeColor(color);
        colorsDiv.appendChild(colorDiv);
      });

      div.appendChild(colorsDiv);
      container.appendChild(div);
    });
  }

  async createNewPalette() {
    const nameInput = document.getElementById('paletteName');
    const name = nameInput.value.trim();
    
    if (!name) {
      alert('Please enter a palette name');
      return;
    }

    const colors = [this.colorDisplay.value];
    const palette = {
      id: Date.now(),
      name,
      colors,
      timestamp: new Date().toISOString()
    };

    this.savedPalettes.push(palette);
    await this.savePalettes();
    this.renderSavedPalettes();
    
    nameInput.value = '';
  }

  async deletePalette(id) {
    this.savedPalettes = this.savedPalettes.filter(p => p.id !== id);
    await this.savePalettes();
    this.renderSavedPalettes();
  }

  copyPalette(id) {
    const palette = this.savedPalettes.find(p => p.id === id);
    if (!palette) return;

    const colorString = palette.colors.join(', ');
    navigator.clipboard.writeText(colorString);
    this.showCopyNotification();
  }

  exportPalettes() {
    const dataStr = JSON.stringify(this.savedPalettes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportName = 'color-palettes.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
  }

  initializeSliders() {
    // HSL Sliders
    this.hueSlider = document.getElementById('hueSlider');
    this.satSlider = document.getElementById('satSlider');
    this.lightSlider = document.getElementById('lightSlider');
    this.alphaSlider = document.getElementById('alphaSlider');
    
    // Value displays
    this.hueValue = document.getElementById('hueValue');
    this.satValue = document.getElementById('satValue');
    this.lightValue = document.getElementById('lightValue');
    this.alphaValue = document.getElementById('alphaValue');

    // Add event listeners
    if (this.hueSlider) {
      this.hueSlider.addEventListener('input', () => this.handleSliderChange());
      this.satSlider.addEventListener('input', () => this.handleSliderChange());
      this.lightSlider.addEventListener('input', () => this.handleSliderChange());
      this.alphaSlider.addEventListener('input', () => this.handleSliderChange());
    }

    // Add reset button functionality
    const resetBtn = document.getElementById('resetSliders');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetSliders());
    }
  }

  initializeExportOptions() {
    document.querySelectorAll('.export-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleExport(e.target.dataset.format));
    });

    const exportFormatSelect = document.getElementById('exportFormat');
    const exportButton = document.getElementById('exportPalettes');
    
    exportButton.addEventListener('click', () => {
      const format = exportFormatSelect.value;
      this.exportPalettes(format);
    });
  }

  handleExport(format) {
    const color = this.colorDisplay.value;
    const rgb = this.hexToRgbArray(color);
    const hsl = this.hexToHslArray(color);
    
    let exportText = '';
    
    switch(format) {
      case 'css':
        exportText = this.generateCSSExport(color, rgb, hsl);
        break;
      case 'sass':
        exportText = this.generateSASSExport(color, rgb, hsl);
        break;
      case 'tailwind':
        exportText = this.generateTailwindExport(color);
        break;
    }

    navigator.clipboard.writeText(exportText);
    this.showCopyNotification();
  }

  generateCSSExport(hex, rgb, hsl) {
    return `.color {
  /* HEX */
  color: ${hex};
  
  /* RGB */
  color: rgb(${rgb.join(', ')});
  
  /* HSL */
  color: hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%);
}`;
  }

  generateSASSExport(hex, rgb, hsl) {
    return `$color: ${hex};
$color-rgb: (${rgb.join(', ')});
$color-hsl: (${hsl.join(', ')});

// Usage:
// color: $color;
// color: rgb(#{nth($color-rgb, 1)}, #{nth($color-rgb, 2)}, #{nth($color-rgb, 3)});
// color: hsl(#{nth($color-hsl, 1)}, #{nth($color-hsl, 2)}%, #{nth($color-hsl, 3)}%);`;
  }

  generateTailwindExport(hex) {
    const colorName = 'primary'; // You could make this configurable
    return `colors: {
  '${colorName}': '${hex}',
  // Add to your tailwind.config.js
}`;
  }

  exportPalettes(format) {
    switch(format) {
      case 'json':
        this.exportAsJSON();
        break;
      case 'ase':
        this.exportAsASE();
        break;
      case 'sketchpalette':
        this.exportAsSketchPalette();
        break;
      case 'css':
        this.exportAsCSS();
        break;
      case 'scss':
        this.exportAsSCSS();
        break;
      case 'figma':
        this.exportAsFigma();
        break;
    }
  }

  exportAsJSON() {
    const data = {
      name: 'Color Palette',
      colors: this.savedPalettes.map(palette => ({
        name: palette.name,
        colors: palette.colors
      }))
    };
    this.downloadFile('colors.json', JSON.stringify(data, null, 2));
  }

  exportAsASE() {
    // Adobe Swatch Exchange format
    const ase = this.generateASE();
    this.downloadFile('colors.ase', ase, 'application/octet-stream');
  }

  exportAsSketchPalette() {
    const data = {
      compatibleVersion: '2.0',
      pluginVersion: '2.0',
      colors: this.savedPalettes.flatMap(palette => 
        palette.colors.map(color => {
          const rgb = this.hexToRgbArray(color).map(c => c / 255);
          return { red: rgb[0], green: rgb[1], blue: rgb[2], alpha: 1 };
        })
      )
    };
    this.downloadFile('colors.sketchpalette', JSON.stringify(data, null, 2));
  }

  exportAsCSS() {
    let css = ':root {\n';
    this.savedPalettes.forEach(palette => {
      palette.colors.forEach((color, index) => {
        css += `  --${palette.name.toLowerCase()}-${index + 1}: ${color};\n`;
      });
    });
    css += '}';
    this.downloadFile('colors.css', css);
  }

  exportAsSCSS() {
    let scss = '// Color Variables\n';
    this.savedPalettes.forEach(palette => {
      scss += `\n// ${palette.name}\n`;
      palette.colors.forEach((color, index) => {
        scss += `$${palette.name.toLowerCase()}-${index + 1}: ${color};\n`;
      });
    });
    this.downloadFile('colors.scss', scss);
  }

  exportAsFigma() {
    const styles = {
      name: 'Color Styles',
      styles: this.savedPalettes.flatMap(palette =>
        palette.colors.map((color, index) => ({
          name: `${palette.name}/${index + 1}`,
          type: 'SOLID',
          color: this.hexToRgbArray(color).map(c => c / 255)
        }))
      )
    };
    this.downloadFile('figma-colors.json', JSON.stringify(styles, null, 2));
  }

  generateASE() {
    // This is a simplified version. Real ASE format requires binary encoding
    const signature = 'ASEF';
    const version = '1.0';
    const blocks = this.savedPalettes.flatMap(palette =>
      palette.colors.map(color => ({
        type: 'color',
        name: palette.name,
        model: 'RGB',
        color: this.hexToRgbArray(color).map(c => c / 255)
      }))
    );
    
    return JSON.stringify({ signature, version, blocks }, null, 2);
  }

  downloadFile(filename, content, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  initializeCustomization() {
    this.themeBtn = document.getElementById('toggleTheme');
    this.themeBtn.addEventListener('click', () => this.toggleTheme());
  }

  async loadUserPreferences() {
    try {
      const prefs = await storage.get('userPreferences');
      if (prefs.userPreferences) {
        const { theme } = prefs.userPreferences;
        this.applyTheme(theme || 'light');
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  }

  async saveUserPreferences() {
    const userPreferences = {
      theme: document.documentElement.dataset.theme || 'light'
    };

    try {
      await storage.set({ userPreferences });
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }

  toggleTheme() {
    const currentTheme = document.documentElement.dataset.theme;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
    this.saveUserPreferences();
  }

  applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    // Update theme-specific UI elements
    this.updateThemeSpecificElements(theme);
  }

  updateThemeSpecificElements(theme) {
    // Update color picker background for better contrast
    const colorPicker = document.getElementById('colorPicker');
    colorPicker.style.backgroundColor = theme === 'dark' ? '#4d4d4d' : '#ffffff';
  }

  initializeColorLibrary() {
    this.initializeBasicColors();
    this.initializeWebSafeColors();
    this.initializeMaterialColors();
  }

  initializeBasicColors() {
    const basicColors = [
      '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
      '#000000', '#ffffff', '#808080', '#c0c0c0', '#800000', '#808000',
      '#008000', '#800080', '#008080', '#000080'
    ];
    
    this.renderColorGrid('basicColors', basicColors);
  }

  initializeWebSafeColors() {
    const webSafeColors = [];
    for (let r = 0; r <= 255; r += 51) {
      for (let g = 0; g <= 255; g += 51) {
        for (let b = 0; b <= 255; b += 51) {
          webSafeColors.push(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
        }
      }
    }
    
    this.renderColorGrid('webSafeColors', webSafeColors);
  }

  initializeMaterialColors() {
    const materialColors = {
      'red': ['#ffebee', '#ffcdd2', '#ef9a9a', '#e57373', '#ef5350', '#f44336'],
      'blue': ['#e3f2fd', '#bbdefb', '#90caf9', '#64b5f6', '#42a5f5', '#2196f3'],
      'green': ['#e8f5e9', '#c8e6c9', '#a5d6a7', '#81c784', '#66bb6a', '#4caf50']
      // Add more material colors as needed
    };
    
    const flatColors = Object.values(materialColors).flat();
    this.renderColorGrid('materialColors', flatColors);
  }

  initializeTrendingColors() {
    this.initializeTrendingSection();
    this.initializeSeasonalPalettes();
    this.initializePopularCombinations();
  }

  initializeTrendingSection() {
    const trendingColors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
      '#D4A5A5', '#9B9B9B', '#E9D985', '#799FCB', '#9055A2'
    ];
    
    this.renderColorGrid('trendingColors', trendingColors);
  }

  initializeSeasonalPalettes() {
    const seasonalColors = {
      spring: ['#FF9AA2', '#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7'],
      summer: ['#FF69B4', '#FFD700', '#87CEEB', '#98FB98', '#DDA0DD'],
      autumn: ['#D35400', '#C0392B', '#F39C12', '#F1C40F', '#935116'],
      winter: ['#2980B9', '#2C3E50', '#95A5A6', '#BDC3C7', '#ECF0F1']
    };
    
    const seasonButtons = document.querySelectorAll('.season-btn');
    const seasonColors = document.getElementById('seasonColors');
    
    seasonButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const season = e.target.dataset.season;
        seasonButtons.forEach(b => b.classList.toggle('active', b === e.target));
        this.renderColorGrid('seasonColors', seasonalColors[season]);
      });
    });
    
    // Initialize with spring colors
    this.renderColorGrid('seasonColors', seasonalColors.spring);
  }

  initializePopularCombinations() {
    const combinations = [
      ['#2C3E50', '#E74C3C', '#ECF0F1', '#3498DB', '#2980B9'],
      ['#2ECC71', '#27AE60', '#F1C40F', '#E67E22', '#E74C3C'],
      ['#1ABC9C', '#16A085', '#2ECC71', '#27AE60', '#3498DB']
    ];
    
    const container = document.getElementById('popularCombinations');
    container.innerHTML = '';
    
    combinations.forEach(combo => {
      const div = document.createElement('div');
      div.className = 'combination';
      
      combo.forEach(color => {
        const colorDiv = document.createElement('div');
        colorDiv.className = 'combination-color';
        colorDiv.style.backgroundColor = color;
        colorDiv.title = color;
        colorDiv.addEventListener('click', () => {
          this.colorDisplay.value = color;
          this.updateColorDisplay(color);
        });
        div.appendChild(colorDiv);
      });
      
      container.appendChild(div);
    });
  }

  updateColorInfo(color) {
    const colorNameDisplay = document.getElementById('colorNameDisplay');
    const hexValue = document.getElementById('hexValue');
    const hsbValue = document.getElementById('hsbValue');
    const rgbValue = document.getElementById('rgbValue');
    const hslValue = document.getElementById('hslValue');
    const hwbValue = document.getElementById('hwbValue');
    const cmykValue = document.getElementById('cmykValue');

    // Update values
    hexValue.textContent = color;
    hsbValue.textContent = this.hexToHsb(color);
    rgbValue.textContent = this.hexToRgb(color);
    hslValue.textContent = this.hexToHsl(color);
    hwbValue.textContent = this.hexToHwb(color);
    cmykValue.textContent = this.hexToCmyk(color);

    // Try to find closest named color
    const colorName = this.findClosestNamedColor(color);
    colorNameDisplay.textContent = colorName || 'Custom Color';

    // Add click-to-copy functionality for all values
    [hexValue, hsbValue, rgbValue, hslValue, hwbValue, cmykValue].forEach(element => {
      element.addEventListener('click', () => {
        navigator.clipboard.writeText(element.textContent);
        this.showCopyNotification();
      });
    });
  }

  findClosestNamedColor(hex) {
    // Add basic color names
    const namedColors = {
      '#ff0000': 'Red',
      '#00ff00': 'Green',
      '#0000ff': 'Blue',
      '#ffff00': 'Yellow',
      '#ff00ff': 'Magenta',
      '#00ffff': 'Cyan',
      '#000000': 'Black',
      '#ffffff': 'White',
      // Add more named colors as needed
    };

    return namedColors[hex.toLowerCase()] || null;
  }

  initializeColorInfo() {
    this.colorNameDisplay = document.getElementById('colorNameDisplay');
    this.hexValue = document.getElementById('hexValue');
    this.rgbValue = document.getElementById('rgbValue');
    this.hslValue = document.getElementById('hslValue');
    
    // Add click-to-copy functionality
    [this.hexValue, this.rgbValue, this.hslValue].forEach(element => {
      element.addEventListener('click', () => {
        navigator.clipboard.writeText(element.textContent);
        this.showCopyNotification();
      });
    });
  }

  initializePalettePreview() {
    // Get the palette preview container
    this.palettePreview = document.getElementById('palettePreview');

    // Initialize with current color if available
    if (this.colorDisplay) {
      this.updatePalettePreview(this.colorDisplay.value);
    }
  }

  updatePalettePreview(color) {
    if (!this.palettePreview) return;

    while (this.palettePreview.firstChild) {
      this.palettePreview.removeChild(this.palettePreview.firstChild);
    }

    try {
      const hsl = this.hexToHslArray(color);
      const variations = [
        this.hslToHex([hsl[0], hsl[1], Math.max(0, hsl[2] - 30)]),
        this.hslToHex([hsl[0], hsl[1], Math.max(0, hsl[2] - 15)]),
        color,
        this.hslToHex([hsl[0], hsl[1], Math.min(100, hsl[2] + 15)]),
        this.hslToHex([hsl[0], hsl[1], Math.min(100, hsl[2] + 30)])
      ];
      
      variations.forEach(c => {
        const colorDiv = document.createElement('div');
        colorDiv.className = 'palette-preview-color';
        colorDiv.style.backgroundColor = this.sanitizeColor(c);
        colorDiv.title = this.sanitizeColor(c);
        this.palettePreview.appendChild(colorDiv);
      });
    } catch (error) {
      console.error('Error updating palette preview:', error);
    }
  }

  handleSliderChange() {
    const hue = parseInt(this.hueSlider.value);
    const sat = parseInt(this.satSlider.value);
    const light = parseInt(this.lightSlider.value);
    const alpha = parseInt(this.alphaSlider.value) / 100;

    // Update value displays
    this.hueValue.textContent = `${hue}°`;
    this.satValue.textContent = `${sat}%`;
    this.lightValue.textContent = `${light}%`;
    this.alphaValue.textContent = `${Math.round(alpha * 100)}%`;

    // Convert HSL to hex
    const color = this.hslToHex([hue, sat, light]);
    
    // Update the color display directly
    this.updateColorDisplay(color);
    
    // Update harmonies and history
    this.updateHarmonyDisplay();
    this.addToHistory(color);
  }

  renderColorGrid(containerId, colors) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    colors.forEach(color => {
      const div = document.createElement('div');
      div.className = 'color-item';
      div.style.backgroundColor = color;
      div.title = color;
      div.addEventListener('click', () => {
        this.colorPicker.value = color;
        this.updateColorDisplay(color);
        this.addToHistory(color);
      });
      container.appendChild(div);
    });
  }

  resetSliders() {
    // Reset to default values
    this.hueSlider.value = 0;
    this.satSlider.value = 100;
    this.lightSlider.value = 50;
    this.alphaSlider.value = 100;
    
    // Trigger slider change to update everything
    this.handleSliderChange();
  }

  hexToHsb(hex) {
    const rgb = this.hexToRgbArray(hex);
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h, s;
    const v = max;

    if (delta === 0) {
      h = 0;
      s = 0;
    } else {
      s = delta / max;
      switch (max) {
        case r: h = (g - b) / delta + (g < b ? 6 : 0); break;
        case g: h = (b - r) / delta + 2; break;
        case b: h = (r - g) / delta + 4; break;
      }
      h /= 6;
    }

    return `hsb(${Math.round(h * 360)}°, ${Math.round(s * 100)}%, ${Math.round(v * 100)}%)`;
  }

  hexToHwb(hex) {
    const rgb = this.hexToRgbArray(hex);
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h;
    const w = min;
    const bl = 1 - max;

    if (delta === 0) {
      h = 0;
    } else {
      switch (max) {
        case r: h = (g - b) / delta + (g < b ? 6 : 0); break;
        case g: h = (b - r) / delta + 2; break;
        case b: h = (r - g) / delta + 4; break;
      }
      h /= 6;
    }

    return `hwb(${Math.round(h * 360)}°, ${Math.round(w * 100)}%, ${Math.round(bl * 100)}%)`;
  }

  sanitizeColor(color) {
    // Only allow valid hex colors
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return color;
    }
    return '#000000'; // Default to black if invalid
  }

  sanitizeText(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.textContent;
  }

  initializeColorSync() {
    // Add event listener for color picker input
    this.colorPicker.addEventListener('input', (e) => {
      const color = e.target.value;
      this.updateColorDisplay(color);
    });

    // Add event listener for color display changes
    this.colorDisplay.addEventListener('input', (e) => {
      const color = e.target.value;
      this.updateColorDisplay(color);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => new ColorPicker()); 
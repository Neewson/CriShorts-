/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ThemePreset } from './types';

export const STOCK_PRESETS: ThemePreset[] = [
  {
    id: 'celestial',
    name: 'Céu Estrelado',
    url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&q=80&w=1080&h=1920',
    description: 'Espaço sideral, estrelas sutis e sensação espiritual cósmica.',
    textClass: 'text-white'
  },
  {
    id: 'sunset',
    name: 'Nascer do Sol',
    url: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&q=80&w=1080&h=1920',
    description: 'Raios dourados atravessando o nevoeiro celestial, esperança e manhã.',
    textClass: 'text-amber-50'
  },
  {
    id: 'mountain',
    name: 'Fé Inabalável',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1080&h=1920',
    description: 'Picos de montanhas sob névoa imponente, simbolizando força e foco.',
    textClass: 'text-slate-100'
  },
  {
    id: 'nebula',
    name: 'Grandeza Divina',
    url: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?auto=format&fit=crop&q=80&w=1080&h=1920',
    description: 'Poeira cósmica violeta e cerúlea que irradia glória e imensidão.',
    textClass: 'text-pink-50'
  },
  {
    id: 'fog',
    name: 'Caminho com Deus',
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1080&h=1920',
    description: 'Uma trilha arborizada envolta de luz solar mística e mistério divino.',
    textClass: 'text-white'
  },
  {
    id: 'luxury-gold',
    name: 'Glória e Luz',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1080&h=1920',
    description: 'Ondulações abstratas em tom de dourado champanhe luxuoso.',
    textClass: 'text-amber-100'
  },
  {
    id: 'minimal-dark',
    name: 'Silêncio e Oração',
    url: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&q=80&w=1080&h=1920',
    description: 'Sombras arquitetônicas elegantes, preto e cinza profundo para foco absoluto.',
    textClass: 'text-slate-200'
  },
  {
    id: 'forest',
    name: 'Criação Divina',
    url: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&q=80&w=1080&h=1920',
    description: 'Copas de pinheiros recebendo uma chuva de iluminação dourada.',
    textClass: 'text-emerald-50'
  }
];

export const PRESET_VERSES = [
  {
    text: "O Senhor é o meu pastor, de nada terei falta. Em verdes pastagens me faz repousar.",
    reference: "Salmos 23:1-2",
    theme: "Fé e Confiança"
  },
  {
    text: "Tudo posso naquele que me fortalece.",
    reference: "Filipenses 4:13",
    theme: "Força e Vitória"
  },
  {
    text: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento.",
    reference: "Isaías 41:10",
    theme: "Medo e Ansiedade"
  },
  {
    text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.",
    reference: "João 3:16",
    theme: "Amor e Salvação"
  },
  {
    text: "Sabemos que todas as coisas cooperam para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.",
    reference: "Romanos 8:28",
    theme: "Esperança e Futuro"
  },
  {
    text: "Lancem sobre ele toda a sua ansiedade, porque ele tem cuidado de vocês.",
    reference: "1 Pedro 5:7",
    theme: "Ansiedade e Paz"
  },
  {
    text: "O próprio Senhor irá à sua frente e estará com você; ele nunca o deixará, nunca o abandonará. Não tenha medo! Não se desanime!",
    reference: "Deuteronômio 31:8",
    theme: "Presença de Deus"
  },
  {
    text: "Clame a mim e eu responderei e lhe direi coisas grandiosas e insondáveis que você não conhece.",
    reference: "Jeremias 33:3",
    theme: "Oração e Fé"
  }
];

export interface AudioPlayState {
  source: AudioBufferSourceNode;
  audioCtx: AudioContext;
  duration: number;
}

/**
 * Decodes base64 raw linear PCM 16-bit little-endian data and plays it via Web Audio API.
 * Keeps track of playback source for stopping/pausing.
 */
export function playPcmBase64(base64: string, sampleRate: number = 24000): Promise<AudioPlayState | null> {
  return new Promise((resolve) => {
    try {
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const buffer = bytes.buffer;
      const dataView = new DataView(buffer);
      const numSamples = buffer.byteLength / 2; // 16-bit = 2 bytes/sample
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = audioCtx.createBuffer(1, numSamples, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      
      for (let i = 0; i < numSamples; i++) {
        const sample = dataView.getInt16(i * 2, true);
        channelData[i] = sample / 32768.0; // scale signed 16-bit to [-1.0, 1.0]
      }
      
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      
      resolve({ source, audioCtx, duration: audioBuffer.duration });
    } catch (err) {
      console.error('Falha ao decodificar ou reproduzir áudio do narrador:', err);
      resolve(null);
    }
  });
}

/**
 * High-quality 1080x1920 offline graphic rendering tool for modern vertical formats.
 * Bypasses CORS-related and DOM element limitations.
 */
export async function exportToImage(
  verse: string,
  reference: string,
  reflection: string,
  imageUrl: string,
  config: {
    fontFamily: 'serif' | 'sans' | 'mono';
    textAlignment: 'center' | 'left' | 'right';
    textColor: string;
    overlayOpacity: number;
    textPosition: 'top' | 'center' | 'bottom';
    accentColor: string;
    watermarkText: string;
    title: string;
    logoType: 'bible' | 'cross' | 'heart' | 'none';
    aspectRatio?: '9:16' | '16:9';
  }
) {
  const isHorizontal = config.aspectRatio === '16:9';
  const canvas = document.createElement('canvas');
  canvas.width = isHorizontal ? 1920 : 1080;
  canvas.height = isHorizontal ? 1080 : 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Let's create a black loading screen in case image is loading
  ctx.fillStyle = '#0a0a0c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Load and draw background image
  const img = new Image();
  img.crossOrigin = 'anonymous';

  await new Promise<void>((resolve) => {
    img.onload = () => {
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
      const x = (canvas.width - img.width * scale) / 2;
      const y = (canvas.height - img.height * scale) / 2;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      resolve();
    };
    img.onerror = () => {
      // Fallback: draw beautiful gradient
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#111827');
      grad.addColorStop(0.5, '#1e112c');
      grad.addColorStop(1, '#030712');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      resolve();
    };
    // If it's a base64 or Unsplash url
    img.src = imageUrl;
  });

  // Apply dark overlay
  ctx.fillStyle = `rgba(0, 0, 0, ${config.overlayOpacity / 100})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Font styling selector
  const fontName = config.fontFamily === 'serif' ? 'Playfair Display, Georgia, serif' : 
                    config.fontFamily === 'mono' ? 'JetBrains Mono, Courier, monospace' : 
                    'Inter, system-ui, sans-serif';

  // Draw Watermark at the top center
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  const watermarkY = isHorizontal ? 80 : 120;
  ctx.font = `italic 30px ${fontName}`;
  ctx.textAlign = 'center';
  ctx.fillText(config.watermarkText || 'Criador de Shorts Cristãos', canvas.width / 2, watermarkY);

  // Draw Decorative logo icon if requested
  if (config.logoType !== 'none') {
    ctx.fillStyle = config.accentColor || '#eab308';
    ctx.font = '56px serif';
    let icon = '✝';
    if (config.logoType === 'bible') icon = '📖';
    if (config.logoType === 'heart') icon = '💖';
    const logoY = isHorizontal ? 150 : 230;
    ctx.fillText(icon, canvas.width / 2, logoY);
  }

  // Draw Devotional Title
  ctx.fillStyle = config.accentColor || '#eab308';
  ctx.font = `bold 44px ${fontName}`;
  const titleY = isHorizontal ? 230 : 330;
  ctx.fillText((config.title || 'Palavra de Hoje').toUpperCase(), canvas.width / 2, titleY);

  // Define formatting variables
  ctx.fillStyle = config.textColor || '#ffffff';
  ctx.textAlign = config.textAlignment;
  
  const marginX = isHorizontal ? 200 : 120;
  const maxTextWidth = canvas.width - (2 * marginX);
  const textX = config.textAlignment === 'center' ? canvas.width / 2 :
                config.textAlignment === 'left' ? marginX : canvas.width - marginX;

  // Custom text wrapping function
  const wrapText = (text: string, maxWidth: number, size: number, weight: string) => {
    const words = text.split(/\s+/);
    const lines = [];
    let currentLine = '';
    ctx.font = `${weight} ${size}px ${fontName}`;
    
    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  // Determine vertical layout starting height
  let startY = isHorizontal ? 340 : 700;
  if (config.textPosition === 'center') startY = isHorizontal ? 440 : 880;
  if (config.textPosition === 'bottom') startY = isHorizontal ? 560 : 1100;

  // 1. Draw Verse body
  const verseFontSize = isHorizontal ? 42 : 48;
  const verseLines = wrapText(`“${verse}”`, maxTextWidth, verseFontSize, 'italic 500');
  ctx.fillStyle = config.textColor || '#ffffff';
  ctx.font = `italic 500 ${verseFontSize}px ${fontName}`;
  
  verseLines.forEach((line, index) => {
    ctx.fillText(line, textX, startY + (index * (verseFontSize + 20)));
  });

  // 2. Draw Reference
  startY += (verseLines.length * (verseFontSize + 20)) + 30;
  ctx.fillStyle = config.accentColor || '#eab308';
  ctx.font = `bold italic 40px ${fontName}`;
  ctx.fillText(`— ${reference}`, textX, startY);

  // 3. Draw Reflection
  startY += isHorizontal ? 70 : 90;
  const reflectionFontSize = isHorizontal ? 32 : 36;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = `400 ${reflectionFontSize}px ${fontName}`;
  
  const reflectionLines = wrapText(reflection, maxTextWidth, reflectionFontSize, '400');
  reflectionLines.forEach((line, index) => {
    ctx.fillText(line, textX, startY + (index * (reflectionFontSize + 16)));
  });

  // Prompt native saving mechanism
  try {
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const link = document.createElement('a');
    link.download = `shorts_cristao_${reference.toLowerCase().replace(/[^a-z0-9]/g, '_')}.jpg`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Falha ao exportar imagem:', error);
    alert('Erro ao reconstruir plano de fundo. Presets remotos podem estar restritos por segurança CORS. Tente gerar uma imagem IA ou baixar outra combinação.');
  }
}

export function hexToRgb(hex: string): string {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const r = parseInt(clean.substring(0, 2), 16) || 255;
  const g = parseInt(clean.substring(2, 4), 16) || 255;
  const b = parseInt(clean.substring(4, 6), 16) || 255;
  return `${r}, ${g}, ${b}`;
}

export function getSupportedMimeType(preferMp4: boolean = false): string {
  const types = preferMp4
    ? [
        'video/mp4;codecs=avc1,mp4a.40.2',
        'video/mp4;codecs=avc1,aac',
        'video/mp4;codecs=h264,aac',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm'
      ]
    : [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264,opus',
        'video/webm;codecs=vp9,pcm',
        'video/webm',
        'video/mp4;codecs=avc1,mp4a.40.2',
        'video/mp4;codecs=avc1,aac',
        'video/mp4'
      ];
  for (const t of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return 'video/webm';
}

export interface TimelineUnit {
  type: 'title' | 'pause_title' | 'intro' | 'verse' | 'pause_verse' | 'reflection';
  text: string;
  indexInSection: number;
}

export function buildNarrationTimeline(
  title: string | null | undefined,
  verse: string | null | undefined,
  reflection: string | null | undefined
): TimelineUnit[] {
  const safeTitle = title || "Encorajamento";
  const safeVerse = verse || "";
  const safeReflection = reflection || "";

  const titleWords = safeTitle.split(/\s+/).filter(w => w.length > 0);
  const introWords = ["O", "versículo", "de", "hoje", "é:"];
  const verseWords = safeVerse.split(/\s+/).filter(w => w.length > 0);
  const reflectionWords = safeReflection.split(/\s+/).filter(w => w.length > 0);

  const timeline: TimelineUnit[] = [];

  // 1. Title words
  titleWords.forEach((word, idx) => {
    timeline.push({ type: 'title', text: word, indexInSection: idx });
  });

  // 2. Title pause (3 silent units)
  for (let i = 0; i < 3; i++) {
    timeline.push({ type: 'pause_title', text: '', indexInSection: i });
  }

  // 3. Intro words
  introWords.forEach((word, idx) => {
    timeline.push({ type: 'intro', text: word, indexInSection: idx });
  });

  // 4. Verse words
  verseWords.forEach((word, idx) => {
    timeline.push({ type: 'verse', text: word, indexInSection: idx });
  });

  // 5. Verse pause (3 silent units)
  for (let i = 0; i < 3; i++) {
    timeline.push({ type: 'pause_verse', text: '', indexInSection: i });
  }

  // 6. Reflection words
  reflectionWords.forEach((word, idx) => {
    timeline.push({ type: 'reflection', text: word, indexInSection: idx });
  });

  return timeline;
}

export function getPageAndRelativeIndexForWord(globalWordIdx: number, pages: string[]) {
  if (globalWordIdx < 0 || pages.length === 0) {
    return {
      pageIdx: 0,
      relativeIdx: -1,
      pageText: pages[0] || ''
    };
  }
  let wordCounter = 0;
  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const pageWords = pages[pageIdx].split(/\s+/).filter(w => w.length > 0);
    if (globalWordIdx >= wordCounter && globalWordIdx < wordCounter + pageWords.length) {
      return {
        pageIdx,
        relativeIdx: globalWordIdx - wordCounter,
        pageText: pages[pageIdx]
      };
    }
    wordCounter += pageWords.length;
  }
  return {
    pageIdx: Math.max(0, pages.length - 1),
    relativeIdx: -1,
    pageText: pages[pages.length - 1] || ''
  };
}

export function calculateSlideDurations(
  title: string | null | undefined,
  verse: string | null | undefined,
  reflection: string | null | undefined,
  totalDuration: number
) {
  const safeTitle = title || "Encorajamento";
  const safeVerse = verse || "";
  const safeReflection = reflection || "";

  const titleWords = safeTitle.split(/\s+/).filter(w => w.length > 0).length;
  const introWords = 5; // "O versículo de hoje é:"
  const verseWords = safeVerse.split(/\s+/).filter(w => w.length > 0).length;
  const reflectionWords = safeReflection.split(/\s+/).filter(w => w.length > 0).length;

  const totalUnits = titleWords + 3 + introWords + verseWords + 3 + reflectionWords;
  const safeTotalDuration = Math.max(5, totalDuration || 15);

  const titleDur = safeTotalDuration * ((titleWords + 3) / totalUnits);
  const verseDur = safeTotalDuration * ((introWords + verseWords + 3) / totalUnits);
  const reflectionDur = safeTotalDuration - titleDur - verseDur;

  return {
    titleDur: isNaN(titleDur) ? 3 : titleDur,
    verseDur: isNaN(verseDur) ? 5 : verseDur,
    reflectionDur: isNaN(reflectionDur) ? 7 : reflectionDur
  };
}

export function splitTextIntoPages(textStr: string | null | undefined, maxWordsCount: number = 24) {
  if (!textStr || typeof textStr !== 'string') {
    return [];
  }
  const cleanedText = textStr.trim();
  if (!cleanedText) {
    return [];
  }

  const sentences = cleanedText.match(/[^.!?]+[.!?]*/g) || [cleanedText];
  const pageList: string[] = [];
  let currentChunk: string[] = [];
  let wordCount = 0;
  
  for (let sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    
    const sentenceWords = trimmed.split(/\s+/).filter(w => w.length > 0);
    if (sentenceWords.length === 0) continue;

    if (wordCount + sentenceWords.length > maxWordsCount && currentChunk.length > 0) {
      pageList.push(currentChunk.join(' '));
      currentChunk = [];
      wordCount = 0;
    }
    
    currentChunk.push(trimmed);
    wordCount += sentenceWords.length;
    
    if (wordCount >= maxWordsCount) {
      pageList.push(currentChunk.join(' '));
      currentChunk = [];
      wordCount = 0;
    }
  }
  if (currentChunk.length > 0) {
    pageList.push(currentChunk.join(' '));
  }
  return pageList;
}

function drawHighlightedParagraph(
  ctx: CanvasRenderingContext2D,
  text: string,
  activeWordIndex: number,
  baseX: number,
  startY: number,
  maxWidth: number,
  fontSize: number,
  lineHeight: number,
  weight: string,
  fontName: string,
  textColor: string,
  accentColor: string,
  alignment: 'center' | 'left' | 'right',
  fadeVal: number
) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return 0;

  ctx.font = `${weight} ${fontSize}px ${fontName}`;
  const spaceWidth = ctx.measureText(' ').width;

  interface WordLayout {
    text: string;
    index: number;
    width: number;
  }
  const lines: WordLayout[][] = [];
  let currentLine: WordLayout[] = [];
  let currentLineWidth = 0;

  words.forEach((word, index) => {
    const wordWidth = ctx.measureText(word).width;
    const testWidth = currentLineWidth === 0 ? wordWidth : currentLineWidth + spaceWidth + wordWidth;
    
    if (testWidth > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = [{ text: word, index, width: wordWidth }];
      currentLineWidth = wordWidth;
    } else {
      currentLine.push({ text: word, index, width: wordWidth });
      currentLineWidth = testWidth;
    }
  });
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  lines.forEach((lineLayout, lineIdx) => {
    const y = startY + lineIdx * lineHeight;
    const totalLineWidth = lineLayout.reduce((acc, w) => acc + w.width, 0) + (lineLayout.length - 1) * spaceWidth;
    
    let startX = baseX;
    if (alignment === 'center') {
      startX = baseX - totalLineWidth / 2;
    } else if (alignment === 'right') {
      startX = baseX - totalLineWidth;
    }

    let currentX = startX;
    
    lineLayout.forEach((word) => {
      let finalColor = `rgba(${hexToRgb(textColor)}, ${fadeVal})`;

      ctx.fillStyle = finalColor;
      ctx.font = `${weight} ${fontSize}px ${fontName}`;
      ctx.shadowBlur = 0;

      ctx.textAlign = 'left';
      ctx.fillText(word.text, currentX, y);

      currentX += word.width + spaceWidth;
    });
  });

  return lines.length;
}

/**
 * High-quality 720x1280 offline video rendering and recording engine.
 * Records canvas slideshow and merges base64 audio silently in real-time.
 */
export async function exportToVideo(
  verse: string,
  reference: string,
  reflection: string,
  imageUrl: string,
  config: {
    fontFamily: 'serif' | 'sans' | 'mono';
    textAlignment: 'center' | 'left' | 'right';
    textColor: string;
    overlayOpacity: number;
    textPosition: 'top' | 'center' | 'bottom';
    accentColor: string;
    watermarkText: string;
    title: string;
    logoType: 'bible' | 'cross' | 'heart' | 'none';
    useMultiBackdrops?: boolean;
    backdropTitleUrl?: string;
    backdropVerseUrl?: string;
    backdropReflectionUrl?: string;
    backgroundMovement?: 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'static';
    aspectRatio?: '9:16' | '16:9';
  },
  voiceAudioBase64: string | null,
  preferMp4: boolean,
  onProgress: (percent: number) => void
): Promise<{ url: string; mimeType: string }> {
  const isHorizontal = config.aspectRatio === '16:9';
  const canvas = document.createElement('canvas');
  canvas.width = isHorizontal ? 1280 : 720;
  canvas.height = isHorizontal ? 720 : 1280;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível obter o contexto 2D do Canvas.');

  // Pre-load background image(s)
  const imgSingle = new Image();
  imgSingle.crossOrigin = 'anonymous';

  const imgTitle = new Image();
  imgTitle.crossOrigin = 'anonymous';

  const imgVerse = new Image();
  imgVerse.crossOrigin = 'anonymous';

  const imgReflection = new Image();
  imgReflection.crossOrigin = 'anonymous';

  const loadProms: Promise<void>[] = [];

  if (config.useMultiBackdrops) {
    const loadImg = (imgObj: HTMLImageElement, urlSrc: string) => {
      return new Promise<void>((resolve) => {
        imgObj.onload = () => resolve();
        imgObj.onerror = () => resolve(); // fallback gracefully
        imgObj.src = urlSrc;
      });
    };
    loadProms.push(loadImg(imgTitle, config.backdropTitleUrl || imageUrl));
    loadProms.push(loadImg(imgVerse, config.backdropVerseUrl || imageUrl));
    loadProms.push(loadImg(imgReflection, config.backdropReflectionUrl || imageUrl));
  } else {
    loadProms.push(new Promise<void>((resolve) => {
      imgSingle.onload = () => resolve();
      imgSingle.onerror = () => resolve();
      imgSingle.src = imageUrl;
    }));
  }

  await Promise.all(loadProms);

  // Decode voice base64 audio if provided
  let audioBuffer: AudioBuffer | null = null;
  let duration = 15; // default 15s short

  if (voiceAudioBase64) {
    try {
      const binaryString = window.atob(voiceAudioBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const buffer = bytes.buffer;
      const dataView = new DataView(buffer);
      const numSamples = buffer.byteLength / 2;
      
      const audioCtxTemp = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioBuffer = audioCtxTemp.createBuffer(1, numSamples, 24000);
      const channelData = audioBuffer.getChannelData(0);
      
      for (let i = 0; i < numSamples; i++) {
        const sample = dataView.getInt16(i * 2, true);
        channelData[i] = sample / 32768.0;
      }
      duration = audioBuffer.duration;
      await audioCtxTemp.close();
    } catch (err) {
      console.error('Falha ao decodificar trilha de áudio para gravação de vídeo:', err);
    }
  }

  // Set up silent recording audio setup
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // CRITICAL: Ensure the audio context is active so rendering timeline starts ticking.
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }

  const dest = audioCtx.createMediaStreamDestination();

  let source: AudioBufferSourceNode | null = null;
  if (audioBuffer) {
    source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(dest);

    // CRITICAL: Chrome / Safari silences audio destination streams if they don't route
    // to the real audio speakers output. We solve this by adding a parallel node connection
    // to audioCtx.destination, muted with a gain value of 0.
    const silentGain = audioCtx.createGain();
    silentGain.gain.value = 0;
    source.connect(silentGain);
    silentGain.connect(audioCtx.destination);
  }

  // Combine media streams
  const canvasStream = canvas.captureStream(30); // 30 FPS high quality
  
  // Directly attach the audio track from the media stream destination to avoid browser track binding drops.
  if (audioBuffer && dest) {
    const audioTracks = dest.stream.getAudioTracks();
    if (audioTracks.length > 0) {
      canvasStream.addTrack(audioTracks[0]);
    }
  }
  
  const combinedStream = canvasStream;

  const supportedMime = getSupportedMimeType(preferMp4);
  const mediaRecorder = new MediaRecorder(combinedStream, {
    mimeType: supportedMime,
    videoBitsPerSecond: 2500000 // High impact video compression bitrate
  });

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  const fontName = config.fontFamily === 'serif' ? 'Playfair Display, Georgia, serif' : 
                    config.fontFamily === 'mono' ? 'JetBrains Mono, Courier, monospace' : 
                    'Inter, system-ui, sans-serif';

  // Text wrapper helper
  const wrapText = (text: string, maxWidth: number, size: number, weight: string) => {
    const words = text.split(/\s+/);
    const lines = [];
    let currentLine = '';
    ctx.font = `${weight} ${size}px ${fontName}`;
    
    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  return new Promise((resolve, reject) => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: supportedMime });
      const url = URL.createObjectURL(blob);
      resolve({ url, mimeType: supportedMime });
    };

    mediaRecorder.onerror = (err) => reject(err);

    // Initial frame renders and starts recording
    mediaRecorder.start();
    if (source) {
      source.start(0);
    }

    const fps = 30;
    const totalFrames = Math.ceil(duration * fps);
    let currentFrame = 0;

    const { titleDur, verseDur, reflectionDur } = calculateSlideDurations(config.title, verse, reflection, duration);
    const timeline = buildNarrationTimeline(config.title, verse, reflection);

    const renderFrameLoop = () => {
      if (currentFrame >= totalFrames) {
        mediaRecorder.stop();
        if (source) {
          try {
            source.stop();
          } catch(e) {}
        }
        audioCtx.close();
        return;
      }

      const t = currentFrame / fps;

      // Calculate current unit index and slide phase early
      const currentUnitIdx = Math.min(timeline.length - 1, Math.floor((t / duration) * timeline.length));
      const currentUnit = timeline[currentUnitIdx];
      let phase = 0; // 0: Title, 1: Verse, 2: Reflection Pages

      if (currentUnit.type === 'title' || currentUnit.type === 'pause_title') {
        phase = 0;
      } else if (currentUnit.type === 'intro' || currentUnit.type === 'verse' || currentUnit.type === 'pause_verse') {
        phase = 1;
      } else {
        phase = 2;
      }

      // 1. Draw Background Image with smooth Cinematic movement (Ken Burns effect)
      ctx.fillStyle = '#0a0a0c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let currentImg = imgSingle;
      if (config.useMultiBackdrops) {
        if (phase === 0) currentImg = imgTitle;
        else if (phase === 1) currentImg = imgVerse;
        else currentImg = imgReflection;
      }

      if (currentImg.complete && currentImg.width > 0) {
        const movement = config.backgroundMovement || 'zoom-in';
        const p = t / duration; // progression fraction [0, 1]
        
        let scale = 1.0;
        let pX = 0; // offset percentage

        if (movement === 'zoom-in') {
          scale = 1.0 + 0.12 * p;
        } else if (movement === 'zoom-out') {
          scale = 1.12 - 0.12 * p;
        } else if (movement === 'pan-left') {
          scale = 1.15;
          pX = -4 * p;
        } else if (movement === 'pan-right') {
          scale = 1.15;
          pX = -4 + 4 * p;
        }

        const scaleWidth = canvas.width * scale;
        const scaleHeight = canvas.height * scale;
        
        let dx = (canvas.width - scaleWidth) / 2;
        let dy = (canvas.height - scaleHeight) / 2;

        if (pX !== 0) {
          dx += (pX / 100) * canvas.width;
        }

        ctx.drawImage(currentImg, dx, dy, scaleWidth, scaleHeight);
      } else {
        // Fallback smooth divine backdrop linear gradient
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, '#111827');
        grad.addColorStop(0.5, '#1e112c');
        grad.addColorStop(1, '#030712');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // 2. Draw opacity dimmer layer
      ctx.fillStyle = `rgba(0, 0, 0, ${config.overlayOpacity / 100})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 3. Ambient Floating Fireflies / Gold Elements particle rendering
      for (let i = 0; i < 20; i++) {
        const seedValue = Math.sin(i * 142.33) * 654.32;
        const xPos = ((seedValue - Math.floor(seedValue)) * canvas.width);
        const speed = 35 + (i % 6) * 12; // pixels drift/sec
        // Repeat floating
        const yPos = (canvas.height - (speed * t + i * 150)) % canvas.height;
        const rSize = 2.5 + (i % 3) * 1.5;
        const alpha = 0.12 + 0.15 * Math.sin(t * 1.5 + i);

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(xPos, yPos, rSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Draw brand watermark centered
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = `italic 20px ${fontName}`;
      ctx.textAlign = 'center';
      const watermarkY = isHorizontal ? 55 : 90;
      ctx.fillText(config.watermarkText || 'Criador de Shorts Cristãos', canvas.width / 2, watermarkY);

      // 5. Draw emblem logo
      if (config.logoType !== 'none') {
        ctx.fillStyle = config.accentColor || '#eab308';
        ctx.font = '36px serif';
        let icon = '✝';
        if (config.logoType === 'bible') icon = '📖';
        if (config.logoType === 'heart') icon = '💖';
        const logoY = isHorizontal ? 110 : 160;
        ctx.fillText(icon, canvas.width / 2, logoY);
      }

      // 6. Draw Seekbar
      const seekbarY = isHorizontal ? 25 : 45;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(60, seekbarY, canvas.width - 120, 2);
      ctx.fillStyle = config.accentColor || '#eab308';
      ctx.fillRect(60, seekbarY, (canvas.width - 120) * (t / duration), 2);

      // 7. Render dynamic slide pages
      let fadeVal = 1;

      let startY = isHorizontal ? 220 : 460;
      if (config.textPosition === 'center') startY = isHorizontal ? 310 : 560;
      if (config.textPosition === 'bottom') startY = isHorizontal ? 415 : 660;

      const marginX = isHorizontal ? 120 : 70;
      const maxTextWidth = canvas.width - (2 * marginX);
      const textX = config.textAlignment === 'center' ? canvas.width / 2 :
                    config.textAlignment === 'left' ? marginX : canvas.width - marginX;

      if (phase === 0) {
        // --- PHASE 0: TITLE SLIDE ---
        const titleText = (config.title || 'Palavra de Hoje').toUpperCase();
        const activeTitleWordIdx = currentUnit.type === 'title' ? currentUnit.indexInSection : -1;

        drawHighlightedParagraph(
          ctx,
          titleText,
          activeTitleWordIdx,
          canvas.width / 2,
          startY,
          maxTextWidth,
          32,
          44,
          'bold',
          fontName,
          config.textColor || '#ffffff',
          config.accentColor || '#eab308',
          'center',
          fadeVal
        );

        ctx.fillStyle = `rgba(255, 255, 255, 0.75)`;
        ctx.font = `italic 20px ${fontName}`;
        ctx.textAlign = 'center';
        ctx.fillText("Devocional Diário Especial", canvas.width / 2, startY + 60);
      } else if (phase === 1) {
        // --- PHASE 1: HOLY BIBLE VERSE SLIDE ---
        const fullVerseText = `“${verse}”`;
        const activeVerseWordIdx = currentUnit.type === 'verse' ? currentUnit.indexInSection : -1;

        const linesRenderedCount = drawHighlightedParagraph(
          ctx,
          fullVerseText,
          activeVerseWordIdx,
          textX,
          startY,
          maxTextWidth,
          32,
          46,
          'italic 500',
          fontName,
          config.textColor || '#ffffff',
          config.accentColor || '#eab308',
          config.textAlignment,
          fadeVal
        );

        const refY = startY + (linesRenderedCount * 46) + 30;
        ctx.fillStyle = `rgba(${hexToRgb(config.accentColor || '#eab308')}, 1.0)`;
        ctx.font = `bold italic 26px ${fontName}`;
        ctx.textAlign = config.textAlignment;
        ctx.fillText(`— ${reference}`, textX, refY);
      } else if (phase === 2) {
        // --- PHASE 2: REFLECTION SLIDE ---
        const reflectionPages = splitTextIntoPages(reflection, isHorizontal ? 38 : 24);
        let localFadeVal = 1;

        const globalRefIdx = currentUnit.type === 'reflection' ? currentUnit.indexInSection : -1;
        const { pageIdx, relativeIdx, pageText } = getPageAndRelativeIndexForWord(globalRefIdx, reflectionPages);

        drawHighlightedParagraph(
          ctx,
          pageText,
          relativeIdx,
          textX,
          startY,
          maxTextWidth,
          24,
          36,
          '400',
          fontName,
          config.textColor || '#ffffff',
          config.accentColor || '#eab308',
          config.textAlignment,
          localFadeVal
        );
      }

      currentFrame++;
      onProgress(Math.min(99, Math.round((currentFrame / totalFrames) * 100)));

      // Queue next frame at precise 30fps lock
      setTimeout(() => {
        requestAnimationFrame(renderFrameLoop);
      }, 1000 / fps);
    };

    renderFrameLoop();
  });
}

function writeStringHelper(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Packs raw 24kHz linear PCM data from TTS base64 into a high-compliance WAV audio download.
 */
export function exportToWav(voiceAudioBase64: string, sampleRate: number = 24000): string {
  const binaryString = window.atob(voiceAudioBase64);
  const len = binaryString.length;
  const pcmBytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    pcmBytes[i] = binaryString.charCodeAt(i);
  }

  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);

  // RIFF identifier
  writeStringHelper(view, 0, 'RIFF');
  // file length
  view.setUint32(4, 36 + len, true);
  // RIFF type
  writeStringHelper(view, 8, 'WAVE');
  // format chunk identifier
  writeStringHelper(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw PCM = 1)
  view.setUint16(20, 1, true);
  // channel count (1 = mono)
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, 2, true);
  // bits per sample (16-bit)
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeStringHelper(view, 36, 'data');
  // data chunk length
  view.setUint32(40, len, true);

  const blob = new Blob([wavHeader, pcmBytes], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

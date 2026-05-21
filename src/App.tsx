/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Heart, 
  Search, 
  Play, 
  Square, 
  Download, 
  Type, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Image as ImageIcon, 
  Copy, 
  Check, 
  RotateCcw, 
  Info, 
  Bookmark, 
  Compass, 
  Moon, 
  Flame, 
  ArrowRight,
  RefreshCw,
  Eye,
  Upload,
  Trash2,
  ImagePlus,
  Layers,
  GripVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { STOCK_PRESETS, PRESET_VERSES, playPcmBase64, exportToImage, exportToVideo, exportToWav, AudioPlayState, calculateSlideDurations, splitTextIntoPages, buildNarrationTimeline, getPageAndRelativeIndexForWord } from './utils';
import { ThemePresetId, ShortConfig } from './types';

export default function App() {
  // --- CORE STATE ---
  const [verse, setVerse] = useState<string>(PRESET_VERSES[0].text);
  const [reference, setReference] = useState<string>(PRESET_VERSES[0].reference);
  const [title, setTitle] = useState<string>("Palavra de Esperança");
  const [reflection, setReflection] = useState<string>(
    "Deus cuida de cada detalhe da sua caminhada. Descansa o seu coração hoje e caminhe sob os pastos seguros do Senhor!"
  );
  
  // Customization styling state
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans' | 'mono'>('serif');
  const [textAlignment, setTextAlignment] = useState<'center' | 'left' | 'right'>('center');
  const [textPosition, setTextPosition] = useState<'top' | 'center' | 'bottom'>('center');
  const [overlayOpacity, setOverlayOpacity] = useState<number>(45);
  const [textColor, setTextColor] = useState<string>('#ffffff');
  const [accentColor, setAccentColor] = useState<string>('#f59e0b'); // amber-500
  const [watermarkText, setWatermarkText] = useState<string>('@MinutoComDeus');
  const [logoType, setLogoType] = useState<'bible' | 'cross' | 'heart' | 'none'>('cross');
  
  // Backdrop State
  const [backgroundPresetId, setBackgroundPresetId] = useState<ThemePresetId>('celestial');
  const [customBackdropUrl, setCustomBackdropUrl] = useState<string | null>(null);
  const [useMultiBackdrops, setUseMultiBackdrops] = useState<boolean>(false);
  const [selectedConfigFrame, setSelectedConfigFrame] = useState<'title' | 'verse' | 'reflection'>('title');
  const [multiframeImages, setMultiframeImages] = useState<{ id: string; url: string; name: string }[]>([]);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');

  // Ref and scrolls for multiframe image sliding ("caixa de rolagem")
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [scrollRatio, setScrollRatio] = useState<number>(0);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) {
        setScrollRatio(scrollLeft / maxScroll);
      } else {
        setScrollRatio(0);
      }
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setScrollRatio(val);
    if (scrollContainerRef.current) {
      const { scrollWidth, clientWidth } = scrollContainerRef.current;
      const maxScroll = scrollWidth - clientWidth;
      scrollContainerRef.current.scrollLeft = val * maxScroll;
    }
  };

  // Derived backdrop URLs for Slide sections
  const backdropTitleUrl = multiframeImages[0]?.url || STOCK_PRESETS[0].url;
  const backdropVerseUrl = multiframeImages[1]?.url || multiframeImages[0]?.url || STOCK_PRESETS[1].url;
  const backdropReflectionUrl = multiframeImages[2]?.url || multiframeImages[1]?.url || multiframeImages[0]?.url || STOCK_PRESETS[2].url;

  const [backgroundMovement, setBackgroundMovement] = useState<'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'static'>('zoom-in');
  const [aiImagePrompt, setAiImagePrompt] = useState<string>(
    "A majestic landscape of deep cosmos night with golden bright sunrays shining through high clouds"
  );

  // Active slideshow player properties
  const [activeSlide, setActiveSlide] = useState<number>(0); // 0: Title, 1: Verse, 2: Reflection
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(4); // seconds per slide
  const [progress, setProgress] = useState<number>(0);
  
  // AI metadata outputs
  const [hashtags, setHashtags] = useState<string[]>([
    '#DeusNoControle', '#VersiculoDoDia', '#ShortsCristao', '#FéEmAção', '#Gospel'
  ]);
  const [youtubeDescription, setYoutubeDescription] = useState<string>(
    "Que esta mensagem bíblica fale profundamente ao seu coração neste dia. Deixe seu amém nos comentários, se inscreva para receber palavras diárias de sabedoria e compartilhe com um amigo que precisa de paz hoje!\n\nSiga-nos para mais mensagens edificantes de fé."
  );

  // Audio state
  const [voiceName, setVoiceName] = useState<'Kore' | 'Zephyr' | 'Puck' | 'Charon' | 'Fenrir'>('Kore');
  const [voiceAudioBase64, setVoiceAudioBase64] = useState<string | null>(null);
  const [localSpeechFallback, setLocalSpeechFallback] = useState<boolean>(false);
  const [activeAudioState, setActiveAudioState] = useState<AudioPlayState | null>(null);

  // Search Verses AI Dialog state
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [searchTopic, setSearchTopic] = useState<string>("gratidão");
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>(PRESET_VERSES.slice(0, 5));
  const [isSearchingVerses, setIsSearchingVerses] = useState<boolean>(false);

  // Loading states
  const [isGeneratingContent, setIsGeneratingContent] = useState<boolean>(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<boolean>(false);
  const [isExportingVideo, setIsExportingVideo] = useState<boolean>(false);
  const [videoExportProgress, setVideoExportProgress] = useState<number>(0);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [apiLogMessage, setApiLogMessage] = useState<string | null>(null);

  // Synchronized Caption Playback States
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [totalPlaybackDuration, setTotalPlaybackDuration] = useState<number>(15);
  const [audioStartCtxTime, setAudioStartCtxTime] = useState<number | null>(null);

  // Refs for tracking timer intervals and audio instances
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const currentImageUrl = customBackdropUrl || STOCK_PRESETS.find(p => p.id === backgroundPresetId)?.url || STOCK_PRESETS[0].url;

  const getBackdropForSlide = (slideIdx: number) => {
    if (!useMultiBackdrops) return currentImageUrl;
    if (slideIdx === 0) return backdropTitleUrl;
    if (slideIdx === 1) return backdropVerseUrl;
    return backdropReflectionUrl;
  };

  const getBackgroundTransform = () => {
    const p = totalPlaybackDuration > 0 ? playbackTime / totalPlaybackDuration : 0;
    if (backgroundMovement === 'zoom-in') {
      return `scale(${1.0 + 0.12 * p})`;
    }
    if (backgroundMovement === 'zoom-out') {
      return `scale(${1.12 - 0.12 * p})`;
    }
    if (backgroundMovement === 'pan-left') {
      return `scale(1.15) translateX(${-4 * p}%)`;
    }
    if (backgroundMovement === 'pan-right') {
      return `scale(1.15) translateX(${-4 + 4 * p}%)`;
    }
    return 'scale(1.0)';
  };

  // --- SUBTITLE & SLIDES SYNCHRONIZATION ENGINE CALCULATIONS ---
  const { titleDur, verseDur, reflectionDur } = calculateSlideDurations(title, verse, reflection, totalPlaybackDuration);
  const reflectionPagesList = splitTextIntoPages(reflection, 24);
  const timeline = buildNarrationTimeline(title, verse, reflection);

  const currentUnitIdx = isPlaying
    ? Math.min(timeline.length - 1, Math.floor((playbackTime / totalPlaybackDuration) * timeline.length))
    : -1;
  const currentUnit = currentUnitIdx >= 0 ? timeline[currentUnitIdx] : null;

  // Determine shown slide index (matches export timing perfectly)
  const currentActiveSlideShown = (() => {
    if (!isPlaying) return activeSlide; // fall back to manual bullet select when paused
    if (!currentUnit) return 0;
    if (currentUnit.type === 'title' || currentUnit.type === 'pause_title') return 0;
    if (currentUnit.type === 'intro' || currentUnit.type === 'verse' || currentUnit.type === 'pause_verse') return 1;
    return 2;
  })();

  // 2. Derive index of currently spoken word (per-slide / per-page)
  // For Slide 0 (Title)
  const activeTitleWordIdx = isPlaying && currentUnit && currentUnit.type === 'title' 
    ? currentUnit.indexInSection 
    : -1;

  // For Slide 1 (Verse)
  const activeVerseWordIdx = isPlaying && currentUnit && currentUnit.type === 'verse' 
    ? currentUnit.indexInSection 
    : -1;

  // For Slide 2 (Reflection page)
  const globalRefIdx = isPlaying && currentUnit && currentUnit.type === 'reflection' 
    ? currentUnit.indexInSection 
    : -1;

  const { pageIdx, relativeIdx, pageText } = getPageAndRelativeIndexForWord(globalRefIdx, reflectionPagesList);
  
  const currentReflectionPageIdx = isPlaying ? pageIdx : 0;
  const currentReflectionPageTextShown = isPlaying ? pageText : (reflectionPagesList[0] || '');
  const activeReflectionWordIdx = isPlaying ? relativeIdx : -1;

  // Render synchronized HTML helper function
  const renderSynchronizedWordsMarkup = (textStr: string | null | undefined, _activeWordIndex: number) => {
    const safeText = textStr || "";
    return <span>{safeText}</span>;
  };

  // Track key information
  useEffect(() => {
    // Clear any active play intervals on unmount
    return () => {
      stopPlayback();
    };
  }, []);

  // Synchronize the frame config selection tab to follow the active playing slide automatically
  useEffect(() => {
    if (useMultiBackdrops) {
      if (currentActiveSlideShown === 0) setSelectedConfigFrame('title');
      else if (currentActiveSlideShown === 1) setSelectedConfigFrame('verse');
      else if (currentActiveSlideShown === 2) setSelectedConfigFrame('reflection');
    }
  }, [currentActiveSlideShown, useMultiBackdrops]);

  // Track playbackTime in a ref so background interval can access it without restarting
  const playbackTimeRef = useRef<number>(0);
  playbackTimeRef.current = playbackTime;

  // --- AUTOMATED PREVIEW CAROUSEL ENGINE (PREMIUM HARMONIZED CAPTIONS) ---
  useEffect(() => {
    let intervalId: any = null;
    
    if (isPlaying) {
      let lastTick = performance.now();
      
      intervalId = setInterval(() => {
        const now = performance.now();
        const delta = (now - lastTick) / 1000;
        lastTick = now;
        
        let newPlaybackTime = 0;
        if (activeAudioState) {
          // PERFECT CLOCK SYNCHRONY: Sync with actual Web Audio Context elapsed time
          if (audioStartCtxTime !== null) {
            const elapsed = activeAudioState.audioCtx.currentTime - audioStartCtxTime;
            newPlaybackTime = Math.min(activeAudioState.duration, elapsed);
          }
        } else {
          // Fallback smooth visual simulation
          newPlaybackTime = playbackTimeRef.current + delta;
          if (newPlaybackTime >= totalPlaybackDuration) {
            if (localSpeechFallback) {
              // Wait for native speech synthesis "onend" event
              newPlaybackTime = totalPlaybackDuration;
            } else {
              newPlaybackTime = 0; // endless visual loop
            }
          }
        }
        
        setPlaybackTime(newPlaybackTime);
        const percent = totalPlaybackDuration > 0 ? (newPlaybackTime / totalPlaybackDuration) * 100 : 0;
        setProgress(percent);
      }, 30); // 33 FPS smooth synchronization updates
    } else {
      setPlaybackTime(0);
      setProgress(0);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPlaying, activeAudioState, audioStartCtxTime, totalPlaybackDuration, localSpeechFallback]);

  const stopPlaybackIntervals = () => {
    // Left for backwards compatibility, actual loops handled in useEffect
  };

  const startPlayback = () => {
    setIsPlaying(true);
    setProgress(0);
    setPlaybackTime(0);
    // If voice tracks are decoded in state, trigger web audio sync
    if (voiceAudioBase64 && !activeAudioState) {
      triggerAudioPlayBackend();
    } else if (localSpeechFallback) {
      triggerAudioPlayLocalSpeech();
    } else {
      // Direct visual simulator: estimate text read time (approx 2.5 words per second)
      const totalWords = (title + " " + verse + " " + reflection).split(/\s+/).length;
      const estDuration = Math.max(15, Math.min(180, totalWords / 2.5));
      setTotalPlaybackDuration(estDuration);
      setAudioStartCtxTime(null);
    }
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    setProgress(0);
    setPlaybackTime(0);
    
    // Stop raw PCM audio node completely to prevent overlapping audio ctx buffers
    if (activeAudioState) {
      try {
        activeAudioState.source.disconnect();
        activeAudioState.source.stop();
      } catch (e) {}
      setActiveAudioState(null);
    }
    // Stop local browser speech synthesis fallback
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  // --- TRIGGER WEB AUDIO API PCM PLAY ---
  const triggerAudioPlayBackend = async () => {
    if (!voiceAudioBase64) return;
    
    // Halt any running node first
    if (activeAudioState) {
      try { activeAudioState.source.stop(); } catch (e) {}
    }

    const pcmState = await playPcmBase64(voiceAudioBase64);
    if (pcmState) {
      setActiveAudioState(pcmState);
      setTotalPlaybackDuration(pcmState.duration);
      setAudioStartCtxTime(pcmState.audioCtx.currentTime);
      setPlaybackTime(0);
      pcmState.source.start();
      
      pcmState.source.onended = () => {
        stopPlayback();
      };
    }
  };

  // Switch slides while generating audio
  const triggerAudioPlayLocalSpeech = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    const textToRead = `${title}. O versículo de hoje é: ${verse}. ${reflection}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.95;
    
    const wordCount = textToRead.split(/\s+/).length;
    const estDuration = Math.max(15, Math.min(180, wordCount / 2.5));
    setTotalPlaybackDuration(estDuration);
    setAudioStartCtxTime(null);
    setPlaybackTime(0);

    utterance.onend = () => {
      stopPlayback();
    };
    
    window.speechSynthesis.speak(utterance);
  };

  // --- ACTION: SUGGEST BIBLE VERSES BY MOOD OR SENTIMENT (Express Call) ---
  const handleQuerySuggestedVerses = async () => {
    if (!searchTopic.trim()) return;
    setIsSearchingVerses(true);
    setApiLogMessage("Consultando teologia bíblica inteligente por temas...");
    
    // Get array of reference titles to exclude from current screen options
    const currentRefs = searchSuggestions ? searchSuggestions.map(v => v.reference) : [];
    
    try {
      const response = await fetch('/api/gemini/suggest-verses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          theme: searchTopic,
          excludeReferences: currentRefs
        }),
      });

      if (!response.ok) {
        throw new Error('Falha na requisição ao servidor.');
      }

      const data = await response.json();
      if (data.list && Array.isArray(data.list)) {
        setSearchSuggestions(data.list);
        setApiLogMessage(`Encontrados ${data.list.length} versículos inspiradores!`);
      } else {
        throw new Error('Formato da resposta inválido.');
      }
    } catch (error: any) {
      console.error(error);
      setApiLogMessage("Erro ao buscar com a API. Usando catálogo integrado de backups.");
      
      const lowercaseExcludes = currentRefs.map(ref => ref.toLowerCase());
      
      // Fallback preloaded excluding currently displayed references
      const filterPresets = PRESET_VERSES.filter(v => 
        (v.theme.toLowerCase().includes(searchTopic.toLowerCase()) || 
         v.text.toLowerCase().includes(searchTopic.toLowerCase())) &&
        !lowercaseExcludes.includes(v.reference.toLowerCase())
      );
      
      if (filterPresets.length > 0) {
        setSearchSuggestions(filterPresets.slice(0, 5));
      } else {
        // If all matching presets are exhausted, shuffle and pick from remaining
        const remainingBackup = PRESET_VERSES.filter(v => !lowercaseExcludes.includes(v.reference.toLowerCase()));
        const pool = remainingBackup.length > 0 ? remainingBackup : PRESET_VERSES;
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        setSearchSuggestions(shuffled.slice(0, 5));
      }
    } finally {
      setIsSearchingVerses(false);
    }
  };

  // --- ACTION: GENERATE COMPLETE SOCIAL DEVOTIONAL CONTENT (Express Call) ---
  const handleGenerateScriptWithAI = async () => {
    setIsGeneratingContent(true);
    setApiLogMessage("Escrevendo roteiro devocional para vídeo de 30s...");
    
    try {
      const response = await fetch('/api/gemini/generate-short-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verse, reference }),
      });

      if (!response.ok) {
        throw new Error('Erro do servidor ao estruturar o roteiro.');
      }

      const data = await response.json();
      if (data.title) setTitle(data.title);
      if (data.reflection) setReflection(data.reflection);
      if (data.visualPrompt) setAiImagePrompt(data.visualPrompt);
      if (data.hashtags) setHashtags(data.hashtags);
      if (data.youtubeDescription) setYoutubeDescription(data.youtubeDescription);
      
      // Auto-invalidate old voice narration because script text changed!
      setVoiceAudioBase64(null);
      setApiLogMessage("Roteiro completado com sucesso! Use a seção Plano de Fundo para sincronizar a imagem ideal.");
    } catch (error: any) {
      console.error(error);
      setApiLogMessage("Atenção: Cota do Gemini indisponível (ou limite de requisições excedido). Geramos um roteiro inspirador local de backup para você continuar criando seu vídeo sem interrupções!");
      
      // Local prompt fallback creator
      setTitle("Encorajamento de Deus");
      setReflection(`Esta passagem nos lembra do cuidado infalível do Pai Celestial. Nele, encontramos paz para acalmar todas as ansiedades do coração e seguir em frente com perseverança. Compartilhe e abençoe um amigo hoje!`);
      setHashtags(['#PalavraDeHoje', '#FeFirme', '#DeusConforta', '#Bíblia', '#ShortsGospel']);
      setYoutubeDescription("Inscreva-se para meditações diárias inspiradoras! #shorts #gospel #esperanca");
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // --- ACTION: GENERATE VERTICAL WALLPAPER BY AI (Express Call) ---
  const handleGenerateAIBackdrop = async () => {
    if (!aiImagePrompt.trim()) return;
    setIsGeneratingImage(true);
    setApiLogMessage("Roteando para Gemini Imagen... Criando arte divina 9:16...");
    
    try {
      const response = await fetch('/api/gemini/generate-short-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiImagePrompt }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.detail || errJson.error || 'Erro no servidor de imagens.');
      }

      const data = await response.json();
      if (data.imageUrl) {
        if (useMultiBackdrops) {
          const newItem = {
            id: 'ai-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now(),
            url: data.imageUrl,
            name: `Arte IA ${multiframeImages.length + 1}`
          };
          setMultiframeImages((prev) => [...prev, newItem]);
          setApiLogMessage("Seu cenário bíblico por IA foi adicionado à galeria de imagens!");
        } else {
          setCustomBackdropUrl(data.imageUrl);
          setApiLogMessage("Seu cenário de plano de fundo exclusivo por IA foi carregado com sucesso!");
        }
      } else {
        throw new Error('Nenhum dado de imagem base64 retornado.');
      }
    } catch (error: any) {
      console.error(error);
      setApiLogMessage(`Não foi possível gerar a imagem: ${error.message}. Você ainda pode selecionar os lindos Presets Profissionais prontos.`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // --- ACTION: UPLOAD DEVICE IMAGE ---
  const handleDeviceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Por favor, selecione um arquivo de imagem válido (ex: PNG, JPG, JPEG).");
      setApiLogMessage("O arquivo selecionado não é uma imagem válida.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (useMultiBackdrops) {
          const newItem = {
            id: 'device-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now(),
            url: reader.result,
            name: file.name
          };
          setMultiframeImages((prev) => [...prev, newItem]);
          setApiLogMessage(`Imagem "${file.name}" adicionada à galeria multiframe!`);
        } else {
          setCustomBackdropUrl(reader.result);
          setApiLogMessage("Sua imagem personalizada do dispositivo foi carregada com sucesso!");
        }
      }
    };
    reader.onerror = () => {
      setApiLogMessage("Erro ao ler a imagem do seu dispositivo.");
    };
    reader.readAsDataURL(file);
  };

  // --- ACTION: MULTI IMAGE UPLOAD FOR MULTIFRAME ---
  const handleMultiImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files) as File[];
    const newImages: { id: string; url: string; name: string }[] = [];
    let loadedCount = 0;

    filesArray.forEach((file: File) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          newImages.push({
            id: 'multi-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now(),
            url: reader.result,
            name: file.name
          });
        }
        loadedCount++;
        if (loadedCount === filesArray.length) {
          setMultiframeImages((prev) => [...prev, ...newImages]);
          setApiLogMessage(`${newImages.length} imagens adicionadas com sucesso! Arraste para ordená-las.`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // --- ACTIONS: MULTIFRAME DRAG AND DROP SORTING ---
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.currentTarget.classList.add('opacity-40');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-40');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // crucial to enable dropping
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData('text/plain');
    if (sourceIndexStr === '') return;
    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (sourceIndex === targetIndex) return;

    setMultiframeImages((prev) => {
      const updated = [...prev];
      const [removed] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, removed);
      return updated;
    });
    setApiLogMessage("Ordem dos trechos alterada com sucesso!");
  };

  const handleRemoveMultiframeImage = (id: string) => {
    setMultiframeImages((prev) => prev.filter((img) => img.id !== id));
    setApiLogMessage("Imagem removida do Multiframe.");
  };

  const handleClearAllMultiframeImages = () => {
    setMultiframeImages([]);
    setApiLogMessage("Todas as imagens do Multiframe foram removidas.");
  };

  // --- ACTION: SYNTHESIZE SPEECH USING GEMINI TTS (Express Call) ---
  const handleGenerateTTSNarration = async () => {
    setIsGeneratingAudio(true);
    setApiLogMessage(`Iniciando oratória sintética de IA voz: ${voiceName}...`);
    
    // We synthesize Title + Verse + Reflection for a complete high-retention narration experience!
    const compositionText = `${title}. O versículo de hoje é: ${verse}. ${reflection}`;
    
    try {
      const response = await fetch('/api/gemini/generate-narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: compositionText, voice: voiceName }),
      });

      if (!response.ok) {
        throw new Error('Nenhuma resposta positiva de áudio PCM.');
      }

      const data = await response.json();
      if (data.audioBase64) {
        setVoiceAudioBase64(data.audioBase64);
        setApiLogMessage("Aúdio de orador por IA carregado de forma brilhante! Dê Play no Shorts para testar de ouvido!");
        
        // Auto trigger play!
        setIsPlaying(true);
        // Play using base64 Web Audio PCM
        const state = await playPcmBase64(data.audioBase64);
        if (state) {
          setActiveAudioState(state);
          state.source.start();
          state.source.onended = () => {
            stopPlayback();
          };
        }
      } else {
        throw new Error('Base64 de áudio vazio.');
      }
    } catch (error: any) {
      console.error(error);
      setApiLogMessage("Atenção: Limite do sintetizador Gemini TTS atingido. Ativamos a narração com o leitor de voz nativo do seu navegador para reproduzir o áudio sem limitações!");
      setLocalSpeechFallback(true);
      
      // Auto trigger play locally!
      setIsPlaying(true);
      triggerAudioPlayLocalSpeech();
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // --- ACTION: COPY PASTE HELPER ---
  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // --- ACTION: EXPORT INSTANT GRAPHIC --
  const handleExportLandscape = async () => {
    const isWidescreen = aspectRatio === '16:9';
    setApiLogMessage(`Processando estúdio de imagem ${isWidescreen ? 'horizontal 16:9' : 'vertical 9:16'} de ultra-alta resolução...`);
    
    await exportToImage(
      verse,
      reference,
      reflection,
      currentImageUrl,
      {
        fontFamily,
        textAlignment,
        textColor,
        overlayOpacity,
        textPosition,
        accentColor,
        watermarkText,
        title,
        logoType,
        aspectRatio
      }
    );
    
    setApiLogMessage("Imagem exportada! Pronto para publicação no Feed, Stories ou Carrosséis cristãos.");
  };

  // --- ACTION: EXPORT VIDEO (MP4/WebM) --
  const handleExportVideo = async (preferMp4: boolean = false) => {
    setIsExportingVideo(true);
    setVideoExportProgress(1);
    const formatLabel = preferMp4 ? "MP4 (Alta compatibilidade)" : "WebM (Alta performance)";
    const resLabel = aspectRatio === '16:9' ? "horizontal 16:9" : "vertical 9:16";
    setApiLogMessage(`Iniciando renderização de vídeo ${resLabel} formato ${formatLabel}... Por favor, aguarde.`);
    
    try {
      const { url: videoUrl, mimeType } = await exportToVideo(
        verse,
        reference,
        reflection,
        currentImageUrl,
        {
          fontFamily,
          textAlignment,
          textColor,
          overlayOpacity,
          textPosition,
          accentColor,
          watermarkText,
          title,
          logoType,
          useMultiBackdrops,
          backdropTitleUrl,
          backdropVerseUrl,
          backdropReflectionUrl,
          backgroundMovement,
          aspectRatio
        },
        voiceAudioBase64,
        preferMp4,
        (percent) => {
          setVideoExportProgress(percent);
        }
      );
      
      const fileExt = preferMp4 ? "mp4" : "webm";
      const link = document.createElement('a');
      link.download = `shorts_cristao_${reference.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${fileExt}`;
      link.href = videoUrl;
      link.click();
      
      setApiLogMessage(`Vídeo vertical (.${fileExt}) de alta qualidade gerado e baixado com sucesso com áudio mesclado!`);
    } catch (error: any) {
      console.error(error);
      setApiLogMessage("Desculpe, ocorreu um erro ao renderizar o vídeo no seu navegador: " + error.message);
    } finally {
      setIsExportingVideo(false);
      setVideoExportProgress(0);
    }
  };

  const handleExportNarrationAudio = () => {
    if (!voiceAudioBase64) {
      setApiLogMessage("Gere o áudio da narração com IA primeiro antes de exportar.");
      alert("Gere o áudio da narração com IA primeiro no painel de Áudio & Narração.");
      return;
    }
    try {
      const audioUrl = exportToWav(voiceAudioBase64);
      const link = document.createElement('a');
      link.download = `narracao_crista_${reference.toLowerCase().replace(/[^a-z0-9]/g, '_')}.wav`;
      link.href = audioUrl;
      link.click();
      setApiLogMessage("Áudio da narração exportado com qualidade de estúdio WAV!");
    } catch (err: any) {
      console.error(err);
      setApiLogMessage("Falha ao exportar áudio: " + err.message);
    }
  };

  const loadPresetVerse = (preset: any) => {
    setVerse(preset.text);
    setReference(preset.reference);
    // Refresh old state audio to avoid text mismatch
    setVoiceAudioBase64(null);
    setApiLogMessage(`Carregado versículo sobre: ${preset.theme}`);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-black/10 selection:text-black">
      
      {/* HEADER BANNER */}
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white font-bold shadow-sm">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-display font-semibold text-[#1A1A1A] tracking-tight">
                Criador de Shorts Cristãos
              </h1>
              <p className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">
                BIBLICAL SHORTS GENERATOR • COMPOSIÇÕES VERTICAIS 9:16
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setIsSearchModalOpen(true);
                handleQuerySuggestedVerses();
              }}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200/80 rounded-full transition-all cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-gray-600" />
              <span>Explorar Versículos por Tema</span>
            </button>
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-[10px] text-gray-500 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Servidores Ativos</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* CONTEXT LOG BAR */}
        {apiLogMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between gap-3 shadow-xs"
          >
            <div className="flex items-center gap-2 text-xs text-amber-800 font-sans">
              <span className="inline-block animate-spin text-amber-500">⚡</span>
              <span><strong>Status:</strong> {apiLogMessage}</span>
            </div>
            <button 
              onClick={() => setApiLogMessage(null)}
              className="text-amber-700 hover:text-black text-xs px-2.5 py-1 rounded-md bg-amber-100 hover:bg-amber-200 transition-colors"
            >
              Ok
            </button>
          </motion.div>
        )}

        {/* WORKSPACE PANELS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDEBAR: CREATOR COMPOSER - 7 SPAN */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* COMPONENT 1: CHOOSE THEME WORD OR QUICK PRESENTS */}
            <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1 px-2 rounded-lg bg-gray-100 text-gray-800 font-mono text-xs font-semibold">01</span>
                  <h2 className="text-sm font-display font-bold text-gray-950 tracking-tight">
                    Escolha o Assunto e Versículo
                  </h2>
                </div>
                <BookOpen className="w-4 h-4 text-gray-400" />
              </div>

              {/* QUICK THEME TAGS */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                  Selecione um tema bíblico de impacto rápido:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_VERSES.slice(0, 6).map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => loadPresetVerse(preset)}
                      className={`text-xs px-4 py-1.5 rounded-full font-medium transition-all border cursor-pointer ${
                        verse === preset.text 
                          ? 'bg-black text-white border-black font-semibold shadow-xs' 
                          : 'bg-white hover:bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {preset.theme}
                    </button>
                  ))}
                </div>
              </div>

              {/* MANUAL INPUT */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                    Texto do Versículo Principal:
                  </label>
                  <textarea
                    rows={2}
                    value={verse}
                    onChange={(e) => {
                      setVerse(e.target.value);
                      setVoiceAudioBase64(null); // invalidate audio
                    }}
                    placeholder="Cole ou redija o versículo inspirador..."
                    className="w-full bg-gray-50 text-gray-900 rounded-xl p-3 text-xs border border-gray-200 focus:border-black focus:outline-none focus:ring-1 focus:ring-black/20 resize-y leading-relaxed"
                  />
                </div>
                <div className="flex flex-col justify-between">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                      Referência (Cap:Ver):
                    </label>
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => {
                        setReference(e.target.value);
                        setVoiceAudioBase64(null);
                      }}
                      placeholder="ex: João 3:16"
                      className="w-full bg-gray-50 text-gray-900 rounded-xl p-3 text-xs border border-gray-200 focus:border-black focus:outline-none focus:ring-1 focus:ring-black/20"
                    />
                  </div>
                  
                  <button 
                    onClick={() => {
                      setIsSearchModalOpen(true);
                      handleQuerySuggestedVerses();
                    }}
                    className="w-full mt-3 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-gray-800 hover:text-black border border-dashed border-gray-300 hover:border-gray-400 rounded-xl transition-all bg-gray-50/50"
                  >
                    <Search className="w-3.5 h-3.5 text-gray-500" />
                    <span>Inspirar por IA</span>
                  </button>
                </div>
              </div>
            </section>

            {/* COMPONENT 2: THEMED GENERATION SYSTEM (SCRIPT / REFLECTION) */}
            <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1 px-2 rounded-lg bg-gray-100 text-gray-800 font-mono text-xs font-semibold">02</span>
                  <h2 className="text-sm font-display font-bold text-gray-950 tracking-tight">
                    Criação de Reflexão & Copylines
                  </h2>
                </div>
                
                {/* GEMINI LOADER GRAPHIC */}
                <button
                  onClick={handleGenerateScriptWithAI}
                  disabled={isGeneratingContent}
                  type="button"
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-black hover:bg-gray-850 text-white rounded-full shadow-xs disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isGeneratingContent ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Processando Redação...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Refinar Roteiro Completo por IA</span>
                    </>
                  )}
                </button>
              </div>

              {/* SCRIPT CONTENT PANEL */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                      Título do Devocional:
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="ex: Cura Divina hoje"
                      className="w-full bg-gray-50 text-gray-900 rounded-xl p-3 text-xs border border-gray-200 focus:border-black focus:outline-none focus:ring-1 focus:ring-black/20 font-bold"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                      Voz de Apoio / Siga-nos Watermark:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        placeholder="ex: @PalavraPreciosa"
                        className="flex-1 bg-gray-50 text-gray-900 rounded-xl p-3 text-xs border border-gray-200 focus:border-black focus:outline-none focus:ring-1 focus:ring-black/20 text-center font-mono"
                      />
                      <select 
                        value={logoType}
                        onChange={(e: any) => setLogoType(e.target.value)}
                        className="bg-white border border-gray-200 text-xs text-slate-800 p-2 rounded-xl focus:outline-none focus:border-black/50"
                      >
                        <option value="cross">Emblema: Cruz ✝</option>
                        <option value="bible">Emblema: Bíblia 📖</option>
                        <option value="heart">Emblema: Amor 💖</option>
                        <option value="none">Nenhum</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                    Mensagem de Reflexão Narrada para Shorts (Impactante de até 65 palavras):
                  </label>
                  <textarea
                    rows={3}
                    value={reflection}
                    onChange={(e) => {
                      setReflection(e.target.value);
                      setVoiceAudioBase64(null); // invalidate audio
                    }}
                    placeholder="Uma reflexão explicativa do texto sagrado..."
                    className="w-full bg-gray-50 text-gray-900 rounded-xl p-3 text-xs border border-gray-200 focus:border-black focus:outline-none focus:ring-1 focus:ring-black/20 resize-y leading-relaxed"
                  />
                  <p className="text-[10px] text-right text-gray-400 font-mono mt-1">
                    Contagem estimada de caracteres: {reflection.length} (Recomendado abaixo de 350)
                  </p>
                </div>
              </div>
            </section>

            {/* COMPONENT 3: VISUAL WALLPAPER & DESIGN STYLES */}
            <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1 px-2 rounded-lg bg-gray-100 text-gray-800 font-mono text-xs font-semibold">03</span>
                  <h2 className="text-sm font-display font-bold text-gray-950 tracking-tight">
                    Plano de Fundo & Aparência Estilizada
                  </h2>
                </div>
                <ImageIcon className="w-4 h-4 text-gray-400" />
              </div>

              {/* WALLPAPER OPTION TABS */}
              <div className="space-y-4">
                {/* BACKDROP MODE SWITCH & MOVEMENT STYLE */}
                <div className="bg-gray-50 border border-gray-250/50 p-4 rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">🎞️ Modo do Plano de Fundo:</span>
                      <span className="text-[10px] text-gray-500">Escolha entre imagem fixa ou trechos multimídia (Slide show)!</span>
                    </div>
                    
                    <div className="flex bg-gray-200/50 p-1 rounded-xl w-full sm:w-auto border border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setUseMultiBackdrops(false);
                          setApiLogMessage("Plano de fundo unificado (Imagem Única) ativado.");
                        }}
                        className={`flex-1 sm:flex-none px-3.5 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${!useMultiBackdrops ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                      >
                        Imagem Única
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUseMultiBackdrops(true);
                          setApiLogMessage("Modo de Multi-Imagens (Trechos Dinâmicos) ativado.");
                        }}
                        className={`flex-1 sm:flex-none px-3.5 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${useMultiBackdrops ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                      >
                        🎬 Multiframe
                      </button>
                    </div>
                  </div>

                  {useMultiBackdrops && (
                    <div className="bg-blue-50/50 border border-blue-200/50 rounded-2xl p-4 space-y-4 text-left">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-blue-700" />
                            <span className="text-xs font-bold text-blue-900 uppercase tracking-tight">
                              Sequência do Vídeo Multiframe
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-500 block">
                            Arraste as imagens abaixo para mudar qual cenário aparece em cada slide!
                          </span>
                        </div>
                        {multiframeImages.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearAllMultiframeImages}
                            className="text-[10px] text-red-600 hover:text-red-850 font-bold hover:underline bg-white border border-red-200 px-2 py-1 rounded-lg shadow-xs cursor-pointer"
                          >
                            Remover Todas
                          </button>
                        )}
                      </div>

                      {/* SORTABLE GRID (DRAGGABLE PORTRAITS) */}
                      {multiframeImages.length > 0 ? (
                        <div className="space-y-3">
                          <div 
                            ref={scrollContainerRef}
                            onScroll={handleScroll}
                            className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent scroll-smooth"
                          >
                            <div className="flex gap-2.5 min-w-max px-1 pt-1">
                            {multiframeImages.map((imgItem, idx) => {
                              let targetLabel = "";
                              let labelClass = "";
                              if (idx === 0) {
                                targetLabel = "1º Slide: Título";
                                labelClass = "bg-amber-500 text-white font-bold text-[9px]";
                              } else if (idx === 1) {
                                targetLabel = "2º Slide: Versículo";
                                labelClass = "bg-blue-600 text-white font-bold text-[9px]";
                              } else if (idx === 2) {
                                targetLabel = "3º Slide: Reflexão";
                                labelClass = "bg-emerald-600 text-white font-bold text-[9px]";
                              } else {
                                targetLabel = `Fila #${idx + 1} (Reserva)`;
                                labelClass = "bg-gray-400 text-white text-[8px]";
                              }

                              return (
                                <div
                                  key={imgItem.id}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, idx)}
                                  onDragEnd={handleDragEnd}
                                  onDragOver={handleDragOver}
                                  onDrop={(e) => handleDrop(e, idx)}
                                  className="relative group w-24 aspect-[9/16] rounded-xl overflow-hidden border border-gray-250 bg-slate-950 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-transform flex flex-col justify-between select-none"
                                  title="Clique e arraste para ordenar!"
                                >
                                  {/* Thumbnail Backdrop */}
                                  <img 
                                    src={imgItem.url} 
                                    alt={imgItem.name} 
                                    className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none z-0" 
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/60 z-10 pointer-events-none" />

                                  {/* Label Block */}
                                  <div className="relative z-20 p-1.5 flex justify-between items-start">
                                    <span className={`px-2 py-0.5 rounded-full shadow-xs leading-none ${labelClass}`}>
                                      {targetLabel}
                                    </span>
                                  </div>

                                  {/* Footer Action & Filename */}
                                  <div className="relative z-20 p-1 flex items-center justify-between gap-1">
                                    <span className="text-[8.5px] font-mono text-white/95 truncate flex-1 block">
                                      {imgItem.name || "Imagem"}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveMultiframeImage(imgItem.id)}
                                      className="p-1 rounded bg-black/60 hover:bg-red-500 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                      title="Remover Imagem"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* DYNAMIC SCROLL SLIDER RANGE BAR */}
                        {multiframeImages.length > 3 && (
                          <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border border-gray-150 rounded-xl shadow-3xs">
                            <span className="text-[10px] font-mono font-bold text-gray-500 uppercase shrink-0">Navegar Rolo de Imagens:</span>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={scrollRatio}
                              onChange={handleSliderChange}
                              className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black focus:outline-none"
                            />
                            <span className="text-[10px] font-mono text-gray-500 shrink-0 font-bold w-10 text-right">
                              {Math.round(scrollRatio * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                      ) : (
                        <div className="border border-dashed border-gray-300 rounded-xl p-5 text-center bg-gray-50/50 flex flex-col items-center justify-center space-y-2">
                          <p className="text-xs text-gray-500 font-medium">Sua galeria do multiframe está vazia.</p>
                          <p className="text-[10px] text-gray-400">Carregue suas próprias imagens abaixo ou clique nos Presets listados para montá-la!</p>
                        </div>
                      )}

                      {/* MULTIPLE IMAGE UPLOAD ZONE */}
                      <div className="relative border border-dashed border-blue-300 hover:border-blue-400 bg-white rounded-xl p-4 text-center cursor-pointer transition-all hover:bg-blue-50/20">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleMultiImageUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          title="Selecione múltiplos arquivos de imagem"
                        />
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <div className="p-1.5 bg-blue-50 rounded-full border border-blue-100">
                            <ImagePlus className="w-4 h-4 text-blue-600" />
                          </div>
                          <p className="text-xs font-bold text-blue-950">Carregar Múltiplas Imagens de Uma Vez</p>
                          <p className="text-[9.5px] text-slate-500">
                            Selecione várias fotos do seu dispositivo e arraste-as na ordem desejada!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MOVEMENT SELECTOR */}
                  <div className="pt-3 border-t border-gray-200 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">🎥 Efeito de Movimento de Câmera:</span>
                      <span className="text-[10px] text-gray-500">Adicione um movimento de câmera elegante (Ken Burns) ao vídeo!</span>
                    </div>
                    
                    <select
                      value={backgroundMovement}
                      onChange={(e: any) => {
                        setBackgroundMovement(e.target.value);
                        setApiLogMessage(`Efeito de movimento alterado para: ${e.target.value}`);
                      }}
                      className="w-full sm:w-48 bg-white border border-gray-250 text-xs text-slate-800 p-2 rounded-xl focus:outline-none focus:border-black/50 font-medium cursor-pointer"
                    >
                      <option value="zoom-in">🔍 Zoom Lento (Aproximar)</option>
                      <option value="zoom-out">🔎 Zoom Out (Afastar)</option>
                      <option value="pan-left">⬅️ Deslocar para Esquerda</option>
                      <option value="pan-right">➡️ Deslocar para Direita</option>
                      <option value="static">🔲 Sem Movimento (Estático)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] font-mono text-gray-400 uppercase block font-bold">
                    {useMultiBackdrops ? "Clique para adicionar presets rápidos à galeria:" : "Presets Temáticos de Ótimo Contraste Vertical:"}
                  </span>
                  {customBackdropUrl && !useMultiBackdrops && (
                    <button 
                       onClick={() => {
                        setCustomBackdropUrl(null);
                        setApiLogMessage("Retornado para preset padrão.");
                      }}
                      className="text-[10px] font-mono text-gray-600 hover:text-black hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Limpar Criação IA</span>
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {STOCK_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        if (useMultiBackdrops) {
                          const newItem = {
                            id: 'preset-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now(),
                            url: preset.url,
                            name: preset.name
                          };
                          setMultiframeImages((prev) => [...prev, newItem]);
                          setApiLogMessage(`Preset "${preset.name}" adicionado à sequência multiframe!`);
                        } else {
                          setBackgroundPresetId(preset.id);
                          setCustomBackdropUrl(null);
                        }
                      }}
                      className={`relative aspect-[9/16] rounded-xl overflow-hidden group border-2 transition-all cursor-pointer ${
                        (() => {
                          if (useMultiBackdrops) {
                            const isAdded = multiframeImages.some(img => img.url === preset.url);
                            return isAdded ? 'border-blue-500 scale-102 shadow-md ring-2 ring-blue-400/25 font-bold' : 'border-gray-200 opacity-70 hover:opacity-100';
                          } else {
                            return !customBackdropUrl && backgroundPresetId === preset.id 
                              ? 'border-black scale-105 shadow-sm' 
                              : 'border-gray-200 opacity-70 hover:opacity-100 hover:border-gray-400';
                          }
                        })()
                      }`}
                      title={preset.description}
                    >
                      <img 
                        src={preset.url} 
                        alt={preset.name} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-end justify-center p-1 text-[8px] font-display font-medium text-white text-center select-none truncate">
                        {preset.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* UPLOAD IMAGEM DO DISPOSITIVO */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-gray-850 font-bold">
                    <Upload className="w-4 h-4 text-gray-500" />
                    <span>Usar Imagem do Dispositivo (9:16)</span>
                  </div>
                  {customBackdropUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomBackdropUrl(null);
                        setApiLogMessage("Retornado para o preset padrão.");
                      }}
                      className="text-[10px] font-mono text-amber-600 hover:text-amber-800 font-bold hover:underline cursor-pointer"
                    >
                      Remover Personalizada
                    </button>
                  )}
                </div>
                
                <div className="relative border-2 border-dashed border-gray-300 hover:border-gray-400 bg-white rounded-xl p-4 text-center cursor-pointer transition-all hover:bg-gray-50/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDeviceImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <div className="p-1.5 bg-gray-50 rounded-full border border-gray-200">
                      <Upload className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                    <p className="text-xs font-semibold text-gray-700">Escolher ou Arrastar imagem</p>
                    <p className="text-[10px] text-gray-400 font-mono">PNG, JPG, JPEG (Proporção 9:16 recomendada)</p>
                  </div>
                </div>
              </div>

              {/* GEMINI IMAGEN GENERATOR */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 text-xs text-gray-800">
                    <Sparkles className="w-3.5 h-3.5 text-gray-700 animate-pulse" />
                    <span className="font-bold font-sans">Gerador de Imagens Bíblicas por IA</span>
                  </div>
                  <span className="text-[9px] font-mono text-gray-400">Desenvolvido por Gemini Imagen 2.5</span>
                </div>
                
                <p className="text-[10px] text-gray-500 leading-normal">
                  Personalize as artes de paisagem ou figuras celestiais escrevendo o prompt conceitual (em inglês para melhor resultado):
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiImagePrompt}
                    onChange={(e) => setAiImagePrompt(e.target.value)}
                    placeholder="Descreva o plano de fundo ideal que gostaria de visualizar..."
                    className="flex-1 bg-white text-gray-900 rounded-xl p-2.5 text-xs border border-gray-200 focus:outline-none focus:border-black/50"
                  />
                  <button
                    onClick={handleGenerateAIBackdrop}
                    disabled={isGeneratingImage}
                    className="px-4 py-2.5 text-xs font-bold bg-black hover:bg-gray-800 text-white rounded-xl shadow-xs disabled:opacity-50 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {isGeneratingImage ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Criando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        <span>Gerar 9:16</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* FONTS, ALIGNMENTS, SLIDERS */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
                <div className="flex items-center gap-1.5 text-xs text-gray-800 font-bold">
                  <Sliders className="w-4 h-4 text-gray-500" />
                  <span>Configuração de Formato e Tipografia</span>
                </div>

                {/* ASPECT RATIO SELECTOR */}
                <div className="border-b border-gray-200/60 pb-3.5">
                  <label className="text-[10px] font-mono font-bold uppercase text-gray-400 block mb-1.5">Proporção e Formato do Vídeo:</label>
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setAspectRatio('9:16');
                        setApiLogMessage("Formato de vídeo Retrato (9:16) selecionado para Shorts/Reels.");
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                        aspectRatio === '9:16'
                          ? 'bg-black text-white border-black shadow-xs'
                          : 'bg-white text-gray-600 border-gray-200 hover:text-black hover:bg-gray-50'
                      }`}
                    >
                      <span className="w-2.5 h-3.5 border border-current rounded-xs inline-block flex-shrink-0" />
                      <span>Retrato Vertical (9:16)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAspectRatio('16:9');
                        setApiLogMessage("Formato de vídeo Widescreen (16:9) selecionado para YouTube/Cinema.");
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                        aspectRatio === '16:9'
                          ? 'bg-black text-white border-black shadow-xs'
                          : 'bg-white text-gray-600 border-gray-200 hover:text-black hover:bg-gray-50'
                      }`}
                    >
                      <span className="w-3.5 h-2.5 border border-current rounded-xs inline-block flex-shrink-0" />
                      <span>Widescreen Horizontal (16:9)</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* FONT SELECTOR */}
                  <div>
                    <label className="text-[10px] font-mono font-bold uppercase text-gray-400 block mb-1.5">Fonte do Texto:</label>
                    <div className="flex rounded-xl bg-white p-0.5 border border-gray-200">
                      {(['serif', 'sans', 'mono'] as const).map((font) => (
                        <button
                          key={font}
                          onClick={() => setFontFamily(font)}
                          className={`flex-1 text-[11px] font-medium py-1.5 rounded-lg transition-all capitalize cursor-pointer ${
                            fontFamily === font ? 'bg-black text-white font-bold' : 'text-gray-500 hover:text-black'
                          }`}
                        >
                          {font === 'serif' ? 'Serifada' : font === 'sans' ? 'Simples' : 'Fira Mono'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ALIGN VALUES */}
                  <div>
                    <label className="text-[10px] font-mono font-bold uppercase text-gray-400 block mb-1.5">Posição Vertical:</label>
                    <div className="flex rounded-xl bg-white p-0.5 border border-gray-200">
                      {(['top', 'center', 'bottom'] as const).map((pos) => (
                        <button
                          key={pos}
                          onClick={() => setTextPosition(pos)}
                          className={`flex-1 text-[11px] font-medium py-1.5 rounded-lg transition-all capitalize cursor-pointer ${
                            textPosition === pos ? 'bg-black text-white font-bold' : 'text-gray-500 hover:text-black'
                          }`}
                        >
                          {pos === 'top' ? 'Topo' : pos === 'center' ? 'Centro' : 'Base'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* TEXT ALIGNMENT */}
                  <div>
                    <label className="text-[10px] font-mono font-bold uppercase text-gray-400 block mb-1.5">Alinhamento Horizontal:</label>
                    <div className="flex rounded-xl bg-white p-0.5 border border-gray-200">
                      {(['left', 'center', 'right'] as const).map((align) => (
                        <button
                          key={align}
                          onClick={() => setTextAlignment(align)}
                          className={`flex-1 text-[11px] font-medium py-1.5 rounded-lg transition-all capitalize cursor-pointer ${
                            textAlignment === align ? 'bg-black text-white font-bold' : 'text-gray-500 hover:text-black'
                          }`}
                        >
                          {align === 'left' ? 'Esq.' : align === 'center' ? 'Centro' : 'Dir.'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
                  {/* OVERLAY OPACITY SLIDER */}
                  <div className="md:col-span-2 space-y-1">
                    <div className="flex justify-between text-[10px] font-mono font-bold text-gray-400">
                      <span>ESCURECER PLANO DE FUNDO (OVERLAY):</span>
                      <span className="text-black font-bold">{overlayOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      value={overlayOpacity}
                      onChange={(e) => setOverlayOpacity(parseInt(e.target.value))}
                      className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                    />
                  </div>

                  {/* CUSTOM COLORS */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase text-gray-400 block">Cores de Destaque:</label>
                    <div className="flex gap-4">
                      {/* ACCENT AMBER/YELLOW PICKER */}
                      <label className="flex items-center gap-1.5 text-[11px] text-gray-600 cursor-pointer">
                        <input
                          type="color"
                          value={accentColor}
                          onChange={(e) => setAccentColor(e.target.value)}
                          className="w-5 h-5 rounded border border-gray-300 cursor-pointer bg-transparent"
                        />
                        <span>Brilho</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-[11px] text-gray-600 cursor-pointer">
                        <input
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-5 h-5 rounded border border-gray-300 cursor-pointer bg-transparent"
                        />
                        <span>Letras</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* COMPONENT 4: TTS AUDIO VOICE ENGINE */}
            <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1 px-2 rounded-lg bg-gray-100 text-gray-800 font-mono text-xs font-semibold">04</span>
                  <h2 className="text-sm font-display font-bold text-gray-950 tracking-tight">
                    Narração e Dublagem com Voz por IA
                  </h2>
                </div>
                <Volume2 className="w-4 h-4 text-gray-400" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ACTOR SELECTOR */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block pb-1">
                    Escolha de Locutor Espiritual:
                  </label>
                  <select
                    value={voiceName}
                    onChange={(e: any) => {
                      setVoiceName(e.target.value);
                      setVoiceAudioBase64(null); // invalidate audio cash
                      setLocalSpeechFallback(false);
                    }}
                    className="w-full bg-white text-xs text-gray-800 rounded-xl p-3 border border-gray-200 focus:outline-none focus:border-black font-medium"
                  >
                    <option value="Kore">🗣️ Kore - Voz Calorosa e Conchegante (Masculina)</option>
                    <option value="Zephyr">🗣️ Zephyr - Voz Profunda Geral (Masculina)</option>
                    <option value="Puck">🗣️ Puck - Oratoria Animada & Conversador (Feminina)</option>
                    <option value="Charon">🗣️ Charon - Tom Solene & Sacro (Narrador Clínico)</option>
                    <option value="Fenrir">🗣️ Fenrir - Clássico Expressivo (Grave)</option>
                  </select>
                  
                  <div className="p-2.5 bg-gray-50 rounded-xl text-[10px] text-gray-400 leading-normal flex items-start gap-1.5 border border-gray-150">
                    <Info className="w-3.5 h-3.5 mt-0.5 text-gray-400 shrink-0" />
                    <span>Nossa IA gera canais puros de voz em altíssima qualidade 24kHz. Se o áudio demorar, o app ativará a voz nativa local do seu celular de segurança.</span>
                  </div>
                </div>

                {/* SATELLITE ACTION */}
                <div className="flex flex-col justify-center items-stretch space-y-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="text-center">
                    <span className="text-[9px] font-mono font-bold text-gray-400 block uppercase tracking-wider">STATUS DA DUBLAGEM</span>
                    <span className="text-xs font-bold text-gray-800">
                      {voiceAudioBase64 ? "✅ Áudio Pronto e Guardado!" : localSpeechFallback ? "🔊 Usando Narrador Nativo" : "❌ Sem Áudio Prévio"}
                    </span>
                  </div>

                  <button
                    onClick={handleGenerateTTSNarration}
                    disabled={isGeneratingAudio}
                    className="w-full py-2.5 px-4 text-xs font-bold bg-black hover:bg-gray-800 text-white rounded-xl font-display flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    {isGeneratingAudio ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Sintetizando Voz...</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-white" />
                        <span>Gerar ou Regerar Narração por IA</span>
                      </>
                    )}
                  </button>
                  
                  {voiceAudioBase64 && (
                    <div className="text-center text-[10px] text-black font-semibold font-mono animate-pulse">
                      Aperte <strong>PLAY</strong> no simulador para reproduzir.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT SIDEBAR: THE PORTRAIT SMARTPHONE SIMULATOR - 5 SPAN */}
          <div className="lg:col-span-5 space-y-6 flex flex-col items-center">
            
            {/* TEXT DESCRIPTION OF FORMAT */}
            <div className="text-center space-y-1">
              <span className="text-[10px] font-mono text-gray-400 tracking-widest block uppercase font-bold">SIMULADOR VISUAL REALISTA</span>
              <p className="text-xs text-gray-500 font-medium">
                {aspectRatio === '16:9' ? "Visualização em Widescreen Horizontal 16:9" : "Visualização Retrato de Celular 9:16"}
              </p>
            </div>

            {/* SMARTPHONE MOBILE or WIDESCREEN MOCKUP CONTAINER */}
            <div className={`relative w-full ${aspectRatio === '16:9' ? 'max-w-[440px] aspect-[16/11] p-4' : 'max-w-[310px] aspect-[9/18.5] p-8'} bg-[#F1F3F5] rounded-3xl border border-gray-200 shadow-inner flex flex-col items-center justify-center relative transition-all duration-300`}>
              
              <div className="absolute top-4 left-6 flex items-center gap-2 bg-white px-2.5 py-1 rounded-full shadow-xs border border-gray-200/50 z-30">
                <div className={`w-1.5 h-1.5 rounded-full bg-green-500 ${isPlaying ? 'animate-ping' : ''}`} />
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-600">Preview Ao Vivo</span>
              </div>

              {/* PHONE CORE CONTAINER FRAME */}
              <div className={`relative w-full ${aspectRatio === '16:9' ? 'aspect-[16/9] rounded-[24px] p-1.5 border-[6px]' : 'aspect-[9/16] rounded-[42px] p-2 border-[8px]'} bg-black border-white shadow-[0_24px_48px_rgba(0,0,0,0.18)] flex flex-col overflow-hidden transition-all duration-300`}>
                
                {/* CAMERA NOTCH MOCK - ONLY PRESENT IN PORTRAIT PHONE FORMAT */}
                {aspectRatio !== '16:9' && (
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-950 rounded-full z-30 flex items-center justify-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-slate-800" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                  </div>
                )}

                {/* VIDEO CANVAS CONTAINER */}
                <div className={`relative flex-1 bg-black ${aspectRatio === '16:9' ? 'rounded-[16px] p-4' : 'rounded-[32px] p-6'} overflow-hidden flex flex-col justify-between z-10 select-none transition-all duration-300`}>
                  
                  {/* THE PORTRAIT/LANDSCAPE BACKDROP BACKGROUND IMAGE */}
                  {!useMultiBackdrops ? (
                    <img 
                      src={currentImageUrl}
                      alt="Short Backdrop"
                      className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none z-0"
                      style={{
                        transform: getBackgroundTransform(),
                        transition: isPlaying ? 'transform 0.1s linear' : 'transform 0.5s ease'
                      }}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="absolute inset-0 z-0">
                      <img 
                        src={backdropTitleUrl}
                        alt="Backdrop Title"
                        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-opacity duration-500"
                        style={{
                          opacity: currentActiveSlideShown === 0 ? 1 : 0,
                          transform: getBackgroundTransform(),
                          transition: 'opacity 0.5s ease-in-out, transform 0.1s linear'
                        }}
                        referrerPolicy="no-referrer"
                      />
                      <img 
                        src={backdropVerseUrl}
                        alt="Backdrop Verse"
                        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-opacity duration-500"
                        style={{
                          opacity: currentActiveSlideShown === 1 ? 1 : 0,
                          transform: getBackgroundTransform(),
                          transition: 'opacity 0.5s ease-in-out, transform 0.1s linear'
                        }}
                        referrerPolicy="no-referrer"
                      />
                      <img 
                        src={backdropReflectionUrl}
                        alt="Backdrop Reflection"
                        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-opacity duration-500"
                        style={{
                          opacity: currentActiveSlideShown === 2 ? 1 : 0,
                          transform: getBackgroundTransform(),
                          transition: 'opacity 0.5s ease-in-out, transform 0.1s linear'
                        }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* GLASS OVERLAY DIMMER */}
                  <div 
                    className="absolute inset-0 bg-black z-10 pointer-events-none transition-all duration-300"
                    style={{ opacity: overlayOpacity / 100 }}
                  />

                  {/* TIMELINE PROGRESS INDICATOR AT THE TOP EDGE */}
                  <div className={`absolute left-6 right-6 h-[2px] bg-white/20 rounded-full overflow-hidden z-20 ${aspectRatio === '16:9' ? 'top-4' : 'top-8'}`}>
                    <div 
                      className="h-full bg-white transition-all duration-100 ease-linear shadow"
                      style={{ width: `${isPlaying ? progress : 0}%` }}
                    />
                  </div>

                  {/* TOP BRAND EMBLEM OR LOGO */}
                  <div className={`relative w-full text-center z-20 space-y-1 ${aspectRatio === '16:9' ? 'mt-2' : 'mt-6'}`}>
                    {logoType !== 'none' && (
                      <div className={`text-white drop-shadow flex justify-center ${aspectRatio === '16:9' ? 'text-sm' : 'text-lg'}`}>
                        {logoType === 'cross' ? '✝' : logoType === 'bible' ? '📖' : '💖'}
                      </div>
                    )}
                    <div className="font-mono text-[8px] text-white/60 tracking-wider">
                      {watermarkText || '@CriadorCristao'}
                    </div>
                  </div>

                  {/* CENTRAL CONTENT BOX SLIDESHOW */}
                  <div 
                    className={`relative z-20 my-auto w-full transition-all flex flex-col justify-center ${aspectRatio === '16:9' ? 'min-h-[110px]' : 'min-h-[220px]'}`}
                    style={{
                      fontFamily: fontFamily === 'serif' ? 'Playfair Display, serif' : fontFamily === 'mono' ? 'JetBrains Mono, monospace' : 'Inter, sans-serif',
                      textAlign: textAlignment,
                      justifyContent: textPosition === 'top' ? 'flex-start' : textPosition === 'bottom' ? 'flex-end' : 'center',
                      color: textColor
                    }}
                  >
                    <div className="w-full">
                      
                      {/* SLIDE ID 0: THE INSPIRED TITLE */}
                      {currentActiveSlideShown === 0 && (
                        <div className={`${aspectRatio === '16:9' ? 'space-y-1' : 'space-y-3'} transition-opacity duration-150`}>
                          <span 
                            className={`inline-block px-2 text-[8px] font-bold tracking-widest uppercase rounded bg-white/15 text-white`}
                            style={{ borderColor: accentColor, borderLeftWidth: '3px' }}
                          >
                            Palavra Diária
                          </span>
                          <h3 
                            className={`font-bold tracking-tight drop-shadow-md leading-tight ${aspectRatio === '16:9' ? 'text-xs sm:text-sm pl-4 pr-4' : 'text-xl'}`}
                            style={{ color: accentColor }}
                          >
                            {renderSynchronizedWordsMarkup(title || "Encorajamento", activeTitleWordIdx)}
                          </h3>
                        </div>
                      )}

                      {/* SLIDE ID 1: CODE VERSE BODY */}
                      {currentActiveSlideShown === 1 && (
                        <div className={`${aspectRatio === '16:9' ? 'space-y-1' : 'space-y-3'} transition-opacity duration-150`}>
                          <blockquote className={`font-semibold italic text-slate-100 drop-shadow-lg leading-relaxed ${aspectRatio === '16:9' ? 'text-[9.5px] leading-tight px-4' : 'text-sm'}`}>
                            “{renderSynchronizedWordsMarkup(verse, activeVerseWordIdx)}”
                          </blockquote>
                          <cite 
                            className={`block font-bold drop-shadow uppercase tracking-wider not-italic ${aspectRatio === '16:9' ? 'text-[8px] mt-0.5' : 'text-[10px]'}`}
                            style={{ color: accentColor }}
                          >
                            — {reference}
                          </cite>
                        </div>
                      )}

                      {/* SLIDE ID 2: DEVOTIONAL EXPLANATION REFLECTION */}
                      {currentActiveSlideShown === 2 && (
                        <div className={`${aspectRatio === '16:9' ? 'space-y-0.5 px-4' : 'space-y-3'} transition-opacity duration-150`}>
                          <span className={`uppercase font-mono tracking-widest text-slate-300 ${aspectRatio === '16:9' ? 'text-[7px]' : 'text-[8px]'}`}>Reflexão do dia:</span>
                          <div className={`leading-normal drop-shadow font-medium ${aspectRatio === '16:9' ? 'text-[9px] leading-tight line-clamp-4' : 'text-xs'}`}>
                            {renderSynchronizedWordsMarkup(currentReflectionPageTextShown || reflection, activeReflectionWordIdx)}
                          </div>
                          {reflectionPagesList.length > 1 && (
                            <div className="text-[7px] font-mono text-white/50 tracking-wider">
                              Parte {currentReflectionPageIdx + 1} de {reflectionPagesList.length}
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </div>

                  {/* BOTTOM MEDIA UTILITIES: PLAY BAR / EQUALIZER SCREEN */}
                  <div className="relative z-20 flex flex-col items-center gap-3.5 mt-auto">
                    
                    {/* SLIDES BULLET DOTS */}
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((slideIdx) => (
                        <button
                          key={slideIdx}
                          onClick={() => {
                            setActiveSlide(slideIdx);
                            if (slideIdx === 0) {
                              setPlaybackTime(0);
                            } else if (slideIdx === 1) {
                              setPlaybackTime(4);
                            } else {
                              setPlaybackTime(15);
                            }
                          }}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            currentActiveSlideShown === slideIdx ? 'bg-white w-4' : 'bg-white/40 w-1.5'
                          }`}
                        />
                      ))}
                    </div>

                    {/* MINI EQ MUSIC AUDIO VISUALIZER FOR DEEP CRAFT FEEL */}
                    <div className="h-5 flex items-end justify-center gap-0.5 px-3 rounded-full bg-black/40 backdrop-blur-xs">
                      {[1, 2, 3, 4, 5, 4, 3, 2, 4, 6].map((baseH, idx) => (
                        <div
                          key={idx}
                          className="w-0.5 rounded-t bg-amber-400 transition-all duration-300"
                          style={{
                            height: isPlaying ? `${Math.floor(Math.random() * 12) + 2}px` : '2px'
                          }}
                        />
                      ))}
                    </div>

                    {/* USER NOTIFICATION FOR CAPTION POP UP */}
                    <div className="text-[7px] font-mono text-white/40 uppercase tracking-widest text-center">
                      CRIADO 9:16 VERTICAL
                    </div>
                  </div>

                </div>

                {/* INTEGRATED EXTERNAL CONTROLLERS FOR MOBILE */}
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30">
                  {isPlaying ? (
                    <button 
                      onClick={stopPlayback}
                      className="h-10 w-10 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5 fill-white" />
                    </button>
                  ) : (
                    <button 
                      onClick={startPlayback}
                      className="h-10 w-10 flex items-center justify-center rounded-full bg-white text-[#1A1A1A] shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-[#1A1A1A] ml-0.5" />
                    </button>
                  )}
                </div>

              </div>
            </div>

            {/* SPEED SLIDE BAR INTERVAL */}
            <div className="w-full max-w-[310px] bg-white border border-gray-200 rounded-2xl p-4 flex justify-between items-center text-xs shadow-xs">
              <span className="font-mono text-gray-500 font-bold uppercase tracking-wider text-[10px]">INTERVALO:</span>
              <div className="flex gap-1.5">
                {[3, 4, 6, 8].map((s) => (
                  <button
                    key={s}
                    onClick={() => setPlaybackSpeed(s)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      playbackSpeed === s ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-black'
                    }`}
                  >
                    {s}s
                  </button>
                ))}
              </div>
            </div>

            {/* DOWNLOAD & CLIPBOARD AREA */}
            <div className="w-full max-w-[310px] space-y-3">
              <div className="text-[10px] font-mono text-gray-400 tracking-wider uppercase mb-1">Opções de Exportação</div>
              
              {/* Opções de Vídeo */}
              <div className="space-y-2 border border-gray-150 p-3 rounded-2xl bg-gray-50/50">
                <span className="text-[11px] font-medium text-gray-500 block mb-1">
                  Gerar e Baixar Vídeo ({aspectRatio === '16:9' ? 'Horizontal 16:9' : 'Vertical 9:16'})
                </span>
                
                <button
                  onClick={() => handleExportVideo(true)}
                  disabled={isExportingVideo}
                  className={`w-full flex items-center justify-between gap-2 p-3 font-display font-medium text-xs rounded-xl border border-transparent shadow-xs transition-all active:scale-95 cursor-pointer ${
                    isExportingVideo 
                      ? 'bg-amber-100 text-amber-900 border border-amber-200 cursor-not-allowed' 
                      : 'bg-black hover:bg-gray-800 text-white'
                  }`}
                >
                  {isExportingVideo ? (
                    <>
                      <span className="flex items-center gap-1.5 text-left">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                        <span>Gerando Vídeo...</span>
                      </span>
                      <span className="text-amber-700 font-mono text-[10px]">{videoExportProgress}%</span>
                    </>
                  ) : (
                    <>
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>Exportar Vídeo MP4 (Mais Compatível)</span>
                      </span>
                      <span className="text-[10px] uppercase font-mono text-gray-400">MP4</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleExportVideo(false)}
                  disabled={isExportingVideo}
                  className={`w-full flex items-center justify-between gap-2 p-2.5 font-display font-medium text-[11px] rounded-xl border transition-all active:scale-95 cursor-pointer ${
                    isExportingVideo
                      ? 'bg-gray-150 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:text-black'
                  }`}
                >
                  {isExportingVideo ? (
                    <span className="text-[10px] text-gray-400">Processando...</span>
                  ) : (
                    <>
                      <span className="flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5 text-gray-400" />
                        <span>Exportar Vídeo WebM (Alta Velocidade)</span>
                      </span>
                      <span className="text-[10px] uppercase font-mono text-gray-400">WebM</span>
                    </>
                  )}
                </button>
              </div>

              {/* Opções de Outros Formatos */}
              <div className="space-y-1.5 border border-gray-150 p-3 rounded-2xl bg-gray-50/50">
                <span className="text-[11px] font-medium text-gray-500 block mb-1">Outros Formatos de Mídia</span>
                
                {/* WAV/MP3 Audio export button */}
                <button
                  onClick={handleExportNarrationAudio}
                  disabled={!voiceAudioBase64}
                  className={`w-full flex items-center justify-between gap-2 p-2.5 font-display font-medium text-[11px] rounded-xl border transition-all active:scale-95 ${
                    voiceAudioBase64
                      ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:text-black cursor-pointer'
                      : 'bg-gray-100 text-gray-400 border-gray-150 cursor-not-allowed'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Baixar Áudio da Narração</span>
                  </span>
                  <span className="text-[10px] uppercase font-mono text-gray-400">{voiceAudioBase64 ? 'MP3/WAV' : 'Gere áudio primeiro'}</span>
                </button>

                {/* Static image export button */}
                <button
                  onClick={handleExportLandscape}
                  className="w-full flex items-center justify-between gap-2 p-2.5 font-display font-medium text-[11px] rounded-xl border bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:text-black transition-all active:scale-95 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Salvar Imagem Estática</span>
                  </span>
                  <span className="text-[10px] uppercase font-mono text-gray-400">PNG</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleCopyToClipboard(`${title}\n\n"${verse}" — ${reference}\n\n${reflection}`, 'roteiro')}
                  className="flex items-center justify-center gap-1.5 p-2.5 text-xs font-mono font-medium rounded-xl bg-white hover:bg-gray-50 text-gray-700 hover:text-black border border-gray-200 shadow-xs transition-all cursor-pointer"
                >
                  {copiedSection === 'roteiro' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-600" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-gray-500" />
                      <span>Copiar Roteiro</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleCopyToClipboard(`${youtubeDescription}\n\n${hashtags.join(' ')}`, 'legenda')}
                  className="flex items-center justify-center gap-1.5 p-2.5 text-xs font-mono font-medium rounded-xl bg-white hover:bg-gray-50 text-gray-700 hover:text-black border border-gray-200 shadow-xs transition-all cursor-pointer"
                >
                  {copiedSection === 'legenda' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-600" />
                      <span>Copiada!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-gray-500" />
                      <span>Legenda + Tags</span>
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* SEED OF GOD LOG PANEL */}
            <div className="w-full max-w-[310px] p-4 bg-white rounded-2xl border border-gray-200/85 shadow-xs space-y-2 text-xs">
              <span className="font-mono text-gray-400 uppercase tracking-widest block font-bold text-[9px]">Conteúdo Estendido</span>
              <div className="space-y-1 font-sans text-xs text-gray-600">
                <p className="font-bold text-gray-800">Descrição sugerida para Redes Sociais:</p>
                <p className="line-clamp-2 italic text-gray-500 pr-1 select-all hover:text-black transition-all">
                  {youtubeDescription}
                </p>
                <p className="text-black font-semibold tracking-tight">
                  {hashtags.join(' ')}
                </p>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-white py-10 text-center text-xs text-gray-400 font-mono">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p>Criador de Shorts Cristãos • Palavra Edificante do Dia</p>
          <p>Desenvolvido com IA do Google Studio • © 2026</p>
        </div>
      </footer>

      {/* MODAL: EXPLORE BIBLE STUDY INTEL & TOPICS */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl text-[#1A1A1A]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-150 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-black" />
                <h3 className="text-md font-display font-bold text-gray-950 tracking-tight">Explorar e Buscar Versículos por Tema</h3>
              </div>
              <button 
                onClick={() => setIsSearchModalOpen(false)}
                className="text-gray-400 hover:text-black hover:bg-gray-100 transition-all text-xs font-semibold py-1 px-2.5 rounded-lg border border-gray-200 cursor-pointer"
              >
                Fechar ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Descreva o sentimento, dúvida ou tema para buscar na Bíblia:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchTopic}
                    onChange={(e) => setSearchTopic(e.target.value)}
                    placeholder="ex: cura, ansiedade, perseverança, sabedoria, vitórias..."
                    className="flex-1 bg-gray-50 text-gray-900 rounded-xl p-2.5 text-xs border border-gray-200 focus:outline-none focus:border-black"
                    onKeyDown={(e) => e.key === 'Enter' && handleQuerySuggestedVerses()}
                  />
                  <button
                    onClick={handleQuerySuggestedVerses}
                    disabled={isSearchingVerses}
                    className="px-4 py-2 text-xs font-bold bg-black hover:bg-gray-800 text-white rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {isSearchingVerses ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    <span>Consultar IA</span>
                  </button>
                </div>
              </div>

              {/* Suggestions results List */}
              <div className="space-y-3">
                <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest block">SUGESTÕES LOCALIZADAS:</span>
                
                {isSearchingVerses ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2">
                    <div className="w-8 h-8 rounded-full border-2 border-t-black border-r-transparent border-gray-200 animate-spin" />
                    <span className="text-[11px] text-gray-500 font-mono">Buscando na sabedoria das escrituras...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {searchSuggestions.map((item, index) => (
                      <div 
                        key={index}
                        onClick={() => {
                          setVerse(item.text);
                          setReference(item.reference);
                          setVoiceAudioBase64(null); // delete old audio
                          setIsSearchModalOpen(false);
                          setApiLogMessage(`Importado com sucesso: ${item.reference}`);
                        }}
                        className="p-4 bg-gray-50 hover:bg-white border border-gray-150 hover:border-black rounded-2xl cursor-pointer group transition-all"
                      >
                        <div className="flex justify-between items-center font-display font-bold text-gray-900 text-xs mb-1">
                          <span>{item.reference}</span>
                          <span className="text-[9px] font-mono text-gray-500 group-hover:text-black bg-gray-100 px-2.5 py-0.5 rounded-full uppercase">{item.theme || "Bíblia"}</span>
                        </div>
                        <p className="text-xs text-gray-600 italic mb-2 leading-relaxed">
                          “{item.text}”
                        </p>
                        {item.reflectionPrompt && (
                          <div className="text-[10px] text-gray-550 font-mono font-medium">
                            💡 Motivação: {item.reflectionPrompt}
                          </div>
                        )}
                        <div className="text-right text-[10px] text-gray-400 group-hover:text-black font-semibold mt-1">
                          Clique para Selecionar ➔
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-150 text-center text-[10px] text-gray-400 font-mono">
              Consulte qualquer tema sagrado de seu agrado para buscar correspondência exata.
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

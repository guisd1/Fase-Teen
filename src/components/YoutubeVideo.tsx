"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icons";

/*
  Vídeo do YouTube com cara de player da loja: toca sozinho (sem som, como os
  navegadores exigem), em loop, sem a barra do YouTube, e preenche o quadro
  como uma foto (corta as beiradas em vez de mostrar bordas pretas).
  A capa fica por cima até o vídeo começar, escondendo a abertura do YouTube.
*/

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  unMute(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  destroy(): void;
}
interface YTEvent { target: YTPlayer; data: number }
declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, options: object) => YTPlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiReady: Promise<void> | null = null;
function loadApi() {
  if (window.YT?.Player) return Promise.resolve();
  apiReady ??= new Promise(resolve => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { previous?.(); resolve(); };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.appendChild(script);
  });
  return apiReady;
}

const PLAYING = 1, PAUSED = 2, ENDED = 0;

export default function YoutubeVideo({ id, aspect, title, controls = true }: {
  id: string;
  /** Largura ÷ altura do vídeo (9/16 nos verticais). */
  aspect: number | null;
  title: string;
  /** false nos cards da vitrine: só toca, sem botões. */
  controls?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const holder = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const [frame, setFrame] = useState<{ w: number; h: number } | null>(null);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const ratio = aspect && aspect > 0 ? aspect : 16 / 9;

  // Maior tamanho em que o vídeo cabe inteiro no quadro (como object-fit: contain); sobra o fundo da loja.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!width || !height) return;
      setFrame(width / height > ratio ? { w: height * ratio, h: height } : { w: width, h: width / ratio });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ratio]);

  useEffect(() => {
    let cancelled = false;
    const target = holder.current;
    loadApi().then(() => {
      if (cancelled || !target || !window.YT) return;
      // O YouTube troca este elemento pelo iframe; fica fora do controle do React.
      const el = document.createElement("div");
      target.appendChild(el);
      player.current = new window.YT.Player(el, {
        host: "https://www.youtube-nocookie.com",
        videoId: id,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1, mute: 1, controls: 0, rel: 0, playsinline: 1, disablekb: 1, fs: 0,
          iv_load_policy: 3, modestbranding: 1, cc_load_policy: 0, loop: 1, playlist: id
        },
        events: {
          onReady: (e: YTEvent) => { e.target.mute(); e.target.playVideo(); },
          onStateChange: (e: YTEvent) => {
            if (e.data === PLAYING) { setPlaying(true); setStarted(true); }
            else if (e.data === PAUSED) setPlaying(false);
            else if (e.data === ENDED) { e.target.seekTo(0, true); e.target.playVideo(); }
          }
        }
      });
    });
    return () => {
      cancelled = true;
      player.current?.destroy();
      player.current = null;
      if (target) target.innerHTML = "";
    };
  }, [id]);

  const togglePlay = () => {
    if (!player.current) return;
    if (playing) player.current.pauseVideo(); else player.current.playVideo();
  };
  const toggleSound = () => {
    if (!player.current) return;
    if (muted) player.current.unMute(); else player.current.mute();
    setMuted(!muted);
  };

  // A capa (4:3, com o vídeo dentro) é posicionada para coincidir com o vídeo.
  const poster = frame && (ratio < 4 / 3 ? { w: frame.h * 4 / 3, h: frame.h } : { w: frame.w, h: frame.w * 3 / 4 });

  return (
    <div className="yt-video" ref={box}>
      {/* Área do vídeo: a capa não passa dela (as bordas desfocadas da capa ficam de fora). */}
      <div className="yt-video-stage" style={frame ? { width: frame.w, height: frame.h } : undefined}>
        <div className="yt-video-frame" ref={holder} title={title} />
        <img className={`yt-video-poster ${started ? "hidden" : ""}`} src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt=""
          style={poster ? { width: poster.w, height: poster.h } : undefined} />
      </div>
      {/* Camada por cima do iframe: o YouTube não mostra título nem logo ao passar o mouse. */}
      <div className="yt-video-shield" onClick={controls ? togglePlay : undefined} aria-hidden />
      {controls && started && !playing && (
        <button type="button" className="yt-video-bigplay" onClick={togglePlay} aria-label="Continuar vídeo"><Icon name="play" /></button>
      )}
      {controls && started && (
        <div className="yt-video-controls">
          <button type="button" onClick={togglePlay} aria-label={playing ? "Pausar" : "Tocar"}><Icon name={playing ? "pause" : "play"} /></button>
          <button type="button" onClick={toggleSound} aria-label={muted ? "Ligar o som" : "Desligar o som"}>
            <Icon name={muted ? "soundOff" : "soundOn"} />
          </button>
        </div>
      )}
    </div>
  );
}

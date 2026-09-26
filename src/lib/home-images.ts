/** Imagens da página inicial trocadas pelo painel (Página inicial). Seguro para o navegador. */
export interface HomeImages {
  /** Fotos do destaque do topo; com mais de uma, alternam sozinhas. Vazio = imagem do arquivo da loja. */
  hero: string[];
  /** Foto ao lado do texto da faixa escura. */
  banner: string | null;
  /** Foto da seção "A marca". */
  about: string | null;
}

export const EMPTY_HOME_IMAGES: HomeImages = { hero: [], banner: null, about: null };
